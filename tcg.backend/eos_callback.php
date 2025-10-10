<?php
require_once __DIR__ . '/eos_guard.php';

// Validate state
if (!isset($_GET['state']) || !hash_equals($_SESSION['eos_oauth_state'] ?? '', $_GET['state'])) {
    http_response_code(400);
    exit('Invalid state.');
}
unset($_SESSION['eos_oauth_state']);

// Must have code
if (!isset($_GET['code'])) {
    http_response_code(400);
    exit('Missing authorization code.');
}

// Exchange code -> tokens
$tokenUrl = EPIC_API_AUTH_BASE . '/oauth/token';
$post = [
    'grant_type'    => 'authorization_code',
    'code'          => $_GET['code'],
    'redirect_uri'  => EOS_REDIRECT_URI,
    'client_id'     => EOS_CLIENT_ID,
    'client_secret' => EOS_CLIENT_SECRET,
];

$ch = curl_init($tokenUrl);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query($post),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 20,
    CURLOPT_HTTPHEADER => ['Accept: application/json']
]);
$resp = curl_exec($ch);
$http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err  = curl_error($ch);
curl_close($ch);

if ($resp === false || $http !== 200) {
    http_response_code(502);
    exit('Token exchange failed.');
}

$data = json_decode($resp, true);
$idToken = $data['id_token'] ?? null;
file_put_contents("/tmp/eas_id_token.txt", $idToken);
if (!$idToken) {
    http_response_code(500);
    exit('id_token not returned.');
}

// Decode id_token to get Epic Account ID (sub) and (optionally) name
$payload = decode_id_token($idToken);
$epicId  = $payload['sub']  ?? null;
$display = $payload['name'] ?? null;

if (!$epicId) {
    http_response_code(500);
    exit('Could not extract Epic Account ID.');
}

$userId = (int)$_SESSION['user_id'];

// Guard uniqueness (users.eos_id has UNIQUE, but we also check).
// If another account already linked this Epic ID, block.
$chk = $pdo->prepare("SELECT id FROM users WHERE eos_id = :eid AND id <> :me LIMIT 1");
$chk->execute([':eid' => $epicId, ':me' => $userId]);
if ($chk->fetch()) {
    http_response_code(409);
    exit('This Epic account is already linked to another user.');
}

// Upsert users.eos_id
$pdo->beginTransaction();
try {
    $upd = $pdo->prepare("UPDATE users SET eos_id = :eid, updated_at = NOW() WHERE id = :u");
    $upd->execute([':eid' => $epicId, ':u' => $userId]);

    // Record/Upsert in eos_links as well
    $ins = $pdo->prepare("
        INSERT INTO eos_links (user_id, eos_account_id, status)
        VALUES (:u, :eid, 'linked')
        ON CONFLICT (user_id) DO UPDATE SET eos_account_id = EXCLUDED.eos_account_id, status='linked', linked_at = NOW()
    ");
    $ins->execute([':u' => $userId, ':eid' => $epicId]);

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    http_response_code(500);
    exit('Linking failed.');
}

// Success — back to profile with a flag
header('Location: /tcg.frontend/profile.php?eos_linked=1');
exit;
