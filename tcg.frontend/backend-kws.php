<?php
// /var/www/html/tcg.frontend/backend-kws.php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

// Load env
$dotenv = Dotenv::createImmutable('/home');
$dotenv->safeLoad();

$KWS_CLIENT   = $_ENV['KWS_CLIENT_ID'] ?? '';
$KWS_SECRET   = $_ENV['KWS_API_KEY'] ?? '';

if (!$KWS_CLIENT || !$KWS_SECRET) {
    die("Missing KWS credentials");
}

echo "<h3>KWS Debug</h3>";

$tokenUrl = "https://auth.kidswebservices.com/auth/realms/kws/protocol/openid-connect/token";
$fields = [
    'grant_type'    => 'client_credentials',
    'client_id'     => $KWS_CLIENT,
    'client_secret' => $KWS_SECRET
];

$headers = [
    'Content-Type: application/x-www-form-urlencoded',
    'Accept: application/json',
    'User-Agent: curl/7.68.0',
    'Expect:'   // 👈 disables "Expect: 100-continue"
];

$ch = curl_init($tokenUrl);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER         => true,  // capture headers
    CURLOPT_HTTPHEADER     => $headers,
    CURLOPT_POSTFIELDS     => http_build_query($fields),
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
    CURLOPT_HTTP_VERSION   => CURL_HTTP_VERSION_1_1,
]);
$response = curl_exec($ch);
$info = curl_getinfo($ch);
$error = curl_error($ch);
curl_close($ch);

// Split headers + body
list($rawHeaders, $body) = explode("\r\n\r\n", $response, 2);

echo "<h4>PHP curl_getinfo()</h4><pre>" . print_r($info, true) . "</pre>";
if ($error) {
    echo "<p style='color:red'>cURL error: $error</p>";
}
echo "<h4>Raw Request Sent</h4><pre>" . print_r($fields, true) . "</pre>";
echo "<h4>Raw Response Headers</h4><pre>$rawHeaders</pre>";
echo "<h4>Raw Response Body</h4><pre>$body</pre>";
