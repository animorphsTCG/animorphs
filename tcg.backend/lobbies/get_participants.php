<?php
// get_participants.php — returns participants + owner_id for a given lobby
ini_set('display_errors', 1);
error_reporting(E_ALL);
session_start();
require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable('/home');
$dotenv->safeLoad();

$lobbyId = $_GET['lobby_id'] ?? null;

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

    // Get owner id
    $stmt = $pdo->prepare("SELECT owner_id FROM lobbies WHERE id = :lobby");
    $stmt->execute(['lobby' => $lobbyId]);
    $ownerId = $stmt->fetchColumn();

    if (!$ownerId) {
        http_response_code(404);
        echo json_encode(['error' => 'Lobby not found']);
        exit;
    }

    // Get participants
    $stmt = $pdo->prepare("
        SELECT p.user_id, u.username
        FROM lobby_participants p
        JOIN users u ON u.id = p.user_id
        WHERE p.lobby_id = :lobby
        ORDER BY p.joined_at ASC
    ");
    $stmt->execute(['lobby' => $lobbyId]);
    $participants = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'owner_id' => (int)$ownerId,
        'participants' => $participants
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
