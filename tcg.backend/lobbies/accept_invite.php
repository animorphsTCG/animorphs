<?php require __DIR__ . '/_common.php';

$userId   = require_login();
$inviteId = (int)($_POST['invite_id'] ?? 0);
if (!$inviteId) { http_response_code(400); echo json_encode(['success'=>false,'error'=>'no_invite']); exit; }

$pdo = pdo_tcg();
$pdo->beginTransaction();

try {
    // Load invite
    $inv = $pdo->prepare("
        SELECT i.id, i.lobby_id, l.mode, l.status
        FROM lobby_invites i
        JOIN lobbies l ON l.id = i.lobby_id
        WHERE i.id=:id AND i.to_user_id=:u AND i.accepted=false AND i.declined=false
        FOR UPDATE
    ");
    $inv->execute([':id'=>$inviteId, ':u'=>$userId]);
    $row = $inv->fetch(PDO::FETCH_ASSOC);
    if (!$row) throw new RuntimeException('invalid_invite');

    if ($row['status'] !== 'open') throw new RuntimeException('lobby_closed');

    // Already in another lobby?
    $prs = $pdo->prepare("SELECT in_lobby FROM user_presence WHERE user_id=:u FOR UPDATE");
    $prs->execute([':u'=>$userId]);
    $inLobby = (int)($prs->fetchColumn() ?? 0);
    if ($inLobby && $inLobby !== (int)$row['lobby_id']) throw new RuntimeException('already_in_other_lobby');

    // Capacity
    $cap = lobby_capacity_for_mode($row['mode']);
    $count = (int)$pdo->query("SELECT COUNT(*) FROM lobby_participants WHERE lobby_id = {$row['lobby_id']}")->fetchColumn();
    if ($count >= $cap) throw new RuntimeException('lobby_full');

    // Add participant
    $pdo->prepare("INSERT INTO lobby_participants (lobby_id, user_id, is_ready)
                   VALUES (:l,:u,false)
                   ON CONFLICT (lobby_id, user_id) DO NOTHING")
        ->execute([':l'=>$row['lobby_id'], ':u'=>$userId]);

    // Mark invite accepted
    $pdo->prepare("UPDATE lobby_invites SET accepted=true WHERE id=:id")->execute([':id'=>$inviteId]);

    // Presence
    if ($prs->rowCount() === 0) {
        $pdo->prepare("INSERT INTO user_presence (user_id, is_online, in_lobby, last_seen)
                       VALUES (:u, true, :l, now())
                       ON CONFLICT (user_id) DO UPDATE SET in_lobby=EXCLUDED.in_lobby, last_seen=now()")
            ->execute([':u'=>$userId, ':l'=>$row['lobby_id']]);
    } else {
        $pdo->prepare("UPDATE user_presence SET in_lobby=:l, last_seen=now() WHERE user_id=:u")
            ->execute([':l'=>$row['lobby_id'], ':u'=>$userId]);
    }

    $pdo->commit();
    echo json_encode(['success'=>true,'lobby_id'=>(int)$row['lobby_id']]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(400);
    echo json_encode(['success'=>false,'error'=>$e->getMessage()]);
}
