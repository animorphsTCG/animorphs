<?php
// /var/www/tcg.backend/lobbies/accept_invite.php
ini_set('display_errors', 1);
error_reporting(E_ALL);
session_start();
require_once '/var/www/vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable('/home');
$dotenv->safeLoad();

if (!isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit;
}

$userId   = $_SESSION['user_id'];
$inviteId = (int)($_POST['invite_id'] ?? 0);

if (!$inviteId) {
    echo json_encode(['success' => false, 'error' => 'No invite specified']);
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

    $pdo->beginTransaction();

    // 1. Find invite
    $stmt = $pdo->prepare("SELECT * FROM lobby_invites WHERE id = :id AND to_user_id = :uid AND accepted = false AND declined = false FOR UPDATE");
    $stmt->execute(['id' => $inviteId, 'uid' => $userId]);
    $invite = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$invite) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => 'Invite not found or already handled']);
        exit;
    }

    $lobbyId = $invite['lobby_id'];

    // 2. Mark invite accepted
    $stmt = $pdo->prepare("UPDATE lobby_invites SET accepted = true WHERE id = :id");
    $stmt->execute(['id' => $inviteId]);

    // 3. Add user to lobby participants
    $stmt = $pdo->prepare("
        INSERT INTO lobby_participants (lobby_id, user_id, is_ready)
        VALUES (:lobby, :uid, false)
        ON CONFLICT (lobby_id, user_id) DO NOTHING
    ");
    $stmt->execute(['lobby' => $lobbyId, 'uid' => $userId]);

    // 4. Update presence
    $stmt = $pdo->prepare("
        UPDATE user_presence
        SET in_lobby = :lobby, in_match = NULL, last_seen = now()
        WHERE user_id = :uid
    ");
    $stmt->execute(['lobby' => $lobbyId, 'uid' => $userId]);

    $pdo->commit();

    // Redirect if not explicitly AJAX
    if (!empty($_POST['ajax'])) {
        echo json_encode(['success' => true, 'lobby_id' => $lobbyId]);
    } else {
        header("Location: /my_lobby.php?lobby_id=" . urlencode($lobbyId));
    }
    exit;
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
