<?php
// /var/www/tcg.backend/register.php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
session_start();
header('Content-Type: application/json');

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable('/home');
$dotenv->safeLoad();

$db   = $_ENV['TCG_DB_NAME'];
$user = $_ENV['TCG_DB_USER'];
$pass = $_ENV['TCG_DB_PASS'];
$host = $_ENV['TCG_DB_HOST'];
$port = $_ENV['TCG_DB_PORT'] ?? 5432;

try {
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'DB connection failed']);
    exit;
}

$data     = json_decode(file_get_contents('php://input'), true);
$username = trim($data['username'] ?? '');
$email    = trim($data['email'] ?? '');
$password = $data['password'] ?? '';
$referral = trim($data['referral_code'] ?? '');

// Default referral code if empty
if ($referral === '') {
    $referral = 'Legacy';
}

// Validate inputs
if (strlen($username) < 3 || strlen($username) > 20 || !preg_match('/^[\w\- ]+$/', $username)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid username']);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid email']);
    exit;
}
if (strlen($password) < 6) {
    echo json_encode(['status' => 'error', 'message' => 'Password must be at least 6 characters']);
    exit;
}

// Check for duplicates
$stmt = $pdo->prepare("SELECT 1 FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)");
$stmt->execute([$username, $email]);
if ($stmt->fetch()) {
    echo json_encode(['status' => 'error', 'message' => 'Username or email already exists']);
    exit;
}

// Validate referral code exists in referral_links, else fallback to Legacy
$checkRef = $pdo->prepare("SELECT 1 FROM referral_links WHERE code = :c LIMIT 1");
$checkRef->execute([':c' => $referral]);
if (!$checkRef->fetch()) {
    $referral = 'Legacy';
}

// Create user
$hashed = password_hash($password, PASSWORD_BCRYPT);
$eos_id = bin2hex(random_bytes(16));

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("INSERT INTO users (eos_id, username, email, password_hash, created_at, updated_at) 
                           VALUES (?, ?, ?, ?, NOW(), NOW()) RETURNING id");
    $stmt->execute([$eos_id, $username, $email, $hashed]);
    $user_id = (int)$stmt->fetchColumn();

    // Insert referral entry
    $insRef = $pdo->prepare("INSERT INTO referrals (code, referred_user_id, created_at) VALUES (:c, :uid, NOW())");
    $insRef->execute([':c' => $referral, ':uid' => $user_id]);

    $pdo->commit();
} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Registration failed: ' . $e->getMessage()]);
    exit;
}

// Auto-login
$_SESSION['user_id']  = $user_id;
$_SESSION['username'] = $username;

echo json_encode(['status' => 'ok', 'message' => 'Registration successful']);
