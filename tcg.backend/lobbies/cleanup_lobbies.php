<?php
// cleanup_lobbies.php — cron job to remove empty lobbies + expired invites
ini_set('display_errors', 0);
error_reporting(E_ALL);
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

    // 1. Delete empty lobbies
    $stmt = $pdo->query("
        DELETE FROM lobbies l
        WHERE NOT EXISTS (
            SELECT 1 FROM lobby_participants p WHERE p.lobby_id = l.id
        )
        RETURNING id
    ");
    $deletedLobbies = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // 2. Delete expired invites older than 10 minutes
    $stmt2 = $pdo->query("
        DELETE FROM lobby_invites
        WHERE created_at < (NOW() - interval '10 minutes')
          AND accepted = false
          AND declined = false
        RETURNING id
    ");
    $deletedInvites = $stmt2->fetchAll(PDO::FETCH_COLUMN);

    // Logging
    echo "[" . date('Y-m-d H:i:s') . "] Cleanup run completed." . PHP_EOL;
    if ($deletedLobbies) {
        echo "  Deleted lobbies: " . implode(',', $deletedLobbies) . PHP_EOL;
    }
    if ($deletedInvites) {
        echo "  Deleted invites: " . implode(',', $deletedInvites) . PHP_EOL;
    }
    if (!$deletedLobbies && !$deletedInvites) {
        echo "  Nothing to delete this run." . PHP_EOL;
    }

} catch (Exception $e) {
    echo "[" . date('Y-m-d H:i:s') . "] Error: " . $e->getMessage() . PHP_EOL;
}
