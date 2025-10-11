<?php require __DIR__ . '/_common.php';

$ownerId = require_login();
$lobbyId = (int)($_POST['lobby_id'] ?? 0);
if (!$lobbyId) { http_response_code(400); echo json_encode(['error'=>'bad_params']); exit; }

$pdo = pdo_tcg();
// Only owner can purge messages
$own = $pdo->prepare("SELECT owner_id FROM lobbies WHERE id=:l");
$own->execute([':l'=>$lobbyId]);
if ((int)($own->fetchColumn() ?? 0) !== $ownerId) {
    http_response_code(403); echo json_encode(['success'=>false,'error'=>'not_owner']); exit;
}

$pdo->prepare("DELETE FROM lobby_messages WHERE lobby_id=:l")->execute([':l'=>$lobbyId]);
echo json_encode(['success'=>true]);
