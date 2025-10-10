<?php
// clear_messages.php — owner clears all messages when leaving/logging out
ini_set('display_errors', 1);
error_reporting(E_ALL);
session_start();
require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable('/home');
$dotenv->safeLoad();

if (!isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

$userId = $_SESSION['user_id'];
$lobbyId = $_POST['lobby_id'] ?? null;

if (!$lobbyId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing lobby_id']);
    exit;
}

try {
    $pdo = new PDO(
        "pgsql:host={$_ENV['TCG_DB_HOST']};port={$_ENV['TCG_DB_PORT']};dbname={$_ENV['TCG_DB_NAME']}",
        $_ENV['TCG_DB_USER'],
        $_ENV['TCG_DB_PASS'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Verify ownership
    $stmt = $pdo->prepare("SELECT owner_id FROM lobbies WHERE id = :lobby");
    $stmt->execute(['lobby' => $lobbyId]);
    $ownerId = $stmt->fetchColumn();

    if ($ownerId != $userId) {
        http_response_code(403);
        echo json_encode(['error' => 'Only lobby owner can clear chat']);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM lobby_messages WHERE lobby_id = :lobby");
    $stmt->execute(['lobby' => $lobbyId]);

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
