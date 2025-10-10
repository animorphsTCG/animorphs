<?php
// /var/www/tcg.backend/get_messages.php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
session_start();

header('Content-Type: application/json');

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

try {
    Dotenv::createImmutable('/home')->safeLoad();

    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Not logged in']);
        exit;
    }

    $host = $_ENV['TCG_DB_HOST'] ?? 'localhost';
    $db   = $_ENV['TCG_DB_NAME'] ?? 'tcg';
    $user = $_ENV['TCG_DB_USER'] ?? '';
    $pass = $_ENV['TCG_DB_PASS'] ?? '';
    $port = (int)($_ENV['TCG_DB_PORT'] ?? 5432);

    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$db", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    $uid = (int)($_SESSION['user_id'] ?? 0);
    $fid = (int)($_GET['friend_id'] ?? 0);

    if ($fid <= 0 || $uid <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid user or friend ID', 'uid'=>$uid, 'fid'=>$fid]);
        exit;
    }

    // Ensure users are friends
    $stmt = $pdo->prepare("
        SELECT 1 FROM friends
        WHERE ((user_id=:u AND friend_user_id=:f) OR (user_id=:f AND friend_user_id=:u))
          AND status='accepted'
        LIMIT 1
    ");
    $stmt->execute([':u' => $uid, ':f' => $fid]);

    if (!$stmt->fetchColumn()) {
        http_response_code(403);
        echo json_encode(['error' => 'Not friends']);
        exit;
    }

    // Fetch messages
    $sql = "
        SELECT m.id, m.sender_id, u.username AS sender_name, m.content, m.sent_at
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        WHERE (m.sender_id = :u AND m.receiver_id = :f)
           OR (m.sender_id = :f AND m.receiver_id = :u)
        ORDER BY m.sent_at ASC, m.id ASC
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':u' => $uid, ':f' => $fid]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($messages);

} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: text/plain');
    echo "FATAL ERROR in get_messages.php\n";
    echo $e->getMessage() . "\n";
    echo $e->getTraceAsString();
    exit;
}
