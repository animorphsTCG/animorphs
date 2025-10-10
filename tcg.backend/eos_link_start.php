<?php
require_once __DIR__ . '/eos_guard.php';

// Create state + PKCE optional (we'll do state only for CSRF)
$state = random_state();
$_SESSION['eos_oauth_state'] = $state;

// Request scopes that include OpenID so we receive an id_token we can decode.
$scope = rawurlencode('openid profile');

// Build authorize URL
$params = http_build_query([
    'client_id'     => EOS_CLIENT_ID,
    'response_type' => 'code',
    'redirect_uri'  => EOS_REDIRECT_URI,
    'scope'         => 'openid profile',
    'state'         => $state,
]);

$authUrl = EPIC_AUTH_BASE . '/authorize?' . $params;

header('Location: ' . $authUrl);
exit;
