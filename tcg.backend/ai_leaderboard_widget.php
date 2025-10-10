<?php
// File: /var/www/tcg.backend/ai_leaderboard_widget.php
if (!isset($pdo)) {
  require_once '/var/www/vendor/autoload.php';
  $dotenv = Dotenv\Dotenv::createImmutable('/home');
  $dotenv->safeLoad();

  $dbname = $_ENV['TCG_DB_NAME'] ?? '';
  $dbuser = $_ENV['TCG_DB_USER'] ?? '';
  $dbpass = $_ENV['TCG_DB_PASS'] ?? '';
  $dbhost = $_ENV['TCG_DB_HOST'] ?? '';
  $dbport = $_ENV['TCG_DB_PORT'] ?? 5432;

  try {
      $pdo = new PDO("pgsql:host=$dbhost;port=$dbport;dbname=$dbname", $dbuser, $dbpass, [
          PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
      ]);
  } catch (Throwable $e) {
      echo '<div class="lbw-error">Leaderboard unavailable.</div>';
      return;
  }
}

$stmt = $pdo->query("
    SELECT
        COALESCE(l.username, u.username, 'Player') AS username,
        COALESCE(l.total_matches, 0) AS total_matches,
        COALESCE(l.total_wins, 0)    AS total_wins,
        COALESCE(l.ai_points, 0)     AS ai_points
    FROM leaderboards l
    LEFT JOIN users u ON u.id = l.user_id
    ORDER BY COALESCE(l.ai_points,0) DESC,
             COALESCE(l.total_wins,0) DESC,
             COALESCE(l.total_matches,0) ASC
    LIMIT 5
");
$mini = $stmt->fetchAll(PDO::FETCH_ASSOC);
for ($i = count($mini); $i < 5; $i++) {
  $mini[] = ['username'=>'', 'total_matches'=>0, 'total_wins'=>0, 'ai_points'=>0];
}
?>
<style>
  .lbw { background:#161a36; border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:14px; color:#e9ecf1; }
  .lbw h3 { margin:0 0 8px; }
  .lbw table { width:100%; border-collapse:collapse; }
  .lbw th, .lbw td { padding:6px 8px; font-size:14px; text-align:left; }
  .lbw th { color:#b8c2d9; font-size:12px; text-transform:uppercase; letter-spacing:.5px; border-bottom:1px solid rgba(255,255,255,0.08); }
  .lbw td.num { text-align:right; font-variant-numeric:tabular-nums; }
  .lbw tr { border-bottom:1px solid rgba(255,255,255,0.05); }
  .lbw .empty { color:#6f7b90; font-style:italic; }
  .lbw-error { background:#3a1e1e; color:#ffd6d6; padding:10px; border-radius:8px; }
</style>
<div class="lbw">
  <h3>Top 1vAI (AI Points)</h3>
  <table>
    <thead>
      <tr><th>#</th><th>Username</th><th class="num">AI</th><th class="num">W</th><th class="num">GP</th></tr>
    </thead>
    <tbody>
      <?php $r=1; foreach ($mini as $row): ?>
        <?php $empty = ($row['username']==='' && (int)$row['ai_points']===0 && (int)$row['total_matches']===0); ?>
        <tr>
          <td><?php echo $r; ?></td>
          <?php if ($empty): ?>
            <td class="empty" colspan="4">—</td>
          <?php else: ?>
            <td><?php echo htmlspecialchars($row['username']); ?></td>
            <td class="num"><?php echo (int)$row['ai_points']; ?></td>
            <td class="num"><?php echo (int)$row['total_wins']; ?></td>
            <td class="num"><?php echo (int)$row['total_matches']; ?></td>
          <?php endif; ?>
        </tr>
      <?php $r++; endforeach; ?>
    </tbody>
  </table>
  <div style="margin-top:6px; font-size:12px;">
    <a href="/leaderboards.php" style="color:#9ec3ff; text-decoration:none;">View full leaderboard →</a>
  </div>
</div>
