<?php
// File: /var/www/tcg.backend/leaderboards.php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
session_start();

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable('/home');
$dotenv->safeLoad();

$dbname = $_ENV['TCG_DB_NAME'] ?? '';
$dbuser = $_ENV['TCG_DB_USER'] ?? '';
$dbpass = $_ENV['TCG_DB_PASS'] ?? '';
$dbhost = $_ENV['TCG_DB_HOST'] ?? '';
$dbport = $_ENV['TCG_DB_PORT'] ?? 5432;

// Connect DB
try {
    $pdo = new PDO("pgsql:host=$dbhost;port=$dbport;dbname=$dbname", $dbuser, $dbpass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    die("Database connection failed.");
}

// Fetch Top 10 by AI points
$stmt = $pdo->query("
    SELECT
        l.user_id,
        COALESCE(l.username, u.username, 'Player') AS username,
        COALESCE(l.total_matches, 0) AS total_matches,
        COALESCE(l.total_wins, 0)    AS total_wins,
        COALESCE(l.ai_points, 0)     AS ai_points
    FROM leaderboards l
    LEFT JOIN users u ON u.id = l.user_id
    ORDER BY COALESCE(l.ai_points,0) DESC,
             COALESCE(l.total_wins,0) DESC,
             COALESCE(l.total_matches,0) ASC,
             l.user_id ASC
    LIMIT 10
");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Pad to exactly 10 rows
for ($i = count($rows); $i < 10; $i++) {
    $rows[] = [
        'user_id'      => null,
        'username'     => '',
        'total_matches'=> 0,
        'total_wins'   => 0,
        'ai_points'    => 0
    ];
}
$loggedName = $_SESSION['username'] ?? 'Guest';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Leaderboards – Animorphs TCG</title>
  <link rel="stylesheet" href="/tcg.frontend/profile.css">
  <style>
    body { font-family: Arial, sans-serif; margin: 0; display: flex; background:#0f1220; color:#e9ecf1; }
    .sidebar { width: 220px; background: #11152b; color: #fff; min-height: 100vh; padding: 20px; box-sizing: border-box; }
    .sidebar h2 { font-size: 22px; margin-bottom: 20px; }
    .sidebar ul { list-style: none; padding: 0; margin:0; }
    .sidebar li { margin: 10px 0; }
    .sidebar a { color: #d7dbff; text-decoration: none; display:block; padding:8px 10px; border-radius:8px; }
    .sidebar a:hover, .sidebar a.active { background: rgba(255,255,255,0.08); }
    .main { flex: 1; padding: 28px; background: #0f1220; }
    h1, h2 { margin: 0 0 12px; }
    .panel { background:#161a36; border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:16px; }
    .muted { color:#9aa3b2; font-size:13px; }

    table.board { width: 100%; border-collapse: collapse; margin-top: 8px; }
    .board th, .board td { padding: 10px 12px; text-align: left; }
    .board thead th { font-size: 12px; text-transform: uppercase; letter-spacing: .6px; color:#b8c2d9; border-bottom:1px solid rgba(255,255,255,0.08); }
    .board tbody tr { border-bottom:1px solid rgba(255,255,255,0.05); }
    .board tbody tr:nth-child(1) { background: rgba(255, 215, 0, 0.06); }
    .board tbody tr:nth-child(2) { background: rgba(192, 192, 192, 0.05); }
    .board tbody tr:nth-child(3) { background: rgba(205, 127, 50, 0.05); }
    .rank { width: 52px; font-weight: 700; color:#fff; }
    .user { font-weight: 600; color:#fff; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .empty { color:#6f7b90; font-style: italic; }
    .header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
    .header .desc { color:#9aa3b2; font-size:14px; }
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
  <aside class="sidebar">
    <h2>Animorphs TCG</h2>
    <div style="margin-bottom:10px; font-size:13px; opacity:.9;">Viewing as: <strong><?php echo htmlspecialchars($loggedName); ?></strong></div>
    <ul>
      <li><a href="/profile.php">Profile</a></li>
      <li><a href="/select_free_cards.html">Select Free Cards</a></li>
      <li><a href="/1vai.php">1vAI Battle</a></li>
      <li><a href="/leaderboards.php" class="active">Leaderboards</a></li>
      <li><a href="/friends.php">Friends</a></li>
      <li><a href="/logout.php">Logout</a></li>
    </ul>
  </aside>

  <main class="main">
    <div class="header">
      <h1>Leaderboards</h1>
      <div class="desc">Ranking by <strong>AI Points</strong>. More modes coming soon.</div>
    </div>

    <section class="panel">
      <h2 style="margin-bottom:6px;">Top 10 – 1vAI</h2>
      <div class="muted">AI Points determine rank. Showing Username, Games Played, Games Won, and Win % for visibility.</div>

      <table class="board">
        <thead>
          <tr>
            <th class="rank">#</th>
            <th>Username</th>
            <th class="num">AI Points</th>
            <th class="num">Games Played</th>
            <th class="num">Games Won</th>
            <th class="num">Win %</th>
          </tr>
        </thead>
        <tbody>
          <?php
          $rank = 1;
          foreach ($rows as $r):
            $username = trim((string)$r['username']);
            $ai   = (int)$r['ai_points'];
            $tm   = (int)$r['total_matches'];
            $tw   = (int)$r['total_wins'];
            $wr   = $tm > 0 ? round(($tw / $tm) * 100) : 0;

            // For padded blanks, show placeholder dashes
            $isEmpty = ($r['user_id'] === null) || ($username === '' && $ai === 0 && $tm === 0 && $tw === 0);
          ?>
          <tr>
            <td class="rank"><?php echo $rank; ?></td>
            <?php if ($isEmpty): ?>
              <td class="user empty">—</td>
              <td class="num empty">—</td>
              <td class="num empty">—</td>
              <td class="num empty">—</td>
              <td class="num empty">—</td>
            <?php else: ?>
              <td class="user"><?php echo htmlspecialchars($username); ?></td>
              <td class="num"><?php echo $ai; ?></td>
              <td class="num"><?php echo $tm; ?></td>
              <td class="num"><?php echo $tw; ?></td>
              <td class="num"><?php echo $wr; ?>%</td>
            <?php endif; ?>
          </tr>
          <?php
            $rank++;
          endforeach;
          ?>
        </tbody>
      </table>
    </section>
  </main>
</body>
</html>
