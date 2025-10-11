<?php require __DIR__ . '/_common.php';

$ownerId = require_login();

$mode = $_POST['mode'] ?? null;
if (!$mode || !in_array($mode, ['1v1','3p','4p'], true)) {
    http_response_code(400);
    echo json_encode(['success'=>false,'error'=>'invalid_mode']);
    exit;
}

$pdo = pdo_tcg();
$pdo->beginTransaction();

try {
    // User must not already be in another lobby
    $prs = $pdo->prepare("SELECT in_lobby FROM user_presence WHERE user_id=:u FOR UPDATE");
    $prs->execute([':u'=>$ownerId]);
    $inLobby = $prs->fetchColumn();
    if ($inLobby) {
        throw new RuntimeException('already_in_lobby');
    }

    // Create lobby
    $stmt = $pdo->prepare("
        INSERT INTO lobbies (owner_id, mode, status, is_public, created_at, updated_at)
        VALUES (:o, :m, 'open', true, NOW(), NOW())
        RETURNING id
    ");
    $stmt->execute([':o'=>$ownerId, ':m'=>$mode]);
    $lobbyId = (int)$stmt->fetchColumn();

    // Owner becomes first participant
    $insP = $pdo->prepare("INSERT INTO lobby_participants (lobby_id, user_id, is_ready) VALUES (:l,:u,false)");
    $insP->execute([':l'=>$lobbyId, ':u'=>$ownerId]);

    // Update presence
    if ($prs->rowCount() === 0) {
        $pdo->prepare("INSERT INTO user_presence (user_id, is_online, in_lobby, last_seen)
                       VALUES (:u, true, :l, now())
                       ON CONFLICT (user_id) DO UPDATE SET in_lobby=EXCLUDED.in_lobby, last_seen=now()")
            ->execute([':u'=>$ownerId, ':l'=>$lobbyId]);
    } else {
        $pdo->prepare("UPDATE user_presence SET in_lobby=:l, last_seen=now() WHERE user_id=:u")
            ->execute([':l'=>$lobbyId, ':u'=>$ownerId]);
    }

    $pdo->commit();
    echo json_encode(['success'=>true,'lobby_id'=>$lobbyId]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(400);
    echo json_encode(['success'=>false,'error'=>$e->getMessage()]);
}
