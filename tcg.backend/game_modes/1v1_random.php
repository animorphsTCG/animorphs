<?php
// /var/www/tcg.backend/game_modes/1v1_random.php
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

    $l = $pdo->prepare("SELECT owner_id, mode, status FROM lobbies WHERE id=:l");
    $l->execute([':l'=>$lobbyId]);
    $lobby = $l->fetch(PDO::FETCH_ASSOC);
    if (!$lobby) { echo "Lobby not found."; exit; }

} catch (Throwable $e) {
    echo "DB error.";
    exit;
}
?>
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>1v1 Random Battle</title>
  <link rel="stylesheet" href="/assets/style.css">
  <style>
    body { font-family: system-ui, Arial, sans-serif; padding: 16px; }
    .btn { padding: 8px 12px; border-radius: 6px; border: 1px solid #222; cursor: pointer; background:#f5f5f5; }
    .btn-primary { background:#222; color:#fff; }
    .row { margin-top: 12px; }
    .score { margin: 12px 0; font-size: 18px; }
  </style>
</head>
<body>
  <h1>1v1 Random Battle</h1>
  <p>Once both players are ready and the owner starts the game, click "Start Battle" to begin. You’ll get 10 random cards each. Pick stats each round to battle.</p>

  <div id="preGame" class="row" style="display:none;">
    <?php if ((int)$lobby['owner_id'] === $userId): ?>
      <form id="startForm" method="post" action="/tcg.backend/game_modes/1v1_random_api.php" style="display:inline;">
        <input type="hidden" name="action" value="owner_start_match">
        <input type="hidden" name="lobby_id" value="<?= $lobbyId ?>">
        <button type="submit" class="btn btn-primary">Start Battle</button>
      </form>
    <?php else: ?>
      <em>Waiting for the owner to start…</em>
    <?php endif; ?>
  </div>

  <div id="inGame" class="row" style="display:none;">
    <div class="score">
      You: <span id="youScore">0</span> &nbsp;&nbsp; Opponent: <span id="oppScore">0</span>
    </div>
    <h2 style="margin-top:24px;">VS</h2>

    <div class="row">
      <button class="btn" onclick="playAgain()">Play Again</button>
      <button class="btn" onclick="returnToLobby()">Return to Lobby</button>
    </div>
  </div>

<script>
const lobbyId = <?= (int)$lobbyId ?>;
const isOwner = <?= ((int)$lobby['owner_id'] === $userId) ? 'true' : 'false' ?>;

async function autoStartIfOwner() {
  if (!isOwner) return; // opponent waits for redirect from poll
  try {
    const r = await fetch(`/tcg.backend/game_modes/1v1_random_api.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        action: 'owner_start_match',
        lobby_id: lobbyId
      })
    });
    const j = await r.json();
    if (j.success) {
      console.log('Match started automatically.');
    } else {
      console.warn('Auto-start failed:', j.error);
    }
  } catch (e) {
    console.error('Auto-start error:', e);
  }
}

// Poll match status for both players
async function poll() {
  try {
    const r = await fetch(`/tcg.backend/game_modes/1v1_random_api.php?action=match_status&lobby_id=${lobbyId}`, {cache:'no-store'});
    const j = await r.json();
    if (j.success) {
      if (j.phase === 'active' || j.phase === 'finished') {
        document.getElementById('preGame').style.display = 'none';
        document.getElementById('inGame').style.display = '';
        document.getElementById('youScore').textContent = j.scores?.you ?? 0;
        document.getElementById('oppScore').textContent = j.scores?.opp ?? 0;
      }
      if (Array.isArray(j.signals) && j.signals.length) {
        j.signals.forEach(s => {
          if (s.signal === 'PLAY_AGAIN') alert(`${s.sender} clicked "Play Again"`);
          if (s.signal === 'RETURN_TO_LOBBY') alert(`${s.sender} clicked "Return to Lobby"`);
        });
      }
    }
  } catch(e){}
  setTimeout(poll, 3000);
}

// --- Start automatically for lobby owner ---
autoStartIfOwner();
poll();

async function playAgain() {
  try {
    const r = await fetch(`/tcg.backend/game_modes/1v1_random_api.php`, {
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body: new URLSearchParams({action:'play_again', lobby_id: lobbyId})
    });
    const j = await r.json();
    if (j.success) alert('You clicked "Play Again". The owner will start a new match.');
  } catch(e){}
}

async function returnToLobby() {
  try {
    const r = await fetch(`/tcg.backend/game_modes/1v1_random_api.php`, {
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body: new URLSearchParams({action:'return_to_lobby', lobby_id: lobbyId})
    });
    const j = await r.json();
    if (j.success) {
      alert('You returned to the lobby.');
      window.location.href = `/my_lobby.php?lobby_id=${lobbyId}`;
    }
  } catch(e){}
}
</script>
</body>
</html>
