<?php
// logout_presence.php — mark user as offline and cleanup lobbies if needed
ini_set('display_errors', 1);
error_reporting(E_ALL);
session_start();
require_once '/var/www/vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable('/home');
$dotenv->safeLoad();

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(200);
    echo json_encode(['success' => true]); // nothing to do
    exit;
}

$userId = $_SESSION['user_id'];

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

    $pdo->beginTransaction();

    // Find if user is in a lobby
    $stmt = $pdo->prepare("SELECT lobby_id FROM lobby_participants WHERE user_id = :uid");
    $stmt->execute(['uid' => $userId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rows as $row) {
        $lobbyId = $row['lobby_id'];

        // Remove from participants
        $pdo->prepare("DELETE FROM lobby_participants WHERE lobby_id = :lobby AND user_id = :uid")
            ->execute(['lobby' => $lobbyId, 'uid' => $userId]);

        // If empty → delete lobby
        $stmt2 = $pdo->prepare("SELECT COUNT(*) FROM lobby_participants WHERE lobby_id = :lobby");
        $stmt2->execute(['lobby' => $lobbyId]);
        $count = (int)$stmt2->fetchColumn();
        if ($count === 0) {
            $pdo->prepare("DELETE FROM lobbies WHERE id = :lobby")->execute(['lobby' => $lobbyId]);
        }
    }

    // Update presence
    $pdo->prepare("
        UPDATE user_presence
        SET is_online = false, in_lobby = NULL, in_match = NULL, last_seen = now()
        WHERE user_id = :uid
    ")->execute(['uid' => $userId]);

    $pdo->commit();

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
