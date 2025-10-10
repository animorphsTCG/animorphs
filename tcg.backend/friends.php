<?php
// /var/www/tcg.backend/friends.php
// Show accepted friends (both directions, deduped), incoming requests, and sent requests.

ini_set('display_errors', 0);
error_reporting(0);
session_start();

if (!isset($_SESSION['user_id'])) {
    header("Location: /login.php");
    exit;
}

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;
Dotenv::createImmutable('/home')->safeLoad();

// Safe DSN build
$host = $_ENV['TCG_DB_HOST'] ?? 'localhost';
$db   = $_ENV['TCG_DB_NAME'] ?? 'tcg';
$user = $_ENV['TCG_DB_USER'] ?? '';
$pass = $_ENV['TCG_DB_PASS'] ?? '';
$port = (int)($_ENV['TCG_DB_PORT'] ?? 5432);
$dsn  = "pgsql:host={$host};port={$port};dbname={$db}";

try {
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (Throwable $e) {
    http_response_code(500);
    echo "DB connection failed.";
    exit;
}

$uid = (int)$_SESSION['user_id'];

function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES); }

/**
 * Accepted friends:
 * Build a symmetric, deduped friend id list via CTE, then join to user + stats.
 */
$sql = "
WITH friend_ids AS (
  SELECT CASE WHEN f.user_id = :uid THEN f.friend_user_id ELSE f.user_id END AS fid
  FROM friends f
  WHERE (f.user_id = :uid OR f.friend_user_id = :uid)
    AND f.status = 'accepted'
)
SELECT DISTINCT
       u.id, u.username,
       ui.age, ui.country, ui.eta_online,
       COALESCE(lb.total_matches,0) AS matches,
       COALESCE(lb.total_wins,0)    AS wins,
       rl.code AS referral_code,
       (SELECT COUNT(*) FROM referrals r WHERE r.code = rl.code) AS referral_count
FROM friend_ids fi
JOIN users u          ON u.id = fi.fid
LEFT JOIN user_info ui ON ui.user_id = u.id
LEFT JOIN leaderboards lb ON lb.user_id = u.id
LEFT JOIN referral_links rl ON rl.referrer_user_id = u.id
ORDER BY u.username ASC
";
$stmt = $pdo->prepare($sql);
$stmt->execute([':uid' => $uid]);
$friends = $stmt->fetchAll(PDO::FETCH_ASSOC);

/* Incoming requests (addressed to me, pending) */
$reqStmt = $pdo->prepare("
  SELECT f.id, u.username
  FROM friends f
  JOIN users u ON u.id = f.user_id
  WHERE f.friend_user_id = :me AND f.status = 'pending'
  ORDER BY f.created_at ASC
");
$reqStmt->execute([':me' => $uid]);
$requestsIn = $reqStmt->fetchAll(PDO::FETCH_ASSOC);

/* Outgoing requests (I sent, pending) */
$sentStmt = $pdo->prepare("
  SELECT f.id, u.username
  FROM friends f
  JOIN users u ON u.id = f.friend_user_id
  WHERE f.user_id = :me AND f.status = 'pending'
  ORDER BY f.created_at ASC
");
$sentStmt->execute([':me' => $uid]);
$requestsOut = $sentStmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Friends — Animorphs TCG</title>
  <style>
    body { font-family: Arial, sans-serif; margin:0; padding:0; background:#0b1022; color:#fff; }
    header { background:#11183a; padding:16px; }
    nav a { color:#8ab4ff; margin-right:12px; text-decoration:none; }
    main { max-width:1000px; margin:0 auto; padding:20px; }
    h1 { margin:0 0 20px; }
    h2 { margin:20px 0 10px; }
    .banner { padding:10px; border-radius:8px; margin-bottom:16px; }
    .ok { background:#16321e; border-left:4px solid #2ea44f; }
    .warn { background:#3a1b1b; border-left:4px solid #d05050; }
    .friend-card { background:#151d43; border:1px solid #243079; border-radius:12px; padding:16px; margin-bottom:16px; }
    .friend-card h3 { margin:0 0 8px; font-size:16px; }
    .muted { color:#ccc; font-size:13px; }
    .actions button { margin-right:8px; padding:6px 12px; border:none; border-radius:8px; cursor:pointer; font-weight:bold; }
    .msg-btn { background:#0077cc; color:#fff; }
    .lobby-btn { background:#28a745; color:#fff; }
    .accept-btn { background:#28a745; color:#fff; }
    .decline-btn { background:#cc0000; color:#fff; }
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
  <h1>Friends</h1>
  <nav>
    <a href="/index.php">Home</a>
    <a href="/store.php">Store</a>
    <a href="/client_profile.php">Client Profile</a>
    <a href="/friends.php">Friends</a>
    <a href="/messages.php">Messages</a>
    <a href="/profile.php">Profile</a>
    <a href="/all_users.php">Find Friends</a>
  </nav>
</header>
<main>

  <?php if (isset($_GET['accepted'])): ?>
    <div class="banner ok">✅ Friend request accepted.</div>
  <?php elseif (isset($_GET['error'])): ?>
    <div class="banner warn">⚠️ Action failed: <?= h($_GET['error']) ?></div>
  <?php endif; ?>

  <!-- Incoming friend requests -->
  <?php if ($requestsIn): ?>
    <h2>Friend Requests Received</h2>
    <?php foreach ($requestsIn as $r): ?>
      <div class="friend-card">
        <h3><?= h($r['username']) ?> wants to be your friend</h3>
        <form method="POST" action="/friend_accept.php" style="display:inline;">
          <input type="hidden" name="request_id" value="<?= (int)$r['id'] ?>">
          <button type="submit" class="accept-btn">Accept</button>
        </form>
        <form method="POST" action="/friend_decline.php" style="display:inline;">
          <input type="hidden" name="request_id" value="<?= (int)$r['id'] ?>">
          <button type="submit" class="decline-btn">Decline</button>
        </form>
      </div>
    <?php endforeach; ?>
  <?php endif; ?>

  <!-- Outgoing friend requests -->
  <?php if ($requestsOut): ?>
    <h2>Friend Requests Sent</h2>
    <?php foreach ($requestsOut as $r): ?>
      <div class="friend-card">
        <h3>Awaiting response from <?= h($r['username']) ?></h3>
      </div>
    <?php endforeach; ?>
  <?php endif; ?>

  <!-- Accepted friends -->
  <h2>My Friends</h2>
  <?php if (empty($friends)): ?>
    <p>You have no accepted friends yet. Visit <a href="/all_users.php" style="color:#8ab4ff">All Users</a> to find new friends.</p>
  <?php else: ?>
    <?php foreach ($friends as $f):
        $matches = (int)$f['matches'];
        $wins    = (int)$f['wins'];
        $winRate = $matches > 0 ? round(($wins / max($matches,1)) * 100) : 0;
    ?>
      <div class="friend-card">
        <h3><?= h($f['username']) ?></h3>
        <p><strong>Age:</strong> <?= h($f['age'] ?: '-') ?> |
           <strong>Country:</strong> <?= h($f['country'] ?: '-') ?> |
           <strong>Online times:</strong> <?= h($f['eta_online'] ?: '-') ?></p>
        <p><strong>Referrals:</strong> <?= (int)($f['referral_count'] ?? 0) ?> |
           <strong>Win Rate:</strong> <?= $winRate ?>%</p>

        <div class="actions">
          <a class="msg-btn" href="/messages.php?friend_id=<?= (int)$f['id'] ?>">Send Message</a>
          <button class="lobby-btn" onclick="alert('Invite to lobby feature coming soon');">Invite to Lobby</button>
        </div>
      </div>
    <?php endforeach; ?>
  <?php endif; ?>

</main>
</body>
</html>
