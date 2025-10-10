<?php
// File: /var/www/tcg.backend/profile.php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
session_start();

// Validate session
if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id']) || !is_numeric($_SESSION['user_id'])) {
    session_destroy();
    header('Location: /login.html');
    exit;
}

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;
Dotenv::createImmutable('/home')->safeLoad();

$dbname = $_ENV['TCG_DB_NAME'] ?? '';
$dbuser = $_ENV['TCG_DB_USER'] ?? '';
$dbpass = $_ENV['TCG_DB_PASS'] ?? '';
$dbhost = $_ENV['TCG_DB_HOST'] ?? '';
$dbport = (int)($_ENV['TCG_DB_PORT'] ?? 5432);

// Connect to database
try {
    $pdo = new PDO("pgsql:host={$dbhost};port={$dbport};dbname={$dbname}", $dbuser, $dbpass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    die("Database connection failed.");
}

$userId   = (int) $_SESSION['user_id'];
$username = $_SESSION['username'] ?? 'Player';

function h($s){ return htmlspecialchars((string)$s, ENT_QUOTES); }

// Helper: match store.php behaviour (positive = days remaining; <=0 if expired)
function bp_days_left(?string $expiresAt) : ?int {
    if (!$expiresAt) return null;
    try {
        $now = new DateTimeImmutable('now');
        $ex  = new DateTimeImmutable($expiresAt);
        $diff = (int)$ex->diff($now)->format('%r%a'); // negative when in the future
        return -$diff;
    } catch (Throwable $e) {
        return null;
    }
}

/** Determine purchases + EOS link status */
$hasFull   = false;
$eos       = null;
$eosLinked = false;

try {
    // Full Game owned?
    $ef = $pdo->prepare("SELECT 1 FROM entitlements WHERE user_id = :u AND type='full_unlock' LIMIT 1");
    $ef->execute([':u' => $userId]);
    $hasFull = (bool)$ef->fetchColumn();

    // EOS link row (if any)
    $eosStmt = $pdo->prepare("SELECT eos_account_id, status, linked_at FROM eos_links WHERE user_id = :uid LIMIT 1");
    $eosStmt->execute([':uid' => $userId]);
    $eos = $eosStmt->fetch(PDO::FETCH_ASSOC) ?: null;
    $eosLinked = $eos && ($eos['status'] === 'linked');
} catch (Throwable $e) {
    // non-fatal
}

/** Battle Pass status */
$bpStmt = $pdo->prepare("SELECT expires_at FROM entitlements WHERE user_id = :u AND type='battle_pass' LIMIT 1");
$bpStmt->execute([':u' => $userId]);
$bpRow = $bpStmt->fetch(PDO::FETCH_ASSOC);
$bpExpiresAt = $bpRow['expires_at'] ?? null;
$bpDaysLeft  = bp_days_left($bpExpiresAt);

/** Referral stats */
$codeStmt = $pdo->prepare("SELECT code FROM referral_links WHERE referrer_user_id = :u LIMIT 1");
$codeStmt->execute([':u' => $userId]);
$myCode = $codeStmt->fetchColumn();

$refCount = 0;
if ($myCode) {
    $refCountStmt = $pdo->prepare("SELECT COUNT(*) FROM referrals WHERE code = :c");
    $refCountStmt->execute([':c' => $myCode]);
    $refCount = (int)$refCountStmt->fetchColumn();
}

$earnStmt = $pdo->prepare("SELECT COALESCE(SUM(amount_digi),0) FROM referral_earnings WHERE referrer_user_id = :u");
$earnStmt->execute([':u' => $userId]);
$earnings = (int)$earnStmt->fetchColumn();

/** Fetch selected cards (10 free cards) */
$stmt = $pdo->prepare("
    SELECT ac.*
    FROM free_cards fc
    JOIN animorph_cards ac ON fc.token_id = ac.token_id
    WHERE fc.user_id = :uid
    ORDER BY fc.picked_order ASC
");
$stmt->execute(['uid' => $userId]);
$cards = $stmt->fetchAll(PDO::FETCH_ASSOC);

/** Fetch leaderboard stats */
$lbStmt = $pdo->prepare("
    SELECT COALESCE(total_matches,0) AS total_matches,
           COALESCE(total_wins,0)    AS total_wins,
           COALESCE(ai_points,0)     AS ai_points
    FROM leaderboards
    WHERE user_id = :uid
");
$lbStmt->execute(['uid' => $userId]);
$lb = $lbStmt->fetch(PDO::FETCH_ASSOC) ?: ['total_matches'=>0,'total_wins'=>0,'ai_points'=>0];

$matches  = (int)$lb['total_matches'];
$wins     = (int)$lb['total_wins'];
$aiPoints = (int)$lb['ai_points'];
$winRate  = $matches > 0 ? round(($wins / max($matches, 1)) * 100) : 0;
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title><?php echo h($username); ?>'s Profile</title>
  <link rel="stylesheet" href="/tcg.frontend/profile.css">
  <style>
    body { font-family: Arial, sans-serif; margin: 0; display: flex; background:#f6f7fb; color:#222; }
    .sidebar { width: 240px; background: #222; color: white; min-height: 100vh; padding: 20px; box-sizing: border-box; }
    .sidebar h2 { font-size: 22px; margin-bottom: 20px; }
    .sidebar ul { list-style: none; padding: 0; margin:0; }
    .sidebar li { margin: 10px 0; }
    .sidebar a { color: #ddd; text-decoration: none; display:block; padding:8px 10px; border-radius:8px; }
    .sidebar a:hover { background: rgba(255,255,255,0.08); }
    .main-content { flex: 1; padding: 30px; }
    .card-grid { display: flex; flex-wrap: wrap; gap: 16px; }
    .card { background: #fff; padding: 10px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.12); width: 180px; text-align: center; }
    .card img { width: 100%; border-radius: 8px; }
    h1, h2 { margin: 0 0 12px; }
    section { margin-bottom: 28px; }

    .stats-cards { display:flex; gap:16px; flex-wrap:wrap; margin: 10px 0 24px; }
    .stat-card {
      background:#fff; border-radius:10px; box-shadow:0 2px 6px rgba(0,0,0,.12);
      padding:14px 16px; min-width:160px; text-align:center;
    }
    .stat-card h3 { margin:0 0 6px; font-size:16px; color:#444; font-weight:600; }
    .stat-card .val { font-size:22px; font-weight:700; color:#111; }
    .muted { color:#666; font-size:13px; }
    .eos-pill { display:inline-block; padding:4px 8px; border-radius:999px; font-size:12px; margin-left:6px; }
    .eos-ok { background:#e6ffed; color:#026e2d; border:1px solid #b6f2c4; }
    .eos-warn { background:#fff7e6; color:#a15b00; border:1px solid #ffd48a; }
    .status-heading { margin-top:18px; color:#aaa; font-size:13px; text-transform:uppercase; letter-spacing:.5px; }
    .status-line { color:#ccc; font-size:14px; }
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
  <div class="sidebar">
    <h2>Animorphs TCG</h2>
    <ul>
      <li><a href="/profile.php">Profile</a></li>
      <li><a href="/select_free_cards.html">Select Free Cards</a></li>
      <li><a href="/1vai.php">1vAI Battle</a></li>
      <li><a href="/leaderboards.php">Leaderboards</a></li>
      <li><a href="/friends.php">Friends</a></li>
      <li><a href="/messages.php">Messages</a></li>
      <li><a href="/store.php">Store</a></li>
      <li><a href="/client_profile.php">Client Profile</a></li>

      <li class="status-heading">Status</li>
      <li class="status-line">Full Game: <?= $hasFull ? '✅ Owned' : '❌ Not Owned' ?></li>
      <li class="status-line">
        Battle Pass:
        <?php if ($bpExpiresAt): ?>
          <?= ($bpDaysLeft !== null && $bpDaysLeft > 0) ? "✅ {$bpDaysLeft} day(s) left" : "❌ Expired" ?>
        <?php else: ?>
          ❌ None
        <?php endif; ?>
      </li>
      <li class="status-line">Referrals: <?= (int)$refCount ?> user(s)</li>
      <li class="status-line">Referral Earnings: <?= (int)$earnings ?> Digi</li>

      <?php if ($hasFull): ?>
        <?php if (!$eosLinked): ?>
          <li><a href="/eos/oauth-start.php">Link Epic Account</a></li>
        <?php else: ?>
          <li><a href="/eos/oauth-start.php">Epic Account (Linked)</a></li>
        <?php endif; ?>
      <?php endif; ?>

      <li><a href="/logout.php">Logout</a></li>
    </ul>
  </div>

  <div class="main-content">
    <h1>Welcome, <?php echo h($username); ?>!</h1>

    <?php if ($hasFull): ?>
      <div class="muted" style="margin:10px 0 18px;">
        Full Game: <strong>Owned</strong>
        <?php if ($eosLinked): ?>
          <span class="eos-pill eos-ok">Epic Linked<?php
            if (!empty($eos['eos_account_id'])) echo ': ' . h($eos['eos_account_id']);
          ?></span>
        <?php else: ?>
          <span class="eos-pill eos-warn">Epic Not Linked</span>
        <?php endif; ?>
      </div>
    <?php else: ?>
      <div class="muted" style="margin:10px 0 18px;">
        Full Game: <strong>Not owned</strong> — <a href="/store.php">Unlock in Store</a>
      </div>
    <?php endif; ?>

    <!-- 1vAI Stats -->
    <section>
      <h2>1vAI Stats</h2>
      <div class="stats-cards">
        <div class="stat-card"><h3>Games Played</h3><div class="val"><?php echo $matches; ?></div></div>
        <div class="stat-card"><h3>Games Won</h3><div class="val"><?php echo $wins; ?></div></div>
        <div class="stat-card"><h3>Win Rate</h3><div class="val"><?php echo $winRate; ?>%</div></div>
        <div class="stat-card"><h3>AI Points</h3><div class="val"><?php echo $aiPoints; ?></div></div>
      </div>
      <div class="muted">Win Rate = (Games Won ÷ Games Played) × 100</div>
    </section>

    <!-- First Cards -->
    <section>
      <h2>First Cards</h2>
      <?php if (count($cards) === 0): ?>
        <p>You haven't selected your 10 free cards yet. <a href="/select_free_cards.html">Choose now</a></p>
      <?php else: ?>
        <div class="card-grid">
          <?php foreach ($cards as $card): ?>
            <div class="card">
              <img src="/image.php?file=<?php echo urlencode($card['card_image']); ?>" alt="<?php echo h($card['display_name']); ?>">
              <h3><?php echo h($card['display_name']); ?></h3>
              <p><?php echo h($card['animorph_type']); ?></p>
            </div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </section>
  </div>
</body>
</html>
