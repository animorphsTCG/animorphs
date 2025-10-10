<?php
// set_visibility.php — toggle a lobby between public/private
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
$isPublic = isset($_POST['is_public']) ? (bool)$_POST['is_public'] : null;

if (!$lobbyId || $isPublic === null) {
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

    // Ensure the current user is the lobby owner
    $stmt = $pdo->prepare("SELECT owner_id FROM lobbies WHERE id = :id");
    $stmt->execute(['id' => $lobbyId]);
    $ownerId = $stmt->fetchColumn();

    if ($ownerId != $userId) {
        http_response_code(403);
        echo json_encode(['error' => 'You are not the owner of this lobby']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE lobbies SET is_public = :pub WHERE id = :id");
    $stmt->execute([
        'pub' => $isPublic,
        'id'  => $lobbyId
    ]);

    echo json_encode(['success' => true, 'is_public' => $isPublic]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
