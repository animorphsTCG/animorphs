<?php
// notifications_api.php — personal notifications (incoming + outgoing invites) JSON
ini_set('display_errors', 1);
error_reporting(E_ALL);
session_start();
require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

header('Content-Type: application/json');

$dotenv = Dotenv::createImmutable('/home');
$dotenv->safeLoad();

if (!isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Not logged in']);
    exit;
}
$userId = $_SESSION['user_id'];

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

    // Incoming invites (to me)
    $stmt = $pdo->prepare("
        SELECT li.id, li.lobby_id, u.username AS from_username, li.created_at
        FROM lobby_invites li
        JOIN users u ON u.id = li.from_user_id
        WHERE li.to_user_id = :uid
          AND li.accepted = false
          AND li.declined = false
        ORDER BY li.created_at DESC
    ");
    $stmt->execute(['uid' => $userId]);
    $incoming = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Outgoing invites (sent by me)
    $stmt = $pdo->prepare("
        SELECT li.id, li.lobby_id, u.username AS to_username, li.created_at, li.accepted, li.declined
        FROM lobby_invites li
        JOIN users u ON u.id = li.to_user_id
        WHERE li.from_user_id = :uid
        ORDER BY li.created_at DESC
    ");
    $stmt->execute(['uid' => $userId]);
    $outgoing = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'incoming_invites' => $incoming,
        'outgoing_invites' => $outgoing,
        'counts' => [
            'incoming' => count($incoming),
            'outgoing' => count($outgoing),
        ],
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
