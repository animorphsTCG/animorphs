<?php
require_once __DIR__ . '/eos_config.php';

$userId = require_logged_in_user_id();

if (!user_has_full_game($pdo, $userId)) {
    // Only users who own the Full Game may link Epic accounts
    http_response_code(302);
    header('Location: /tcg.frontend/store.php?need_full_game=1');
    exit;
}
