<?php require __DIR__ . '/_common.php';

$userId  = require_login();
$lobbyId = (int)($_POST['lobby_id'] ?? 0);
if (!$lobbyId) { http_response_code(400); echo json_encode(['error'=>'missing_lobby_id']); exit; }

$pdo = pdo_tcg();
$pdo->beginTransaction();

try {
    // Fetch lobby
    $stmt = $pdo->prepare("SELECT id, owner_id, mode, status, is_public FROM lobbies WHERE id=:l FOR UPDATE");
    $stmt->execute([':l'=>$lobbyId]);
    $lobby = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$lobby) throw new RuntimeException('lobby_not_found');
    if ($lobby['status'] !== 'open') throw new RuntimeException('lobby_closed');

    // Public join only (invites handled via accept_invite)
    if (!$lobby['is_public']) throw new RuntimeException('lobby_private');

    // Already in another lobby?
    $prs = $pdo->prepare("SELECT in_lobby FROM user_presence WHERE user_id=:u FOR UPDATE");
    $prs->execute([':u'=>$userId]);
    $inLobby = (int)($prs->fetchColumn() ?? 0);
    if ($inLobby && $inLobby !== $lobbyId) throw new RuntimeException('already_in_other_lobby');

    // Capacity
    $cap = lobby_capacity_for_mode($lobby['mode']);
    $count = (int)$pdo->query("SELECT COUNT(*) FROM lobby_participants WHERE lobby_id = {$lobbyId}")->fetchColumn();
    if ($count >= $cap) throw new RuntimeException('lobby_full');

    // Add participant (idempotent)
    $pdo->prepare("INSERT INTO lobby_participants (lobby_id, user_id, is_ready)
                   VALUES (:l,:u,false)
                   ON CONFLICT (lobby_id, user_id) DO NOTHING")
        ->execute([':l'=>$lobbyId, ':u'=>$userId]);

    // Presence
    if ($prs->rowCount() === 0) {
        $pdo->prepare("INSERT INTO user_presence (user_id, is_online, in_lobby, last_seen)
                       VALUES (:u, true, :l, now())
                       ON CONFLICT (user_id) DO UPDATE SET in_lobby=EXCLUDED.in_lobby, last_seen=now()")
            ->execute([':u'=>$userId, ':l'=>$lobbyId]);
    } else {
        $pdo->prepare("UPDATE user_presence SET in_lobby=:l, last_seen=now() WHERE user_id=:u")
            ->execute([':l'=>$lobbyId, ':u'=>$userId]);
    }

    $pdo->commit();
    echo json_encode(['success'=>true,'lobby_id'=>$lobbyId]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(400);
    echo json_encode(['success'=>false,'error'=>$e->getMessage()]);
}
