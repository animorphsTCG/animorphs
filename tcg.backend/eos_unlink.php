<?php
require_once __DIR__ . '/eos_config.php';
$userId = require_logged_in_user_id();

// Unlink locally (does not revoke tokens at Epic; for simple linking this is enough)
$pdo->beginTransaction();
try {
    $upd = $pdo->prepare("UPDATE users SET eos_id = NULL, updated_at = NOW() WHERE id = :u");
    $upd->execute([':u' => $userId]);

    $upd2 = $pdo->prepare("UPDATE eos_links SET status='revoked' WHERE user_id = :u");
    $upd2->execute([':u' => $userId]);

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    http_response_code(500);
    exit('Unlink failed.');
}

header('Location: /tcg.frontend/profile.php?eos_unlinked=1');
exit;
