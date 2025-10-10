<?php
require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

header('Content-Type: application/json');

$dotenv = Dotenv::createImmutable('/home');
$dotenv->safeLoad();

$db = $_ENV['TCG_DB_NAME'];
$user = $_ENV['TCG_DB_USER'];
$pass = $_ENV['TCG_DB_PASS'];
$host = $_ENV['TCG_DB_HOST'];
$port = $_ENV['TCG_DB_PORT'] ?? 5432;

$pdo = new PDO("pgsql:host=$host;port=$port;dbname=$db", $user, $pass);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$username = strtolower(trim($_GET['username'] ?? ''));
if (strlen($username) < 3) {
    echo json_encode(["available" => false]);
    exit;
}

$stmt = $pdo->prepare("SELECT 1 FROM users WHERE LOWER(username) = ?");
$stmt->execute([$username]);
echo json_encode(["available" => !$stmt->fetch()]);
