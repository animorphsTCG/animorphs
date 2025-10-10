<?php
// get_messages.php — fetch last X messages for a lobby
ini_set('display_errors', 1);
error_reporting(E_ALL);
session_start();
require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable('/home');
$dotenv->safeLoad();

$lobbyId = $_GET['lobby_id'] ?? null;
$limit = intval($_GET['limit'] ?? 50); // default 50 messages

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

    $stmt = $pdo->prepare("
        SELECT m.id, m.user_id, u.username, m.message, m.sent_at
        FROM lobby_messages m
        JOIN users u ON u.id = m.user_id
        WHERE m.lobby_id = :lobby
        ORDER BY m.sent_at DESC
        LIMIT :limit
    ");
    $stmt->bindValue(':lobby', $lobbyId, PDO::PARAM_INT);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();

    $messages = array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC)); // chronological order
    echo json_encode(['messages' => $messages]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
