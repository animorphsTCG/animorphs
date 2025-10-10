<?php
// /var/www/tcg.backend/success2.php
ini_set('display_errors', 0);
error_reporting(0);
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

if (!isset($_SESSION['user_id'])) { header('Location: /login.php'); exit; }

$userId    = (int)$_SESSION['user_id'];
$token     = $_GET['token']     ?? '';
$reference = $_GET['reference'] ?? '';
$sku       = $_GET['sku']       ?? '';

if ($token === '' || $reference === '' || $sku !== 'BATTLE_PASS') {
  http_fail('Invalid fulfilment parameters.');
}

// --- PG connect ---
try {
  $pdo = new PDO(
    "pgsql:host=".($_ENV['TCG_DB_HOST']??'localhost')
    .";port=".((int)($_ENV['TCG_DB_PORT']??5432))
    .";dbname=".($_ENV['TCG_DB_NAME']??'tcg'),
    $_ENV['TCG_DB_USER']??'',
    $_ENV['TCG_DB_PASS']??'',
    [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]
  );
} catch (Throwable $e) {
  http_fail('Database connection failed (PG).', 500);
}

// --- MariaDB (yoco) ---
$my = @new mysqli(
  $_ENV['ZY_YOCO_DB_HOST'] ?? 'localhost',
  $_ENV['ZY_YOCO_DB_USER'] ?? '',
  $_ENV['ZY_YOCO_DB_PASS'] ?? '',
  $_ENV['ZY_YOCO_DB_NAME'] ?? 'yoco'
);
if ($my->connect_error) { http_fail('Database connection failed (Yoco).', 500); }

// --- Validate token in yoco.payment_tokens ---
$lookup = $my->prepare("SELECT user_id, song_ids, used FROM payment_tokens WHERE token = ? LIMIT 1");
if (!$lookup) { http_fail('Token lookup failed.', 500); }
$lookup->bind_param('s', $token);
$lookup->execute();
$res = $lookup->get_result();
if ($res->num_rows === 0) { $lookup->close(); $my->close(); http_fail('Invalid token.'); }
$row = $res->fetch_assoc();
$lookup->close();

$tokenUserId = (int)$row['user_id'];
$tokenSku    = trim((string)$row['song_ids']);
$tokenUsed   = (int)$row['used'];

if ($tokenUserId !== $userId) { $my->close(); http_fail('Token does not belong to the logged-in user.'); }
if ($tokenSku !== 'BATTLE_PASS') { $my->close(); http_fail('Token SKU mismatch.'); }

// --- Fulfilment in a PG transaction ---
$pdo->beginTransaction();
try {
  // Find order by token + user
  $o = $pdo->prepare("SELECT id, status, amount_cents FROM orders WHERE token = :tok AND user_id = :u LIMIT 1");
  $o->execute([':tok'=>$token, ':u'=>$userId]);
  $order = $o->fetch(PDO::FETCH_ASSOC);
  if (!$order) { throw new Exception('Order not found for this token.'); }

  $orderId     = (int)$order['id'];
  $amountCents = (int)$order['amount_cents'];
  $alreadyPaid = ($order['status'] === 'paid');

  // Mark token used in MariaDB (idempotent)
  if ($tokenUsed == 0) {
    $updTok = $my->prepare("UPDATE payment_tokens SET used = 1 WHERE token = ?");
    if ($updTok) {
      $updTok->bind_param('s', $token);
      $updTok->execute();
      $updTok->close();
    }
  }

  // Mark order paid (idempotent) — no paid_at column in your schema, so omit it
  if (!$alreadyPaid) {
    $upd = $pdo->prepare("UPDATE orders SET status='paid', tx_reference = :ref WHERE id = :id");
    $upd->execute([':ref'=>$reference, ':id'=>$orderId]);
  }

  // Battle Pass entitlement: extend by +365 days from current expiry if active, else start now
  $bp = $pdo->prepare("SELECT id, expires_at FROM entitlements WHERE user_id = :u AND type = 'battle_pass' LIMIT 1");
  $bp->execute([':u'=>$userId]);
  $bpRow = $bp->fetch(PDO::FETCH_ASSOC);

  if ($bpRow) {
    $extend = $pdo->prepare("
      UPDATE entitlements
      SET start_at = CASE WHEN COALESCE(expires_at, now()) > now() THEN start_at ELSE now() END,
          expires_at = CASE WHEN COALESCE(expires_at, now()) > now() THEN expires_at + interval '365 days'
                            ELSE now() + interval '365 days' END,
          source_order_id = :oid
      WHERE id = :id
    ");
    $extend->execute([':oid'=>$orderId, ':id'=>(int)$bpRow['id']]);
  } else {
    $ins = $pdo->prepare("
      INSERT INTO entitlements (user_id, type, start_at, expires_at, source_order_id)
      VALUES (:u, 'battle_pass', now(), now() + interval '365 days', :oid)
    ");
    $ins->execute([':u'=>$userId, ':oid'=>$orderId]);
  }

  // Referral credit (idempotent) — R10 => 1000 digi
  $ref = $pdo->prepare("
    SELECT rl.referrer_user_id
    FROM referrals r
    JOIN referral_links rl ON rl.code = r.code
    WHERE r.referred_user_id = :u
    LIMIT 1
  ");
  $ref->execute([':u'=>$userId]);
  $refRow = $ref->fetch(PDO::FETCH_ASSOC);

  if ($refRow) {
    $referrerId = (int)$refRow['referrer_user_id'];

    // Has this order already been credited?
    $chk = $pdo->prepare("SELECT 1 FROM referral_earnings WHERE order_id = :oid AND type = 'battle_pass' LIMIT 1");
    $chk->execute([':oid'=>$orderId]);
    $alreadyCredited = (bool)$chk->fetchColumn();

    if (!$alreadyCredited) {
      $earn = $pdo->prepare("
        INSERT INTO referral_earnings (referrer_user_id, referred_user_id, order_id, type, amount_digi, created_at)
        VALUES (:rid, :uid, :oid, 'battle_pass', 1000, now())
      ");
      $earn->execute([':rid'=>$referrerId, ':uid'=>$userId, ':oid'=>$orderId]);

      // Optional wallet credit if wallet tables exist
      $has_wallet = $pdo->query("SELECT to_regclass('public.digi_wallets')")->fetchColumn();
      $has_tx     = $pdo->query("SELECT to_regclass('public.digi_transactions')")->fetchColumn();

      if ($has_wallet && $has_tx) {
        $pdo->prepare("
          INSERT INTO digi_wallets (user_id, balance, updated_at)
          VALUES (:rid, 1000, now())
          ON CONFLICT (user_id) DO UPDATE SET balance = digi_wallets.balance + 1000, updated_at = now()
        ")->execute([':rid'=>$referrerId]);

        $pdo->prepare("
          INSERT INTO digi_transactions (user_id, amount, kind, ref)
          VALUES (:rid, 1000, 'credit', :ref)
        ")->execute([':rid'=>$referrerId, ':ref'=>'ref_battle_pass:order#'.$orderId]);
      }
    }
  }

  $pdo->commit();
} catch (Throwable $e) {
  $pdo->rollBack();
  $my->close();
  http_fail('Fulfilment failed: ' . $e->getMessage(), 500);
}

// --- Log to yoco.tcg_payments (MariaDB) ---
$ip    = $_SERVER['REMOTE_ADDR']     ?? null;
$agent = $_SERVER['HTTP_USER_AGENT'] ?? null;

$y = $my->prepare("INSERT INTO tcg_payments
  (user_id, tx_reference, amount_cents, sku, client_ip, user_agent, payment_success)
  VALUES (?, ?, ?, 'BATTLE_PASS', ?, ?, 1)
");
if ($y) {
  // 5 placeholders => 'isiss'
  $y->bind_param('isiss', $userId, $reference, $amountCents, $ip, $agent);
  $y->execute();
  $y->close();
}
$my->close();
?>
<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<title>Battle Pass Activated</title>
<style>
body{font-family:system-ui,Arial,sans-serif;background:#e8ffe8;color:#222;padding:2rem}
.box{background:#d4edda;border-left:4px solid #28a745;padding:1rem;border-radius:10px}
a{color:#0b5ed7;text-decoration:none}
</style>
</head>
<body>
  <h2>✅ Battle Pass Purchase Successful</h2>
  <div class="box">
    <p>Your reference: <strong><?= htmlspecialchars($reference) ?></strong></p>
    <p>Your Battle Pass has been activated/extended by 365 days. Enjoy play-to-earn modes and referral rewards.</p>
    <p><a href="/profile.php">Back to Profile</a> · <a href="/index.php">Home</a></p>
  </div>
</body></html>
