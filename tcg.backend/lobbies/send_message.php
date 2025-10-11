<?php require __DIR__ . '/_common.php';

$userId  = require_login();
$lobbyId = (int)($_POST['lobby_id'] ?? 0);
$msg     = trim((string)($_POST['message'] ?? ''));

if (!$lobbyId || $msg==='') { http_response_code(400); echo json_encode(['error'=>'bad_params']); exit; }

$pdo = pdo_tcg();
ensure_participant($pdo, $lobbyId, $userId);

$stmt = $pdo->prepare("INSERT INTO lobby_messages (lobby_id, user_id, message) VALUES (:l,:u,:m)");
$stmt->execute([':l'=>$lobbyId, ':u'=>$userId, ':m'=>$msg]);

echo json_encode(['success'=>true]);
