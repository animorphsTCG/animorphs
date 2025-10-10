<?php
// /var/www/tcg.backend/checkout.php
// Purpose: Validate purchase intent, create order + token, log token in MariaDB (yoco.payment_tokens),
// and 302 to Yoco via tcg_payment.php. Secure SKU mapping + preconditions enforced.

ini_set('display_errors', 0);
error_reporting(0);
session_start();

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

Dotenv::createImmutable('/home')->safeLoad();

// --- Require login ---
if (!isset($_SESSION['user_id'])) {
    header('Location: /login.php');
    exit;
}

$userId = (int)$_SESSION['user_id'];

// --- Read inputs ---
$sku = strtoupper(trim($_GET['sku'] ?? ''));

// --- Secure SKU → success page mapping ---
$allowedSkus = [
    'FULL_UPGRADE' => 'success1.php',
    'BATTLE_PASS'  => 'success2.php',
];

if (!isset($allowedSkus[$sku])) {
    http_response_code(400);
    exit('Invalid product.');
}
$successFile = $allowedSkus[$sku];

// --- PG connect ---
try {
    $pgHost = $_ENV['TCG_DB_HOST'] ?? 'localhost';
    $pgDb   = $_ENV['TCG_DB_NAME'] ?? 'tcg';
    $pgUser = $_ENV['TCG_DB_USER'] ?? '';
    $pgPass = $_ENV['TCG_DB_PASS'] ?? '';
    $pgPort = (int)($_ENV['TCG_DB_PORT'] ?? 5432);

    $pdo = new PDO("pgsql:host={$pgHost};port={$pgPort};dbname={$pgDb}", $pgUser, $pgPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    exit('Database error.');
}

// --- Fetch product (must be active) ---
$stmt = $pdo->prepare("SELECT sku, name, type, price_cents FROM products WHERE active = TRUE AND sku = :sku LIMIT 1");
$stmt->execute([':sku' => $sku]);
$product = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$product) {
    http_response_code(404);
    exit('Product not found.');
}

$amountCents = (int)$product['price_cents'];

// --- Preconditions ---
if ($sku === 'FULL_UPGRADE') {
    // Prevent re-purchase if already owned
    $q = $pdo->prepare("SELECT 1 FROM entitlements WHERE user_id = :u AND type = 'full_unlock' LIMIT 1");
    $q->execute([':u' => $userId]);
    if ($q->fetchColumn()) {
        header('Location: /store.php?already_have_full=1');
        exit;
    }
}

if ($sku === 'BATTLE_PASS') {
    // Must have full unlock
    $chk1 = $pdo->prepare("SELECT 1 FROM entitlements WHERE user_id = :u AND type = 'full_unlock' LIMIT 1");
    $chk1->execute([':u' => $userId]);
    $hasFull = (bool)$chk1->fetchColumn();

    // Must have ID or guardian consent
    $chk2 = $pdo->prepare("SELECT id_number, guardian_consent FROM users WHERE id = :u LIMIT 1");
    $chk2->execute([':u' => $userId]);
    $row = $chk2->fetch(PDO::FETCH_ASSOC);
    $hasIdOrConsent = !empty($row['id_number']) || !empty($row['guardian_consent']);

    if (!$hasFull) {
        header('Location: /store.php?gating=battle_pass');
        exit;
    }
    if (!$hasIdOrConsent) {
        header('Location: /client_profile.php?error=consent_needed');
        exit;
    }
}

// --- Create order (pending) ---
$reference = 'TCG_TX_' . strtoupper(bin2hex(random_bytes(6)));
$token     = bin2hex(random_bytes(16));

$ins = $pdo->prepare("
    INSERT INTO orders (user_id, product_sku, amount_cents, currency, tx_reference, token, status)
    VALUES (:u, :sku, :amt, 'ZAR', :ref, :tok, 'pending')
");
$ins->execute([
    ':u'   => $userId,
    ':sku' => $product['sku'],
    ':amt' => $amountCents,
    ':ref' => $reference,
    ':tok' => $token
]);

// --- MariaDB bookkeeping (yoco.payment_tokens) ---
$my = new mysqli(
    $_ENV['ZY_YOCO_DB_HOST'],
    $_ENV['ZY_YOCO_DB_USER'],
    $_ENV['ZY_YOCO_DB_PASS'],
    $_ENV['ZY_YOCO_DB_NAME']
);
if ($my->connect_error) {
    http_response_code(500);
    exit('Yoco DB error.');
}
$itemsStr = $product['sku']; // reuse column as generic item holder
$stmt2 = $my->prepare("INSERT INTO payment_tokens (token, user_id, song_ids) VALUES (?, ?, ?)");
$stmt2->bind_param('sis', $token, $userId, $itemsStr);
$stmt2->execute();
$stmt2->close();
$my->close();

// --- Build return URLs ---
$successUrl = "https://tcg.mythicmasters.org.za/{$successFile}?token={$token}&reference={$reference}&sku={$product['sku']}";
$cancelUrl  = "https://tcg.mythicmasters.org.za/store.php?cancel=1";
$failureUrl = "https://tcg.mythicmasters.org.za/store.php?failed=1";

// --- Redirect to Yoco TCG payment initiator ---
// Force LIVE for TCG by sending mode=live (per-flow decision, independent of other apps)
$query = http_build_query([
    'user_id'     => $userId,
    'amount'      => $amountCents,  // cents
    'currency'    => 'ZAR',
    'description' => $product['name'],
    'source'      => 'tcg',
    'items'       => $product['sku'],
    'token'       => $token,
    'success_url' => $successUrl,
    'cancel_url'  => $cancelUrl,
    'failure_url' => $failureUrl,
    'mode'        => 'live'
]);

header("Location: https://yoco.mythicmasters.org.za/tcg_payment.php?{$query}");
exit;
