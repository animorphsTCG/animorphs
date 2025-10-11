<?php require __DIR__ . '/_common.php';

$ownerId = require_login();
$lobbyId = (int)($_POST['lobby_id'] ?? 0);
$public  = isset($_POST['is_public']) ? (int)$_POST['is_public'] : null;

if (!$lobbyId || ($public !== 0 && $public !== 1)) {
    http_response_code(400);
    echo json_encode(['success'=>false,'error'=>'invalid_params']);
    exit;
}

$pdo = pdo_tcg();
// Owner check
$own = $pdo->prepare("SELECT owner_id FROM lobbies WHERE id=:l");
$own->execute([':l'=>$lobbyId]);
if ((int)($own->fetchColumn() ?? 0) !== $ownerId) {
    http_response_code(403); echo json_encode(['success'=>false,'error'=>'not_owner']); exit;
}

$pdo->prepare("UPDATE lobbies SET is_public=:p, updated_at=now() WHERE id=:l")
    ->execute([':p'=>($public===1), ':l'=>$lobbyId]);

echo json_encode(['success'=>true,'is_public'=> (bool)$public]);
