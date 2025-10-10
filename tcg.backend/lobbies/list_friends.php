<?php
// list_friends.php — list online friends with Full Game, Battle Pass, and current activity
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

        $stmt = $pdo->prepare("
        SELECT u.id AS user_id,
               u.username,
               up.in_lobby,
               up.in_match,
               EXISTS (
                   SELECT 1 FROM entitlements e
                   WHERE e.user_id = u.id
                     AND e.type = 'full_unlock'
                     AND (e.expires_at IS NULL OR e.expires_at > NOW())
               ) AS has_full_game,
               EXISTS (
                   SELECT 1 FROM entitlements e
                   WHERE e.user_id = u.id
                     AND e.type = 'battle_pass'
                     AND e.expires_at > NOW()
               ) AS has_battle_pass_entitlement
        FROM friends f
        JOIN users u ON u.id = f.friend_user_id
        JOIN user_presence up ON up.user_id = u.id
        WHERE f.user_id = :user
          AND f.status = 'accepted'
          AND up.is_online = true
          AND up.last_seen > (NOW() - interval '2 minutes')
          AND (up.in_lobby IS NULL OR up.in_lobby != (
              SELECT lp.lobby_id FROM lobby_participants lp WHERE lp.user_id = :user LIMIT 1
          ))
    ");
    $stmt->execute(['user' => $userId]);
    $friends = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Only keep friends who have the full game
    $filtered = array_values(array_filter($friends, fn($f) => $f['has_full_game']));

    echo json_encode(['success' => true, 'friends' => $filtered]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
