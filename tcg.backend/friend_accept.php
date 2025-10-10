<?php
// /var/www/tcg.backend/friend_accept.php
// Accept a friend request and insert reciprocal record (Option A).

ini_set('display_errors', 0);
error_reporting(0);
session_start();

if (!isset($_SESSION['user_id'])) {
    header("Location: /login.php");
    exit;
}

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;
Dotenv::createImmutable('/home')->safeLoad();

// Safe DSN build
$host = $_ENV['TCG_DB_HOST'] ?? 'localhost';
$db   = $_ENV['TCG_DB_NAME'] ?? 'tcg';
$user = $_ENV['TCG_DB_USER'] ?? '';
$pass = $_ENV['TCG_DB_PASS'] ?? '';
$port = (int)($_ENV['TCG_DB_PORT'] ?? 5432);
$dsn  = "pgsql:host={$host};port={$port};dbname={$db}";

try {
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (Throwable $e) {
    http_response_code(500);
    exit("DB connection failed");
}

$uid   = (int)$_SESSION['user_id'];
$reqId = (int)($_POST['request_id'] ?? 0);

// Validate the pending request addressed to the current user
$stmt = $pdo->prepare("SELECT id, user_id, friend_user_id, status
                       FROM friends
                       WHERE id = :id AND friend_user_id = :me AND status = 'pending'
                       LIMIT 1");
$stmt->execute([':id' => $reqId, ':me' => $uid]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
    header("Location: /friends.php?error=invalid_request");
    exit;
}

$otherUserId = (int)$row['user_id'];

$pdo->beginTransaction();
try {
    // Accept original request
    $upd = $pdo->prepare("UPDATE friends SET status='accepted', accepted_at=NOW() WHERE id=:id");
    $upd->execute([':id' => $reqId]);

    // Insert reciprocal record if missing (requires unique (user_id, friend_user_id))
    // If you created the unique index as suggested earlier, this ON CONFLICT is safe.
    $ins = $pdo->prepare("
        INSERT INTO friends (user_id, friend_user_id, status, created_at, accepted_at)
        VALUES (:me, :other, 'accepted', NOW(), NOW())
        ON CONFLICT (user_id, friend_user_id) DO NOTHING
    ");
    $ins->execute([':me' => $uid, ':other' => $otherUserId]);

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    header("Location: /friends.php?error=accept_failed");
    exit;
}

header("Location: /friends.php?accepted=1");
exit;
