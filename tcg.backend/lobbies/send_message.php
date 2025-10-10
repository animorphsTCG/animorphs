<?php
// send_message.php — add chat message to a lobby
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
$message = trim($_POST['message'] ?? '');

if (!$lobbyId || $message === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Missing parameters']);
    exit;
}

try {
    $pdo = new PDO(
        "pgsql:host={$_ENV['TCG_DB_HOST']};port={$_ENV['TCG_DB_PORT']};dbname={$_ENV['TCG_DB_NAME']}",
        $_ENV['TCG_DB_USER'],
        $_ENV['TCG_DB_PASS'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $stmt = $pdo->prepare("INSERT INTO lobby_messages (lobby_id, user_id, message) VALUES (:lobby, :user, :msg)");
    $stmt->execute(['lobby' => $lobbyId, 'user' => $userId, 'msg' => $message]);

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
