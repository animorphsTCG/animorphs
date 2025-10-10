<?php
// mark_invite.php — accept/decline a lobby invite
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

$userId    = $_SESSION['user_id'];
$inviteId  = $_POST['invite_id'] ?? null;
$accepted  = isset($_POST['accepted']) ? (bool)$_POST['accepted'] : null;
$declined  = isset($_POST['declined']) ? (bool)$_POST['declined'] : null;

if (!$inviteId || ($accepted === null && $declined === null)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing parameters']);
    exit;
}

try {
    $host = $_ENV['TCG_DB_HOST'];
    $db   = $_ENV['TCG_DB_NAME'];
    $user = $_ENV['TCG_DB_USER'];
    $pass = $_ENV['TCG_DB_PASS'];
    $port = $_ENV['TCG_DB_PORT'] ?? 5432;

    $pdo = new PDO(
        "pgsql:host=$host;port=$port;dbname=$db",
        $user,
        $pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Load invite, ensure current user is the recipient to accept/decline
    $stmt = $pdo->prepare("SELECT to_user_id, from_user_id FROM lobby_invites WHERE id = :id");
    $stmt->execute(['id' => $inviteId]);
    $inv = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$inv) {
        http_response_code(404);
        echo json_encode(['error' => 'Invite not found']);
        exit;
    }

    if ($accepted) {
        if ((int)$inv['to_user_id'] !== (int)$userId) {
            http_response_code(403);
            echo json_encode(['error' => 'Only the recipient can accept an invite']);
            exit;
        }
        $stmt = $pdo->prepare("UPDATE lobby_invites SET accepted = true WHERE id = :id");
        $stmt->execute(['id' => $inviteId]);
    } elseif ($declined) {
        if ((int)$inv['to_user_id'] !== (int)$userId) {
            http_response_code(403);
            echo json_encode(['error' => 'Only the recipient can decline an invite']);
            exit;
        }
        $stmt = $pdo->prepare("UPDATE lobby_invites SET declined = true WHERE id = :id");
        $stmt->execute(['id' => $inviteId]);
    }

    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
