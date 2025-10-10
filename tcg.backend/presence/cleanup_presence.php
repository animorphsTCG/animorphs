<?php
// cleanup_presence.php — mark stale users as offline
require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable('/home');
$dotenv->safeLoad();

try {
    $host = $_ENV['TCG_DB_HOST'];
    $db   = $_ENV['TCG_DB_NAME'];
    $user = $_ENV['TCG_DB_USER'];
    $pass = $_ENV['TCG_DB_PASS'];
    $port = $_ENV['TCG_DB_PORT'] ?? 5432;

    $pdo = new PDO(
        "pgsql:host=$host;port=$port;dbname=$db",
        $user,
        $pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $stmt = $pdo->prepare("
        UPDATE user_presence
        SET is_online = false, in_lobby = NULL, in_match = NULL
        WHERE last_seen < (NOW() - interval '2 minutes')
    ");
    $stmt->execute();

} catch (Exception $e) {
    error_log("Presence cleanup failed: ".$e->getMessage());
}
