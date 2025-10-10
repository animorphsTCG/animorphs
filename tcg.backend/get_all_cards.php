<?php
// File: /var/www/tcg.backend/get_all_cards.php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
session_start();

header('Content-Type: application/json');

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable('/home');
$dotenv->safeLoad();

$dbname = $_ENV['TCG_DB_NAME'] ?? '';
$dbuser = $_ENV['TCG_DB_USER'] ?? '';
$dbpass = $_ENV['TCG_DB_PASS'] ?? '';
$dbhost = $_ENV['TCG_DB_HOST'] ?? 'localhost';
$dbport = $_ENV['TCG_DB_PORT'] ?? 5432;

try {
    $pdo = new PDO("pgsql:host=$dbhost;port=$dbport;dbname=$dbname", $dbuser, $dbpass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "DB connection failed"]);
    exit;
}

// You can filter here if you want to exclude cards already picked by this user.
// For now we return all cards. Frontend shows everything; backend enforces rules.
$stmt = $pdo->query("
    SELECT token_id, display_name, animorph_type, card_image
    FROM animorph_cards
    ORDER BY token_id ASC
");
$cards = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(["status" => "ok", "cards" => $cards]);
