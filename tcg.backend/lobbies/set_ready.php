<?php require __DIR__ . '/_common.php';

$userId  = require_login();
$lobbyId = (int)($_POST['lobby_id'] ?? 0);
$ready   = isset($_POST['ready']) ? (int)$_POST['ready'] : null;

if (!$lobbyId || ($ready !== 0 && $ready !== 1)) {
    http_response_code(400);
    echo json_encode(['success'=>false,'error'=>'invalid_params']);
    exit;
}

$pdo = pdo_tcg();
ensure_participant($pdo, $lobbyId, $userId);

$upd = $pdo->prepare("UPDATE lobby_participants SET is_ready=:r WHERE lobby_id=:l AND user_id=:u");
$upd->execute([':r'=>$ready, ':l'=>$lobbyId, ':u'=>$userId]);

echo json_encode(['success'=>true,'ready'=> (bool)$ready]);
