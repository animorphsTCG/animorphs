<?php require __DIR__ . '/_common.php';

$lobbyId = (int)($_GET['lobby_id'] ?? 0);
if (!$lobbyId) { http_response_code(400); echo json_encode(['error'=>'missing_lobby_id']); exit; }

$pdo = pdo_tcg();
$stmt = $pdo->prepare("
  SELECT p.user_id, u.username, p.is_ready
  FROM lobby_participants p
  JOIN users u ON u.id = p.user_id
  WHERE p.lobby_id = :l
  ORDER BY p.joined_at ASC
");
$stmt->execute([':l'=>$lobbyId]);
$participants = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Postgres booleans may arrive as 't'/'f' strings; normalize.
$allReady = count($participants) > 0 && array_reduce(
    $participants,
    fn($ok, $p) => $ok && ($p['is_ready'] === true || $p['is_ready'] === 1 || $p['is_ready'] === 't'),
    true
);

echo json_encode(['success'=>true,'participants'=>$participants,'all_ready'=>$allReady]);
