<?php require __DIR__ . '/_common.php';

$userId  = require_login();
$lobbyId = (int)($_POST['lobby_id'] ?? 0);
if (!$lobbyId) { http_response_code(400); echo json_encode(['error'=>'bad_params']); exit; }

$pdo = pdo_tcg();
$pdo->beginTransaction();

try {
    // Fetch lobby & owner
    $st = $pdo->prepare("SELECT owner_id FROM lobbies WHERE id=:l FOR UPDATE");
    $st->execute([':l'=>$lobbyId]);
    $ownerId = (int)($st->fetchColumn() ?: 0);
    if (!$ownerId) throw new RuntimeException('lobby_not_found');

    // Must be participant
    $chk = $pdo->prepare("SELECT 1 FROM lobby_participants WHERE lobby_id=:l AND user_id=:u");
    $chk->execute([':l'=>$lobbyId, ':u'=>$userId]);
    if (!$chk->fetchColumn()) throw new RuntimeException('not_in_lobby');

    // Remove participant
    $pdo->prepare("DELETE FROM lobby_participants WHERE lobby_id=:l AND user_id=:u")
        ->execute([':l'=>$lobbyId, ':u'=>$userId]);

    // Clear presence
    $pdo->prepare("UPDATE user_presence SET in_lobby=NULL, last_seen=now() WHERE user_id=:u")
        ->execute([':u'=>$userId]);

    if ($userId === $ownerId) {
        // Reassign owner to the oldest participant if any, else delete lobby
        $next = $pdo->prepare("
            SELECT user_id FROM lobby_participants
            WHERE lobby_id=:l
            ORDER BY joined_at ASC
            LIMIT 1
        ");
        $next->execute([':l'=>$lobbyId]);
        $newOwner = (int)($next->fetchColumn() ?? 0);

        if ($newOwner) {
            $pdo->prepare("UPDATE lobbies SET owner_id=:o, updated_at=now() WHERE id=:l")
                ->execute([':o'=>$newOwner, ':l'=>$lobbyId]);
        } else {
            // No one left: delete lobby (cascades to messages/participants)
            $pdo->prepare("DELETE FROM lobbies WHERE id=:l")->execute([':l'=>$lobbyId]);
        }
    }

    $pdo->commit();
    echo json_encode(['success'=>true]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(400);
    echo json_encode(['success'=>false,'error'=>$e->getMessage()]);
}
