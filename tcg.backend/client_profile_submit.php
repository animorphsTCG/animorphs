<?php
// /var/www/html/tcg.frontend/client_profile_submit.php

ini_set('display_errors', 0);
error_reporting(0);
session_start();

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;
Dotenv::createImmutable('/home')->safeLoad();

$host = $_ENV['TCG_DB_HOST'] ?? 'localhost';
$db   = $_ENV['TCG_DB_NAME'] ?? 'tcg';
$user = $_ENV['TCG_DB_USER'] ?? '';
$pass = $_ENV['TCG_DB_PASS'] ?? '';
$port = (int) ($_ENV['TCG_DB_PORT'] ?? 5432);

$dsn = "pgsql:host={$host};port={$port};dbname={$db}";
try {
    $pdo = new PDO($dsn, $user, $pass, [ PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo "<pre style='color:red'>DB Error: ".htmlspecialchars($e->getMessage())."</pre>";
    exit;
}

$uid = $_SESSION['user_id'] ?? null;
if (!$uid) {
    header("Location: /login.php");
    exit;
}

function clean($s){ return trim((string)$s); }

// --- 1. Profile updates (user_info) ---
if (isset($_POST['first_name'])) {
    $first_name       = clean($_POST['first_name']);
    $last_name        = clean($_POST['last_name']);
    $age              = (int)$_POST['age'];
    $country          = clean($_POST['country']);
    $timezone         = clean($_POST['timezone']);
    $gender           = clean($_POST['gender']);
    $eta_online       = clean($_POST['eta_online']);
    $favorite_animorph= clean($_POST['favorite_animorph']);

    $stmt = $pdo->prepare("SELECT 1 FROM user_info WHERE user_id = :u");
    $stmt->execute([':u'=>$uid]);
    $exists = $stmt->fetchColumn();

    if ($exists) {
        $q = $pdo->prepare("
          UPDATE user_info
          SET first_name=:f, last_name=:l, age=:a, country=:c, timezone=:t,
              gender=:g, eta_online=:eta, favorite_animorph=:fav, updated_at=NOW()
          WHERE user_id=:u
        ");
    } else {
        $q = $pdo->prepare("
          INSERT INTO user_info (user_id, first_name, last_name, age, country, timezone,
                                 gender, eta_online, favorite_animorph, updated_at)
          VALUES (:u,:f,:l,:a,:c,:t,:g,:eta,:fav,NOW())
        ");
    }

    $q->execute([
        ':u'=>$uid, ':f'=>$first_name, ':l'=>$last_name, ':a'=>$age, ':c'=>$country,
        ':t'=>$timezone, ':g'=>$gender, ':eta'=>$eta_online, ':fav'=>$favorite_animorph
    ]);
}

// --- 2. ID/Passport submission (users.id_number) ---
if (isset($_POST['id_number'])) {
    $id_number = clean($_POST['id_number']);

    if ($id_number !== '') {
        $q = $pdo->prepare("UPDATE users SET id_number=:id, kyc_status='verified', kyc_verified_at=NOW() WHERE id=:u");
        $q->execute([':id'=>$id_number, ':u'=>$uid]);
    }
}

// --- 3. Referral code creation (referral_links) ---
if (isset($_POST['referral_code'])) {
    $referral_code = clean($_POST['referral_code']);

    if (preg_match('/^[A-Za-z0-9]{3,8}$/', $referral_code)) {
        // Check if user already has a code
        $stmt = $pdo->prepare("SELECT 1 FROM referral_links WHERE referrer_user_id=:u");
        $stmt->execute([':u'=>$uid]);
        $hasCode = $stmt->fetchColumn();

        if (!$hasCode) {
            // Ensure uniqueness
            $stmt = $pdo->prepare("SELECT 1 FROM referral_links WHERE LOWER(code)=LOWER(:c)");
            $stmt->execute([':c'=>$referral_code]);
            $exists = $stmt->fetchColumn();

            if (!$exists) {
                $q = $pdo->prepare("INSERT INTO referral_links (code, referrer_user_id, created_at) VALUES (:c,:u,NOW())");
                $q->execute([':c'=>$referral_code, ':u'=>$uid]);
            }
        }
    }
}

// Redirect back to profile
header("Location: /client_profile.php?updated=1");
exit;
