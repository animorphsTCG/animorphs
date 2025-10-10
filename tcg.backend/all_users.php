<?php
// /var/www/tcg.backend/all_users.php
// Show directory of all users + stats. Allow Full Game users to send friend requests.

ini_set('display_errors', 1);
error_reporting(E_ALL);
session_start();

if (!isset($_SESSION['user_id'])) {
    header("Location: /login.php");
    exit;
}

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;
Dotenv::createImmutable('/home')->safeLoad();

$host = $_ENV['TCG_DB_HOST'] ?? 'localhost';
$db   = $_ENV['TCG_DB_NAME'] ?? 'tcg';
$user = $_ENV['TCG_DB_USER'] ?? '';
$pass = $_ENV['TCG_DB_PASS'] ?? '';
$port = (int)($_ENV['TCG_DB_PORT'] ?? 5432);

try {
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$db", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo "DB connection failed.";
    exit;
}

$currentUser = (int)$_SESSION['user_id'];

// Does current user own full game?
$q = $pdo->prepare("SELECT 1 FROM entitlements WHERE user_id = :u AND type='full_unlock' LIMIT 1");
$q->execute([':u' => $currentUser]);
$canAddFriends = (bool)$q->fetchColumn();

function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES); }

// Fetch all users + join info
$sql = "
  SELECT u.id, u.username, u.created_at,
         ui.age, ui.country, ui.eta_online,
         (SELECT 1 FROM entitlements e WHERE e.user_id=u.id AND e.type='full_unlock' LIMIT 1) AS has_full,
         (SELECT expires_at FROM entitlements e WHERE e.user_id=u.id AND e.type='battle_pass' LIMIT 1) AS bp_expires,
         lb.ai_points, lb.mp_points, lb.lbp_points
  FROM users u
  LEFT JOIN user_info ui ON ui.user_id = u.id
  LEFT JOIN leaderboards lb ON lb.user_id = u.id
  ORDER BY u.username ASC
";
$stmt = $pdo->query($sql);
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Player stats per mode
$statsStmt = $pdo->prepare("SELECT mode, games_played, games_won FROM player_statistics WHERE user_id = :u");
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>All Users — Animorphs TCG</title>
  <style>
    body { font-family: Arial, sans-serif; margin:0; padding:0; background:#0b1022; color:#fff; }
    header { background:#11183a; padding:16px; }
    nav a { color:#8ab4ff; margin-right:12px; text-decoration:none; }
    main { max-width:1100px; margin:0 auto; padding:20px; }
    .user-card { background:#151d43; border:1px solid #243079; border-radius:12px; padding:16px; margin-bottom:16px; }
    .user-card h2 { margin:0 0 8px; font-size:18px; }
    .muted { color:#ccc; font-size:13px; }
    .stats { margin:6px 0; }
    button { padding:6px 12px; border:none; border-radius:8px; cursor:pointer; font-weight:bold; }
    .friend-btn { background:#28a745; color:#fff; }
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
  <h1>All Users</h1>
  <nav>
    <a href="/index.php">Home</a>
    <a href="/store.php">Store</a>
    <a href="/client_profile.php">Client Profile</a>
    <a href="/profile.php">Profile</a>
    <a href="/friends.php">Friends</a>
  </nav>
</header>
<main>
  <?php foreach ($users as $u): ?>
    <?php
      $bpDays = null;
      if ($u['bp_expires']) {
          $now = new DateTimeImmutable('now');
          $ex  = new DateTimeImmutable($u['bp_expires']);
          $diff = (int)$ex->diff($now)->format('%r%a');
          $bpDays = -$diff;
      }

      $statsStmt->execute([':u'=>$u['id']]);
      $modeStats = $statsStmt->fetchAll(PDO::FETCH_ASSOC);
    ?>
    <div class="user-card">
      <h2><?= h($u['username']) ?></h2>
      <p><strong>Age:</strong> <?= h($u['age'] ?: '-') ?> |
         <strong>Country:</strong> <?= h($u['country'] ?: '-') ?> |
         <strong>Online times:</strong> <?= h($u['eta_online'] ?: '-') ?></p>
      <p class="stats"><strong>AI Points:</strong> <?= (int)$u['ai_points'] ?> |
         <strong>MP Points:</strong> <?= (int)$u['mp_points'] ?> |
         <strong>LBP Points:</strong> <?= (int)$u['lbp_points'] ?></p>
      <p class="stats"><strong>Full Game:</strong> <?= $u['has_full'] ? '✅ Yes' : '❌ No' ?> |
         <strong>Battle Pass:</strong>
         <?php if ($u['bp_expires']): ?>
           <?= ($bpDays > 0) ? "✅ {$bpDays} days left" : "❌ Expired" ?>
         <?php else: ?>
           ❌ None
         <?php endif; ?>
      </p>
      <?php if ($modeStats): ?>
        <div class="stats">
          <?php foreach ($modeStats as $ms): 
              $wr = $ms['games_played'] > 0 ? round(($ms['games_won'] / $ms['games_played']) * 100) : 0;
          ?>
            <p><?= h($ms['mode']) ?> — Played: <?= (int)$ms['games_played'] ?>, Won: <?= (int)$ms['games_won'] ?> (<?= $wr ?>% WR)</p>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>

      <?php if ($canAddFriends && $u['id'] != $currentUser): ?>
        <form method="POST" action="/friend_request.php" style="margin-top:8px;">
          <input type="hidden" name="friend_id" value="<?= (int)$u['id'] ?>">
          <button class="friend-btn">Add Friend</button>
        </form>
      <?php endif; ?>
    </div>
  <?php endforeach; ?>
</main>
</body>
</html>
