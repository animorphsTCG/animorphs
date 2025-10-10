<?php
// /var/www/html/tcg.frontend/ajax/check_referral_code.php

ini_set('display_errors', 0);
error_reporting(0);

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;
Dotenv::createImmutable('/home')->safeLoad();

$host = $_ENV['TCG_DB_HOST'] ?? 'localhost';
$db   = $_ENV['TCG_DB_NAME'] ?? 'tcg';
$user = $_ENV['TCG_DB_USER'] ?? '';
$pass = $_ENV['TCG_DB_PASS'] ?? '';
$port = (int) ($_ENV['TCG_DB_PORT'] ?? 5432);

header('Content-Type: application/json');

$dsn = "pgsql:host={$host};port={$port};dbname={$db}";
try {
    $pdo = new PDO($dsn, $user, $pass, [ PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION ]);
} catch (Throwable $e) {
    echo json_encode(['error'=>true, 'msg'=>'DB error']);
    exit;
}

$code = isset($_GET['code']) ? trim($_GET['code']) : '';
if (!preg_match('/^[A-Za-z0-9]{3,8}$/', $code)) {
    echo json_encode(['taken'=>true, 'msg'=>'Invalid format']);
    exit;
}

$stmt = $pdo->prepare("SELECT 1 FROM referral_links WHERE LOWER(code) = LOWER(:c) LIMIT 1");
$stmt->execute([':c'=>$code]);
$taken = (bool)$stmt->fetchColumn();

echo json_encode(['taken'=>$taken]);
