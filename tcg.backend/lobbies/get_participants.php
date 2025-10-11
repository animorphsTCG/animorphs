<?php require __DIR__ . '/_common.php';

$userId  = require_login();
$lobbyId = (int)($_GET['lobby_id'] ?? 0);
if (!$lobbyId) { http_response_code(400); echo json_encode(['error'=>'missing_lobby_id']); exit; }

$pdo = pdo_tcg();
ensure_participant($pdo, $lobbyId, $userId);

// owner_id + participants with ready flags
$stmt = $pdo->prepare("
  SELECT l.owner_id,
         p.user_id, u.username, p.is_ready, p.joined_at
  FROM lobbies l
  LEFT JOIN lobby_participants p ON p.lobby_id = l.id
  LEFT JOIN users u ON u.id = p.user_id
  WHERE l.id = :l
  ORDER BY p.joined_at ASC NULLS LAST
");
$stmt->execute([':l'=>$lobbyId]);

$ownerId = null; $participants=[];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    if ($ownerId === null) $ownerId = (int)$row['owner_id'];
    if ($row['user_id']) {
        $participants[] = [
            'user_id'   => (int)$row['user_id'],
            'username'  => $row['username'],
            'is_ready'  => ($row['is_ready'] === true || $row['is_ready'] === 1 || $row['is_ready'] === 't'),
            'joined_at' => $row['joined_at'],
        ];
    }
}

echo json_encode(['success'=>true, 'owner_id'=>$ownerId, 'participants'=>$participants]);
