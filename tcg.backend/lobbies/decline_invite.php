<?php require __DIR__ . '/_common.php';

$userId   = require_login();
$inviteId = (int)($_POST['invite_id'] ?? 0);
if (!$inviteId) { http_response_code(400); echo json_encode(['success'=>false,'error'=>'no_invite']); exit; }

$pdo = pdo_tcg();
$upd = $pdo->prepare("UPDATE lobby_invites SET declined=true WHERE id=:id AND to_user_id=:u AND accepted=false AND declined=false");
$upd->execute([':id'=>$inviteId, ':u'=>$userId]);

echo json_encode(['success'=>true, 'declined'=>$upd->rowCount() > 0]);
