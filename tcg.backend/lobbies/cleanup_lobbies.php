<?php
// /var/www/tcg.backend/lobbies/cleanup_lobbies.php
// Safe house-keeping. Can be run via cron (e.g., every 10 minutes).
require __DIR__ . '/_common.php';

$pdo = pdo_tcg();

$logPath = __DIR__ . '/cleanup.log';
$log = function(string $line) use ($logPath) {
    @file_put_contents($logPath, sprintf("[%s] %s\n", date('Y-m-d H:i:s'), $line), FILE_APPEND);
};

try {
    // 1) Remove accepted/declined invites older than 7 days
    $delInv = $pdo->prepare("
        DELETE FROM lobby_invites
        WHERE (accepted = true OR declined = true)
          AND created_at < now() - interval '7 days'
    ");
    $delInv->execute();
    $log("deleted invites: " . $delInv->rowCount());

    // 2) Remove lobbies with 0 participants for > 30 minutes
    // (CASCADE removes participants/messages due to FK)
    $delLobby = $pdo->prepare("
        DELETE FROM lobbies l
        WHERE l.status='open'
          AND l.updated_at < now() - interval '30 minutes'
          AND NOT EXISTS (SELECT 1 FROM lobby_participants p WHERE p.lobby_id = l.id)
    ");
    $delLobby->execute();
    $log("deleted empty lobbies: " . $delLobby->rowCount());
} catch (Throwable $e) {
    $log("error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success'=>false,'error'=>'cleanup_error']);
    exit;
}

echo json_encode(['success'=>true]);
