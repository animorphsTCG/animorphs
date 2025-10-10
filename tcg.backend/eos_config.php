<?php
// Central EOS + DB bootstrap, production‑safe
ini_set('display_errors', 0);
error_reporting(E_ALL);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable('/home');
$dotenv->safeLoad();

// ----- Postgres (tcg) -----
$PG_HOST = $_ENV['TCG_DB_HOST'] ?? 'localhost';
$PG_DB   = $_ENV['TCG_DB_NAME'] ?? 'tcg';
$PG_USER = $_ENV['TCG_DB_USER'] ?? '';
$PG_PASS = $_ENV['TCG_DB_PASS'] ?? '';
$PG_PORT = (int)($_ENV['TCG_DB_PORT'] ?? 5432);

try {
    $pdo = new PDO(
        "pgsql:host=$PG_HOST;port=$PG_PORT;dbname=$PG_DB",
        $PG_USER,
        $PG_PASS,
        [ PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION ]
    );
} catch (Throwable $e) {
    http_response_code(500);
    exit('DB connection failed.');
}

// ----- EOS creds from /home/.env -----
define('EOS_PRODUCT_ID',     $_ENV['EOS_PRODUCT_ID']     ?? '');
define('EOS_CLIENT_ID',      $_ENV['EOS_CLIENT_ID']      ?? '');
define('EOS_CLIENT_SECRET',  $_ENV['EOS_CLIENT_SECRET']  ?? '');
define('EOS_APP_ID',         $_ENV['EOS_APP_ID']         ?? '');
define('EOS_SANDBOX_ID',     $_ENV['EOS_SANDBOX_ID']     ?? '');
define('EOS_DEPLOYMENT_ID',  $_ENV['EOS_DEPLOYMENT_ID']  ?? '');

// IMPORTANT: Epic/EAS OAuth endpoints.
// If your org uses the newer *.epicgames.dev host, you can swap BASEs below later without changing the rest of the code.
define('EPIC_AUTH_BASE',     'https://www.epicgames.com/id');            // authorize UI
define('EPIC_API_AUTH_BASE', 'https://api.epicgames.com/auth/v1');       // token

// Where Epic should send the user back after consent:
define('EOS_REDIRECT_URI',   'https://tcg.mythicmasters.org.za/tcg.frontend/eos_callback.php');

// Security helper
function require_logged_in_user_id(): int {
    if (!isset($_SESSION['user_id']) || !is_numeric($_SESSION['user_id'])) {
        http_response_code(302);
        header('Location: /tcg.frontend/login.php');
        exit;
    }
    return (int)$_SESSION['user_id'];
}

// Entitlement check (must own Full Game)
function user_has_full_game(PDO $pdo, int $userId): bool {
    $q = $pdo->prepare("SELECT 1 FROM entitlements WHERE user_id = :u AND type = 'full_unlock' LIMIT 1");
    $q->execute([':u' => $userId]);
    return (bool)$q->fetchColumn();
}

// Random state generator
function random_state(int $len = 48): string {
    return rtrim(strtr(base64_encode(random_bytes($len)), '+/', '-_'), '=');
}

// Safe base64url decode for JWT
function b64url_decode(string $b64): string {
    $b64 = strtr($b64, '-_', '+/');
    $pad = strlen($b64) % 4;
    if ($pad > 0) $b64 .= str_repeat('=', 4 - $pad);
    return base64_decode($b64);
}

// Decode JWT w/o verifying signature (we only need the Epic Account ID; verification is optional here.
// If you want full verification, add JWKS fetch + signature check.)
function decode_id_token(string $jwt): array {
    $parts = explode('.', $jwt);
    if (count($parts) < 2) return [];
    $payload = json_decode(b64url_decode($parts[1]), true);
    return is_array($payload) ? $payload : [];
}
