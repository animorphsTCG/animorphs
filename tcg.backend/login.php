<?php
// File: /var/www/tcg.backend/login.php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
session_start();

header('Content-Type: application/json');
require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable('/home');
$dotenv->safeLoad();

$dbname = $_ENV['TCG_DB_NAME'];
$dbuser = $_ENV['TCG_DB_USER'];
$dbpass = $_ENV['TCG_DB_PASS'];
$dbhost = $_ENV['TCG_DB_HOST'];
$dbport = $_ENV['TCG_DB_PORT'] ?? 5432;

try {
    $pdo = new PDO("pgsql:host=$dbhost;port=$dbport;dbname=$dbname", $dbuser, $dbpass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database connection failed."]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
$usernameOrEmail = trim($input['username_or_email'] ?? '');
$password = trim($input['password'] ?? '');

if (!$usernameOrEmail || !$password) {
    echo json_encode(["status" => "error", "message" => "Username/email and password are required."]);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(:input) OR LOWER(email) = LOWER(:input) LIMIT 1");
$stmt->execute(['input' => $usernameOrEmail]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !isset($user['password_hash']) || !password_verify($password, $user['password_hash'])) {
    echo json_encode(["status" => "error", "message" => "Invalid login credentials."]);
    exit;
}

// Login successful
$_SESSION['user_id'] = $user['id'];
$_SESSION['username'] = $user['username'];
echo json_encode(["status" => "ok", "message" => "Login successful."]);
exit;
