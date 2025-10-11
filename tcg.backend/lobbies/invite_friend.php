<?php require __DIR__ . '/_common.php';

$ownerId  = require_login();
$lobbyId  = (int)($_POST['lobby_id'] ?? 0);
$friendId = (int)($_POST['friend_id'] ?? 0);

if (!$lobbyId || !$friendId) { http_response_code(400); echo json_encode(['error'=>'bad_params']); exit; }

$pdo = pdo_tcg();

// Owner check
$own = $pdo->prepare("SELECT owner_id FROM lobbies WHERE id=:l");
$own->execute([':l'=>$lobbyId]);
if ((int)($own->fetchColumn() ?? 0) !== $ownerId) {
    http_response_code(403); echo json_encode(['error'=>'not_owner']); exit;
}

// Confirm accepted friendship
$fr = $pdo->prepare("SELECT 1 FROM friends WHERE user_id=:u AND friend_user_id=:f AND status='accepted'");
$fr->execute([':u'=>$ownerId, ':f'=>$friendId]);
if (!$fr->fetchColumn()) { http_response_code(403); echo json_encode(['error'=>'not_friends']); exit; }

// De-dupe pending invite
$du = $pdo->prepare("SELECT 1 FROM lobby_invites WHERE lobby_id=:l AND to_user_id=:f AND accepted=false AND declined=false");
$du->execute([':l'=>$lobbyId, ':f'=>$friendId]);
if ($du->fetchColumn()) { echo json_encode(['success'=>true,'note'=>'invite_already_pending']); exit; }

// Insert invite
$ins = $pdo->prepare("INSERT INTO lobby_invites (lobby_id, from_user_id, to_user_id) VALUES (:l,:from,:to)");
$ins->execute([':l'=>$lobbyId, ':from'=>$ownerId, ':to'=>$friendId]);

echo json_encode(['success'=>true]);
