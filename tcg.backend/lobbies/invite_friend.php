<?php
// invite_friend.php — invite a friend to your lobby
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

$userId   = $_SESSION['user_id'];
$lobbyId  = $_POST['lobby_id'] ?? null;
$friendId = $_POST['friend_id'] ?? null;

if (!$lobbyId || !$friendId) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing parameters']);
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

    // Ensure lobby exists and current user is the owner
    $stmt = $pdo->prepare("SELECT owner_id FROM lobbies WHERE id = :id");
    $stmt->execute(['id' => $lobbyId]);
    $ownerId = $stmt->fetchColumn();
    if ($ownerId != $userId) {
        http_response_code(403);
        echo json_encode(['error' => 'Only the lobby owner can invite friends']);
        exit;
    }

    // Insert invite
    $stmt = $pdo->prepare("
        INSERT INTO lobby_invites (lobby_id, from_user_id, to_user_id)
        VALUES (:lobby, :from, :to)
    ");
    $stmt->execute([
        'lobby' => $lobbyId,
        'from'  => $userId,
        'to'    => $friendId
    ]);

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
