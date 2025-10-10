<?php
// /var/www/tcg.backend/success1.php
// Fulfilment for FULL_UPGRADE (permanent full unlock)

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
session_start();

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

Dotenv::createImmutable('/home')->safeLoad();

function http_fail($msg, $code = 400) {
    http_response_code($code);
    echo "<!doctype html><html><body style='font-family:sans-serif;background:#ffecec;color:#900;padding:2rem;'>
            <h2>❌ Error</h2><p>".htmlspecialchars($msg)."</p></body></html>";
    exit;
}

if (!isset($_SESSION['user_id'])) {
    header('Location: /login.php');
    exit;
}

$userId    = (int) $_SESSION['user_id'];
$token     = $_GET['token']     ?? '';
$reference = $_GET['reference'] ?? '';
$sku       = $_GET['sku']       ?? '';

if ($token === '' || $reference === '' || $sku !== 'FULL_UPGRADE') {
    http_fail('Invalid fulfilment parameters.');
}

// ---- Connect Postgres (tcg) ----
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
    http_fail('Database connection failed (PG).', 500);
}

// ---- Connect MariaDB (yoco) ----
$my = @new mysqli(
    $_ENV['ZY_YOCO_DB_HOST'] ?? 'localhost',
    $_ENV['ZY_YOCO_DB_USER'] ?? '',
    $_ENV['ZY_YOCO_DB_PASS'] ?? '',
    $_ENV['ZY_YOCO_DB_NAME'] ?? 'yoco'
);
if ($my->connect_error) http_fail('Database connection failed (Yoco).', 500);

// 1) Validate token (unused + belongs to this user), read stored SKU
$lookup = $my->prepare("SELECT user_id, song_ids, used FROM payment_tokens WHERE token = ? LIMIT 1");
$lookup->bind_param('s', $token);
$lookup->execute();
$res = $lookup->get_result();
if ($res->num_rows === 0) {
    $lookup->close(); $my->close();
    http_fail('Invalid token.');
}
$row = $res->fetch_assoc();
$lookup->close();

$tokenUserId = (int)$row['user_id'];
$tokenSku    = trim((string)$row['song_ids']); // reused column
$tokenUsed   = (int)$row['used'];

if ($tokenUserId !== $userId) {
    $my->close(); http_fail('Token does not belong to the logged-in user.');
}
if ($tokenSku !== 'FULL_UPGRADE') {
    $my->close(); http_fail('Token SKU mismatch.');
}

// 2) Find matching pending order by token (and set paid if not yet)
$pdo->beginTransaction();
try {
    // Get order
    $o = $pdo->prepare("SELECT id, status, amount_cents FROM orders WHERE token = :tok AND user_id = :u LIMIT 1");
    $o->execute([':tok' => $token, ':u' => $userId]);
    $order = $o->fetch(PDO::FETCH_ASSOC);
    if (!$order) throw new Exception('Order not found for this token.');
    $orderId     = (int)$order['id'];
    $amountCents = (int)$order['amount_cents'];
    $alreadyPaid = ($order['status'] === 'paid');

    // Mark token used (MariaDB) – but do not error if already used (idempotent)
    if ($tokenUsed == 0) {
        $my->query("UPDATE payment_tokens SET used = 1 WHERE token = '". $my->real_escape_string($token) ."'");
    }

    // Mark order paid (idempotent)
    if (!$alreadyPaid) {
        $upd = $pdo->prepare("UPDATE orders SET status='paid', paid_at = now(), tx_reference = :ref WHERE id = :id");
        $upd->execute([':ref' => $reference, ':id' => $orderId]);
    }

    // 3) Grant entitlement: permanent full_unlock
    // One-per-user enforced by unique constraint (user_id,type)
    $ent = $pdo->prepare("
        INSERT INTO entitlements (user_id, type, start_at, expires_at, source_order_id)
        VALUES (:u, 'full_unlock', now(), NULL, :oid)
        ON CONFLICT (user_id, type) DO NOTHING
    ");
    $ent->execute([':u' => $userId, ':oid' => $orderId]);

    // 4) Referral reward (450 Digi) – only once per order
    // Find referrer of this buyer
    $ref = $pdo->prepare("SELECT rl.referrer_user_id
                          FROM referrals r
                          JOIN referral_links rl ON rl.code = r.code
                          WHERE r.referred_user_id = :u
                          LIMIT 1");
    $ref->execute([':u' => $userId]);
    $refRow = $ref->fetch(PDO::FETCH_ASSOC);

    if ($refRow) {
        $referrerId = (int)$refRow['referrer_user_id'];

        // Insert earning idempotently (unique order_id,type)
        $earn = $pdo->prepare("
            INSERT INTO referral_earnings (referrer_user_id, referred_user_id, order_id, type, amount_digi)
            VALUES (:rid, :uid, :oid, 'full_unlock', 1000)
            ON CONFLICT (order_id, type) DO NOTHING
        ");
        $earn->execute([':rid' => $referrerId, ':uid' => $userId, ':oid' => $orderId]);

        // Credit wallet if the insert above actually created a row
        // (Check rows affected via a quick existence check)
        $chk = $pdo->prepare("SELECT 1 FROM referral_earnings WHERE order_id = :oid AND type = 'full_unlock'");
        $chk->execute([':oid' => $orderId]);
        if ($chk->fetchColumn()) {
            // Upsert wallet balance
            $pdo->prepare("
                INSERT INTO digi_wallets (user_id, balance, updated_at)
                VALUES (:rid, 1000, now())
                ON CONFLICT (user_id) DO UPDATE SET balance = digi_wallets.balance + 1000, updated_at = now()
            ")->execute([':rid' => $referrerId]);

            // Audit transaction
            $pdo->prepare("
                INSERT INTO digi_transactions (user_id, amount, kind, ref)
                VALUES (:rid, 1000, 'credit', :ref)
            ")->execute([':rid' => $referrerId, ':ref' => 'ref_full_unlock:order#'.$orderId]);
        }
    }

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    $my->close();
    http_fail('Fulfilment failed: ' . $e->getMessage(), 500);
}

// 5) Yoco bookkeeping (successful_payments)
$ip    = $_SERVER['REMOTE_ADDR']     ?? null;
$agent = $_SERVER['HTTP_USER_AGENT'] ?? null;

$y = $my->prepare("INSERT INTO tcg_payments
    (user_id, tx_reference, amount_cents, sku, client_ip, user_agent, payment_success)
    VALUES (?, ?, ?, ?, ?, ?, 1)");
$y->bind_param('isisss', $userId, $reference, $amountCents, $sku, $ip, $agent);
$y->execute();
$y->close();
$my->close();

// 6) Success page
?>
<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<title>Full Game Unlocked</title>
<style>
body{font-family:system-ui,Arial,sans-serif;background:#e8ffe8;color:#222;padding:2rem}
.box{background:#d4edda;border-left:4px solid #28a745;padding:1rem;border-radius:10px}
a{color:#0b5ed7;text-decoration:none}
</style>
</head>
<body>
  <h2>✅ Full Game Upgrade Successful</h2>
  <div class="box">
    <p>Your reference: <strong><?= htmlspecialchars($reference) ?></strong></p>
    <p>Your account now has permanent access to all current cards and upcoming premium modes.</p>
    <p><a href="/profile.php">Back to Profile</a> · <a href="/index.php">Home</a></p>
  </div>
</body></html>
