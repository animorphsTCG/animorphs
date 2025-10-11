<?php require __DIR__ . '/_common.php';

$ownerId = require_login();
$lobbyId = (int)($_POST['lobby_id'] ?? 0);
$userId  = (int)($_POST['user_id'] ?? 0);

if (!$lobbyId || !$userId) { http_response_code(400); echo json_encode(['error'=>'bad_params']); exit; }

$pdo = pdo_tcg();
$pdo->beginTransaction();

try {
    // Owner check
    $own = $pdo->prepare("SELECT owner_id FROM lobbies WHERE id=:l FOR UPDATE");
    $own->execute([':l'=>$lobbyId]);
    $owner = (int)($own->fetchColumn() ?? 0);
    if ($owner !== $ownerId) throw new RuntimeException('not_owner');

    if ($userId === $ownerId) throw new RuntimeException('cannot_kick_owner');

    // Is target participant?
    $chk = $pdo->prepare("SELECT 1 FROM lobby_participants WHERE lobby_id=:l AND user_id=:u");
    $chk->execute([':l'=>$lobbyId, ':u'=>$userId]);
    if (!$chk->fetchColumn()) throw new RuntimeException('user_not_in_lobby');

    // Remove
    $pdo->prepare("DELETE FROM lobby_participants WHERE lobby_id=:l AND user_id=:u")
        ->execute([':l'=>$lobbyId, ':u'=>$userId]);

    // Clear presence
    $pdo->prepare("UPDATE user_presence SET in_lobby=NULL, last_seen=now() WHERE user_id=:u")
        ->execute([':u'=>$userId]);

    $pdo->commit();
    echo json_encode(['success'=>true]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(400);
    echo json_encode(['success'=>false,'error'=>$e->getMessage()]);
}
