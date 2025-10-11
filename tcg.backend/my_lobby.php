<?php
// /var/www/tcg.backend/my_lobby.php
ini_set('display_errors', 0);
error_reporting(E_ALL);
session_start();
header('Content-Type: text/html; charset=utf-8');

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable('/home');
$dotenv->safeLoad();

if (!isset($_SESSION['user_id'])) {
    header('Location: /login.php');
    exit;
}

$userId  = (int)$_SESSION['user_id'];
$lobbyId = (int)($_GET['lobby_id'] ?? 0);
if (!$lobbyId) {
    http_response_code(400);
    echo "Missing lobby_id";
    exit;
}

try {
    $pdo = new PDO(
        "pgsql:host={$_ENV['TCG_DB_HOST']};port=".($_ENV['TCG_DB_PORT'] ?? 5432).";dbname={$_ENV['TCG_DB_NAME']}",
        $_ENV['TCG_DB_USER'],
        $_ENV['TCG_DB_PASS'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Verify membership & get lobby
    $st = $pdo->prepare("
        SELECT l.id, l.owner_id, l.mode, l.status, l.is_public
        FROM lobbies l
        WHERE l.id = :l
    ");
    $st->execute([':l'=>$lobbyId]);
    $lobby = $st->fetch(PDO::FETCH_ASSOC);
    if (!$lobby) { echo "Lobby not found."; exit; }

    $chk = $pdo->prepare("SELECT 1 FROM lobby_participants WHERE lobby_id=:l AND user_id=:u");
    $chk->execute([':l'=>$lobbyId, ':u'=>$userId]);
    if (!$chk->fetchColumn()) { echo "You are not a participant of this lobby."; exit; }

    // Participants + readiness
    $pstmt = $pdo->prepare("
        SELECT p.user_id, u.username, p.is_ready
        FROM lobby_participants p
        JOIN users u ON u.id = p.user_id
        WHERE p.lobby_id = :l
        ORDER BY p.joined_at ASC
    ");
    $pstmt->execute([':l'=>$lobbyId]);
    $participants = $pstmt->fetchAll(PDO::FETCH_ASSOC);

} catch (Throwable $e) {
    echo "DB error.";
    exit;
}
?>
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>My Lobby</title>
  <link rel="stylesheet" href="/assets/style.css">
  <style>
    body { font-family: system-ui, Arial, sans-serif; padding: 16px; }
    .btn { padding: 8px 12px; border-radius: 6px; border: 1px solid #222; cursor: pointer; background:#f5f5f5; }
    .btn-primary { background:#222; color:#fff; }
    .list { margin: 8px 0; }
    .ready { color: #0a0; }
    .notready { color: #a00; }
  </style>
</head>
<body>
  <h2>Lobby #<?= htmlspecialchars($lobbyId) ?> (<?= htmlspecialchars($lobby['mode']) ?>)</h2>
  <p>Status: <strong id="lobbyStatus"><?= htmlspecialchars($lobby['status']) ?></strong></p>
  <p>Owner: <strong><?= (int)$lobby['owner_id'] === $userId ? 'You' : 'User #'.$lobby['owner_id'] ?></strong></p>

  <h3>Participants</h3>
  <div class="list" id="plist">
    <?php foreach ($participants as $p): ?>
      <div>
        <?= htmlspecialchars($p['username']) ?> —
        <?php
          $r = ($p['is_ready'] === true || $p['is_ready'] === 't' || (int)$p['is_ready'] === 1);
          echo $r ? '<span class="ready">Ready</span>' : '<span class="notready">Not Ready</span>';
        ?>
      </div>
    <?php endforeach; ?>
  </div>

  <div style="margin-top:12px;">
    <?php if ((int)$lobby['owner_id'] === $userId): ?>
      <form id="startForm" method="post" action="/tcg.backend/game_modes/1v1_random_api.php" style="display:inline;">
        <input type="hidden" name="action" value="owner_start_match">
        <input type="hidden" name="lobby_id" value="<?= $lobbyId ?>">
        <button type="submit" class="btn btn-primary">Start Match</button>
      </form>
    <?php endif; ?>

    <form id="readyForm" method="post" action="/tcg.backend/lobbies/set_ready.php" style="display:inline; margin-left:8px;">
      <input type="hidden" name="lobby_id" value="<?= $lobbyId ?>">
      <input type="hidden" name="ready" id="readyVal" value="1">
      <button type="button" class="btn" onclick="toggleReady()">
        Toggle Ready
      </button>
    </form>

    <a href="/my_lobbies.php" class="btn" style="margin-left:8px;">Back</a>
  </div>

<script>
const lobbyId = <?= (int)$lobbyId ?>;
const isOwner = <?= ((int)$lobby['owner_id'] === $userId) ? 'true' : 'false' ?>;

function toggleReady() {
  const form = document.getElementById('readyForm');
  const val = document.getElementById('readyVal');
  val.value = (val.value === '1') ? '0' : '1';
  form.submit();
}

// Poll for lobby status & signals (every 3s)
async function poll() {
  try {
    const r = await fetch(`/tcg.backend/game_modes/1v1_random_api.php?action=lobby_status&lobby_id=${lobbyId}`, {cache:'no-store'});
    const j = await r.json();
    if (j.success) {
      document.getElementById('lobbyStatus').textContent = j.status;
      // redirect both users when match begins
      if (j.status === 'in_match' && j.mode === '1v1_random') {
        window.location.href = `/game_modes/1v1_random.php?lobby_id=${lobbyId}`;
        return;
      }
      // surface signals
      if (Array.isArray(j.signals) && j.signals.length) {
        j.signals.forEach(s => {
          if (s.signal === 'PLAY_AGAIN') alert(`${s.sender} clicked "Play Again"`);
          if (s.signal === 'RETURN_TO_LOBBY') alert(`${s.sender} clicked "Return to Lobby"`);
          if (s.signal === 'MATCH_STARTED') {
            // If not yet redirected, ensure we go
            window.location.href = `/game_modes/1v1_random.php?lobby_id=${lobbyId}`;
          }
        });
      }
      // refresh participant list text
      if (Array.isArray(j.participants)) {
        const plist = document.getElementById('plist');
        plist.innerHTML = j.participants.map(p => {
          return `<div>${p.username} — ${p.is_ready ? '<span class="ready">Ready</span>' : '<span class="notready">Not Ready</span>'}</div>`;
        }).join('');
      }
    }
  } catch(e){}
  setTimeout(poll, 3000);
}
poll();
</script>
</body>
</html>
