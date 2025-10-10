<?php
// /var/www/tcg.backend/store.php
// Store with custom age verification: ID/passport or guardian consent.

ini_set('display_errors', 0);
error_reporting(0);
session_start();

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;
Dotenv::createImmutable('/home')->safeLoad();

// ---- PG connection ----
$host = $_ENV['TCG_DB_HOST'] ?? 'localhost';
$db   = $_ENV['TCG_DB_NAME'] ?? 'tcg';
$user = $_ENV['TCG_DB_USER'] ?? '';
$pass = $_ENV['TCG_DB_PASS'] ?? '';
$port = (int) ($_ENV['TCG_DB_PORT'] ?? 5432);

$dsn = "pgsql:host={$host};port={$port};dbname={$db}";
try {
    $pdo = new PDO($dsn, $user, $pass, [ PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo "<pre style='color:#f33'>DB Error: ".htmlspecialchars($e->getMessage())."</pre>";
    exit;
}

// Pull active products (only 2 SKUs)
$stmt = $pdo->prepare("
  SELECT sku, name, price_cents, type
  FROM products
  WHERE active = TRUE AND sku IN ('FULL_UPGRADE','BATTLE_PASS')
  ORDER BY name ASC
");
$stmt->execute();
$products = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Logged in?
$uid = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;

// Entitlements
$hasFull = false;
$bpExpiresAt = null;
$bpDays = null;
$hasIdOrConsent = false;

if ($uid) {
    $q = $pdo->prepare("SELECT 1 FROM entitlements WHERE user_id = :u AND type = 'full_unlock' LIMIT 1");
    $q->execute([':u' => $uid]);
    $hasFull = (bool)$q->fetchColumn();

    $bq = $pdo->prepare("SELECT expires_at FROM entitlements WHERE user_id = :u AND type = 'battle_pass' LIMIT 1");
    $bq->execute([':u' => $uid]);
    $bpRow = $bq->fetch(PDO::FETCH_ASSOC);
    $bpExpiresAt = $bpRow ? $bpRow['expires_at'] : null;

    // Age verification: ID/passport or guardian consent
    $u = $pdo->prepare("SELECT id_number, guardian_consent FROM users WHERE id = :u LIMIT 1");
    $u->execute([':u' => $uid]);
    if ($r = $u->fetch(PDO::FETCH_ASSOC)) {
        $hasIdOrConsent = !empty($r['id_number']) || !empty($r['guardian_consent']);
    }
}

function h($s){ return htmlspecialchars((string)$s, ENT_QUOTES); }
function rands($cents){ return number_format(((int)$cents)/100, 2); }
function days_left($expiresAt){
    if (!$expiresAt) return null;
    $now = new DateTimeImmutable('now');
    $ex  = new DateTimeImmutable($expiresAt);
    $diff = (int)$ex->diff($now)->format('%r%a');
    return -$diff;
}
$bpDays = $bpExpiresAt ? days_left($bpExpiresAt) : null;

$banner = '';
if (isset($_GET['already_have_full'])) $banner .= "<div class='ok'>You already own the Full Game Upgrade.</div>";
if (isset($_GET['cancel']))            $banner .= "<div class='warn'>Payment was cancelled.</div>";
if (isset($_GET['failed']))            $banner .= "<div class='warn'>Payment failed. Please try again.</div>";
if (isset($_GET['gating'])) {
    $what = $_GET['gating'];
    if ($what === 'full_game')   $banner .= "<div class='warn'>Please complete age verification before buying the Full Game.</div>";
    if ($what === 'battle_pass') $banner .= "<div class='warn'>Please unlock the Full Game and verify age/consent first.</div>";
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Animorphs TCG Store</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: system-ui, Arial, sans-serif; color: #fff; background: #0b1022; margin:0; }
    header { padding: 24px; background: #11183a; border-bottom: 1px solid #1f2b6b; }
    h1 { margin:0; font-size: 22px; letter-spacing:.5px }
    main { max-width: 960px; margin: 0 auto; padding: 24px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    .card { background:#151d43; border:1px solid #243079; border-radius:14px; padding:18px; box-shadow: 0 6px 18px rgba(0,0,0,.35); }
    .name { font-weight: 700; font-size:18px; margin: 0 0 6px; }
    .price { font-size: 16px; color: #f0e130; margin: 0 0 14px; }
    .desc { color:#cbd6ff; font-size:14px; line-height:1.35; margin: 0 0 14px; }
    .btn { display:inline-block; padding:10px 14px; background:#28a745; color:#fff; text-decoration:none; border-radius:10px; font-weight:700; }
    .btn[aria-disabled="true"] { opacity:.6; cursor:not-allowed; }
    .note { color:#ffd966; margin: 8px 0 0; font-size: 13px; }
    nav a { color:#8ab4ff; text-decoration:none; margin-right:12px; }
    .warn { background:#3a1b1b; border-left:4px solid #d05050; padding:10px; margin: 16px 0; border-radius:8px; }
    .ok { background:#16321e; border-left:4px solid #2ea44f; padding:10px; margin: 16px 0; border-radius:8px; }
    .muted { color:#9fb0ff; font-size:13px; margin-top:8px; }
    .pill { display:inline-block; padding:4px 8px; border-radius:999px; background:#0f2f63; border:1px solid #274a8a; color:#cfe3ff; font-size:12px; }
    .panel { background:#10173a; border:1px dashed #2a3f88; border-radius:12px; padding:12px 14px; margin: 16px 0; }
    .panel h3 { margin: 0 0 8px; font-size: 16px; }
  </style>
</head>
<body>
  <script>
function sendHeartbeat() {
    fetch('/presence/update_presence.php')
    .catch(err => console.error("Presence update failed", err));
}
setInterval(sendHeartbeat, 60000); // every 60s
sendHeartbeat(); // initial call on page load
</script>
<header>
  <h1>Animorphs TCG — Store</h1>
  <nav>
    <a href="/index.php">Home</a>
    <a href="/leaderboard.php">AI Leaderboard</a>
    <a href="/demo.html">Demo</a>
    <a href="/client_profile.php">Client Profile</a>
    <?php if ($uid): ?><a href="/profile.php">Profile</a><?php else: ?><a href="/login.php">Login</a><?php endif; ?>
  </nav>
</header>
<main>
  <?= $banner ?>

  <?php if (!$uid): ?>
    <div class="warn">Please <a href="/login.php" style="color:#ffbdbd">log in</a> to purchase upgrades.</div>
  <?php else: ?>
    <div class="ok">Welcome! Your purchases will be linked to your account (User ID <?= (int)$uid ?>).</div>
  <?php endif; ?>

  <?php if ($uid && $hasFull): ?>
    <div class="pill">🔓 You own Full Game Upgrade</div>
  <?php endif; ?>
  <?php if ($uid && $bpExpiresAt): ?>
    <div class="muted" style="margin-top:8px">
      🎟️ Battle Pass: <?= ($bpDays !== null && $bpDays > 0) ? "{$bpDays} day(s) remaining" : "expired" ?>
      (until <?= h($bpExpiresAt) ?>)
    </div>
  <?php endif; ?>

  <?php if ($uid && !$hasIdOrConsent): ?>
    <div class="panel">
      <h3>Age Verification Required</h3>
      <p>To unlock paid features, you must submit your South African ID/passport or Guardian Consent Form.</p>
      <p class="muted">Submit from your <a href="/client_profile.php" style="color:#8ab4ff">Client Profile</a>.</p>
    </div>
  <?php endif; ?>

  <div class="grid" style="margin-top:16px">
    <?php foreach ($products as $p):
      $sku    = $p['sku'];
      $rands  = rands($p['price_cents']);
      $desc   = ($sku === 'FULL_UPGRADE')
        ? 'Unlocks access to premium game modes and enables play-to-earn features (referrals, rewards).'
        : '365-day pass that unlocks prize pool eligibility and higher earning potential.';
      $href   = "/checkout.php?sku=" . urlencode($sku);
      $disabled = false;
      $btnText  = 'Buy Now';

      if ($sku === 'FULL_UPGRADE') {
          if ($uid && $hasFull) {
              $disabled = true; $btnText = 'Already Owned';
          }
      } else { // BATTLE_PASS
          if (!$uid) {
              // show login button below
          } elseif (!$hasFull) {
              $href = "/store.php?gating=battle_pass";
              $btnText = 'Requires Full Game';
              $disabled = true;
          } elseif (!$hasIdOrConsent) {
              $href = "/client_profile.php";
              $btnText = 'Submit ID or Consent';
              $disabled = false;
          } else {
              $btnText = ($bpDays !== null && $bpDays > 0) ? 'Extend 365 Days' : 'Buy Now';
          }
      }
    ?>
      <div class="card">
        <div class="name"><?= h($p['name']) ?></div>
        <div class="price">R<?= $rands ?></div>
        <p class="desc"><?= h($desc) ?></p>

        <?php if ($uid): ?>
          <a class="btn" href="<?= h($href) ?>" <?= $disabled ? 'aria-disabled="true" onclick="return false;"' : '' ?>><?= h($btnText) ?></a>
        <?php else: ?>
          <a class="btn" href="/login.php" aria-disabled="true" onclick="return false;">Login to Purchase</a>
        <?php endif; ?>

        <?php if ($sku==='BATTLE_PASS'): ?>
          <div class="note">* Requires Full Game + ID/passport or guardian consent.</div>
        <?php endif; ?>
      </div>
    <?php endforeach; ?>
  </div>
</main>
</body>
</html>
