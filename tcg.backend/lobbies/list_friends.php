<?php require __DIR__ . '/_common.php';

$userId = require_login();
$pdo = pdo_tcg();

$stmt = $pdo->prepare("
  SELECT f.friend_user_id AS user_id, u.username
  FROM friends f
  JOIN users u ON u.id = f.friend_user_id
  WHERE f.user_id = :u AND f.status = 'accepted'
  ORDER BY u.username ASC
");
$stmt->execute([':u'=>$userId]);
$friends = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['success'=>true,'friends'=>$friends]);
