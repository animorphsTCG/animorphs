<?php
// /var/www/tcg.backend/lobbies/kick_player.php
ini_set('display_errors', 1);
error_reporting(E_ALL);
session_start();
require_once '/var/www/vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable('/home');
$dotenv->safeLoad();

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit;
}

$ownerId      = $_SESSION['user_id'];
$lobbyId      = (int)($_POST['lobby_id'] ?? 0);
$targetUserId = (int)($_POST['target_user_id'] ?? 0);

if (!$lobbyId || !$targetUserId) {
    echo json_encode(['success' => false, 'error' => 'Lobby ID and target user required']);
    exit;
}

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

    // 1. Verify owner
    $stmt = $pdo->prepare("SELECT owner_id FROM lobbies WHERE id = :lobby");
    $stmt->execute(['lobby' => $lobbyId]);
    $lobby = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$lobby) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => 'Lobby not found']);
        exit;
    }

    if ((int)$lobby['owner_id'] !== $ownerId) {
        $pdo->rollBack();
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Only the lobby owner can kick players']);
        exit;
    }

    // 2. Remove target user from participants
    $stmt = $pdo->prepare("DELETE FROM lobby_participants WHERE lobby_id = :lobby AND user_id = :uid");
    $stmt->execute(['lobby' => $lobbyId, 'uid' => $targetUserId]);

    // 3. Clear target user presence
    $stmt = $pdo->prepare("
        UPDATE user_presence
        SET in_lobby = NULL, last_seen = now()
        WHERE user_id = :uid
    ");
    $stmt->execute(['uid' => $targetUserId]);

    // 4. Check if lobby has any participants left
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM lobby_participants WHERE lobby_id = :lobby");
    $stmt->execute(['lobby' => $lobbyId]);
    $count = (int)$stmt->fetchColumn();

    if ($count === 0) {
        // Delete the empty lobby
        $stmt = $pdo->prepare("DELETE FROM lobbies WHERE id = :lobby");
        $stmt->execute(['lobby' => $lobbyId]);
    }

    $pdo->commit();

    echo json_encode(['success' => true, 'message' => 'Player kicked', 'lobby_empty' => ($count === 0)]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
