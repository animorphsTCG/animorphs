<?php require __DIR__ . '/_common.php';

$userId  = require_login();
$lobbyId = (int)($_GET['lobby_id'] ?? 0);
$limit   = max(1, min(200, (int)($_GET['limit'] ?? 50)));

if (!$lobbyId) { http_response_code(400); echo json_encode(['error'=>'missing_lobby_id']); exit; }

$pdo = pdo_tcg();
ensure_participant($pdo, $lobbyId, $userId);

$stmt = $pdo->prepare("
  SELECT m.id, m.user_id, u.username, m.message, m.sent_at
  FROM lobby_messages m
  JOIN users u ON u.id = m.user_id
  WHERE m.lobby_id = :l
  ORDER BY m.sent_at DESC
  LIMIT :lim
");
$stmt->bindValue(':l', $lobbyId, PDO::PARAM_INT);
$stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
$stmt->execute();

$messages = array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC)); // chronological
echo json_encode(['success'=>true,'messages'=>$messages]);
