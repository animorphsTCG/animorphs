<?php
// /var/www/tcg.backend/friend_request.php
// Handle sending friend requests

ini_set('display_errors', 1);
error_reporting(E_ALL);
session_start();

if (!isset($_SESSION['user_id'])) {
    header("Location: /login.php");
    exit;
}

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;
Dotenv::createImmutable('/home')->safeLoad();

$host = $_ENV['TCG_DB_HOST'] ?? 'localhost';
$db   = $_ENV['TCG_DB_NAME'] ?? 'tcg';
$user = $_ENV['TCG_DB_USER'] ?? '';
$pass = $_ENV['TCG_DB_PASS'] ?? '';
$port = (int)($_ENV['TCG_DB_PORT'] ?? 5432);

try {
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$db", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    exit("DB connection failed");
}

$uid = (int)$_SESSION['user_id'];
$friendId = (int)($_POST['friend_id'] ?? 0);

if ($friendId <= 0 || $friendId === $uid) {
    header("Location: /all_users.php?error=invalid_request");
    exit;
}

// Require full game
$q = $pdo->prepare("SELECT 1 FROM entitlements WHERE user_id=:u AND type='full_unlock' LIMIT 1");
$q->execute([':u' => $uid]);
if (!$q->fetchColumn()) {
    header("Location: /all_users.php?error=must_own_full");
    exit;
}

// Check if already friends or pending
$chk = $pdo->prepare("SELECT 1 FROM friends WHERE (user_id=:u AND friend_user_id=:f) OR (user_id=:f AND friend_user_id=:u) LIMIT 1");
$chk->execute([':u'=>$uid, ':f'=>$friendId]);
if ($chk->fetchColumn()) {
    header("Location: /all_users.php?error=already_related");
    exit;
}

// Insert request
$ins = $pdo->prepare("INSERT INTO friends (user_id, friend_user_id, status) VALUES (:u,:f,'pending')");
$ins->execute([':u'=>$uid, ':f'=>$friendId]);

header("Location: /friends.php?request_sent=1");
exit;
