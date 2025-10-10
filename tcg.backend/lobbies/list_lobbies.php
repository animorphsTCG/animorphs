<?php
// list_lobbies.php — show all open lobbies
ini_set('display_errors', 1);
error_reporting(E_ALL);
session_start();
require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable('/home');
$dotenv->safeLoad();

$pdo = new PDO(
    "pgsql:host={$_ENV['TCG_DB_HOST']};port={$_ENV['TCG_DB_PORT']};dbname={$_ENV['TCG_DB_NAME']}",
    $_ENV['TCG_DB_USER'],
    $_ENV['TCG_DB_PASS'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

try {
    $stmt = $pdo->query("
        SELECT l.id, l.mode, l.status, u.username AS owner_name,
               COUNT(p.id) AS participants
        FROM lobbies l
        JOIN users u ON u.id = l.owner_id
        LEFT JOIN lobby_participants p ON p.lobby_id = l.id
        WHERE l.status = 'open'
        GROUP BY l.id, u.username
        ORDER BY l.created_at DESC
    ");
    $lobbies = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['lobbies' => $lobbies]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
