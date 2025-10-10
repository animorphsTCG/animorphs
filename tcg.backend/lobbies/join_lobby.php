<?php
// /var/www/tcg.backend/lobbies/join_lobby.php
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

$host = $_ENV['TCG_DB_HOST'];
$db   = $_ENV['TCG_DB_NAME'];
$user = $_ENV['TCG_DB_USER'];
$pass = $_ENV['TCG_DB_PASS'];
$port = $_ENV['TCG_DB_PORT'];

try {
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$db", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Insert participant if not already in
    $stmt = $pdo->prepare("INSERT INTO lobby_participants (lobby_id, user_id) VALUES (:lobby_id, :user_id) 
        ON CONFLICT (lobby_id, user_id) DO NOTHING");
    $stmt->execute(['lobby_id' => $lobbyId, 'user_id' => $userId]);

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
