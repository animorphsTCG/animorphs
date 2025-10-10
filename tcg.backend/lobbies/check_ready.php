<?php
// check_ready.php — returns participants with ready state + all_ready flag
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

    $stmt = $pdo->prepare("
        SELECT p.user_id, u.username, p.is_ready
        FROM lobby_participants p
        JOIN users u ON u.id = p.user_id
        WHERE p.lobby_id = :lobby
        ORDER BY p.joined_at ASC
    ");
    $stmt->execute(['lobby' => $lobbyId]);
    $participants = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $allReady = count($participants) > 0 && array_reduce($participants, fn($carry, $p) => $carry && $p['is_ready'], true);

    echo json_encode([
        'success' => true,
        'participants' => $participants,
        'all_ready' => $allReady
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
