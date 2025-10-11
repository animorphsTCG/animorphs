<?php require __DIR__ . '/_common.php';

$pdo = pdo_tcg();

try {
    $stmt = $pdo->query("
        SELECT l.id, l.mode, l.status, l.is_public,
               u.username AS owner_name,
               COUNT(p.id) AS participants
        FROM lobbies l
        JOIN users u ON u.id = l.owner_id
        LEFT JOIN lobby_participants p ON p.lobby_id = l.id
        WHERE l.status = 'open' AND l.is_public = true
        GROUP BY l.id, u.username
        ORDER BY l.created_at DESC
    ");
    $lobbies = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success'=>true,'lobbies'=>$lobbies]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'error'=>'db_error']);
}
