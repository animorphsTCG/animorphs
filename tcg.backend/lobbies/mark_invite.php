<?php require __DIR__ . '/_common.php';

$userId   = require_login();
$inviteId = (int)($_POST['invite_id'] ?? 0);
$action   = $_POST['action'] ?? ''; // 'accept' | 'decline'

if (!$inviteId || !in_array($action, ['accept','decline'], true)) {
    http_response_code(400); echo json_encode(['success'=>false,'error'=>'bad_params']); exit;
}

if ($action === 'accept') {
    // Reuse accept logic
    $_POST['invite_id'] = $inviteId;
    require __DIR__ . '/accept_invite.php';
    exit;
} else {
    // decline
    $_POST['invite_id'] = $inviteId;
    require __DIR__ . '/decline_invite.php';
    exit;
}
