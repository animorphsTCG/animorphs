<?php
// Handle sending messages between friends
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['status'=>'error','message'=>'Not logged in']);
    exit;
}

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;
Dotenv::createImmutable('/home')->safeLoad();

$host = $_ENV['TCG_DB_HOST'] ?? 'localhost';
$db   = $_ENV['TCG_DB_NAME'] ?? 'tcg';
$user = $_ENV['TCG_DB_USER'] ?? '';
$pass = $_ENV['TCG_DB_PASS'] ?? '';
$port = (int)($_ENV['TCG_DB_PORT'] ?? 5432);

try {
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$db",$user,$pass,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>'DB connection failed']);
    exit;
}

$senderId   = (int)$_SESSION['user_id'];
$receiverId = (int)($_POST['receiver_id'] ?? 0);
$content    = trim($_POST['content'] ?? '');

if ($receiverId <= 0 || $content === '') {
    echo json_encode(['status'=>'error','message'=>'Missing receiver or content']);
    exit;
}

// Ensure they are friends (accepted in either direction)
$chk = $pdo->prepare("
    SELECT 1 FROM friends
    WHERE ((user_id=:s AND friend_user_id=:r) OR (user_id=:r AND friend_user_id=:s))
      AND status='accepted'
    LIMIT 1
");
$chk->execute([':s'=>$senderId, ':r'=>$receiverId]);
if (!$chk->fetchColumn()) {
    echo json_encode(['status'=>'error','message'=>'You can only message friends']);
    exit;
}

// Insert message with sent_at timestamp
$stmt = $pdo->prepare("
    INSERT INTO messages (sender_id, receiver_id, content, sent_at)
    VALUES (:s,:r,:c, NOW())
");
$stmt->execute([':s'=>$senderId, ':r'=>$receiverId, ':c'=>$content]);

echo json_encode(['status'=>'ok','message'=>'Sent']);
