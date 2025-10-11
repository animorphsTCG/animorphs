<?php
// /var/www/tcg.backend/game_modes/1v1_random.php
// One-click start for owner + stat buttons UI. All fetch calls send cookies explicitly.

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
    .stat-grid { display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
    .stat-btn { min-width:120px; }
    .hint { color:#666; font-size: 13px; }
  </style>
</head>
<body>
  <h1>1v1 Random Battle</h1>
  <p>You’ll each get 10 random cards. On your turn, pick a stat to compare. First to win the most rounds wins the match.</p>

  <!-- Pregame note -->
  <div id="preGame" class="row" style="display:none;">
    <?php if ((int)$lobby['owner_id'] === $userId): ?>
      <em>Preparing match…</em>
    <?php else: ?>
      <em>Waiting for the owner to start…</em>
    <?php endif; ?>
  </div>

  <!-- In-game UI -->
  <div id="inGame" class="row" style="display:none;">
    <div class="score">
      You: <span id="youScore">0</span> &nbsp;&nbsp; Opponent: <span id="oppScore">0</span>
    </div>

    <div id="yourTurn" class="row" style="display:none;">
      <strong>It’s your turn. Choose a stat:</strong>
      <div class="stat-grid">
        <button class="btn stat-btn" onclick="chooseStat('power')">Power</button>
        <button class="btn stat-btn" onclick="chooseStat('health')">Health</button>
        <button class="btn stat-btn" onclick="chooseStat('attack')">Attack</button>
        <button class="btn stat-btn" onclick="chooseStat('sats')">SATS</button>
        <button class="btn stat-btn" onclick="chooseStat('size')">Size</button>
      </div>
      <div class="hint">If it’s not actually your turn, the server will tell you. Just wait for your opponent.</div>
    </div>

    <div id="oppTurn" class="row" style="display:none;">
      <strong>Waiting for your opponent to choose a stat…</strong>
    </div>

    <div class="row" style="margin-top:18px;">
      <button class="btn" onclick="playAgain()">Play Again</button>
      <button class="btn" onclick="returnToLobby()">Return to Lobby</button>
    </div>
  </div>

<script>
const lobbyId = <?= (int)$lobbyId ?>;
const isOwner = <?= ((int)$lobby['owner_id'] === $userId) ? 'true' : 'false' ?>;

let lastPhase = null;

// --- Helper to handle JSON safely
async function safeJSON(res) {
  try { return await res.json(); } catch { return null; }
}

// ---------- Auto-start for owner (send cookies!) ----------
async function autoStartIfOwner() {
  if (!isOwner) return;
  try {
    const r = await fetch(`/game_modes/1v1_random_api.php`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ action: 'owner_start_match', lobby_id: lobbyId })
    });
    const j = await safeJSON(r);
    if (j && j.success) {
      // Good — polling below will flip UI to active
      return;
    }
    // If login_required or both_not_ready etc., just keep polling; UI will show preGame.
  } catch (e) { /* ignore; poll will keep trying UI */ }
}

// ---------- Poll match status (send cookies!) ----------
async function poll() {
  try {
    const r = await fetch(`/game_modes/1v1_random_api.php?action=match_status&lobby_id=${lobbyId}`, {
      credentials: 'same-origin',
      cache: 'no-store'
    });
    const j = await safeJSON(r);

    if (!j || !j.success) {
      // If we somehow lost session, keep the preGame panel visible as a hint.
      document.getElementById('preGame').style.display = '';
      document.getElementById('inGame').style.display = 'none';
      setTimeout(poll, 2500);
      return;
    }

    if (j.phase === 'pregame') {
      document.getElementById('preGame').style.display = '';
      document.getElementById('inGame').style.display = 'none';
    } else if (j.phase === 'active') {
      document.getElementById('preGame').style.display = 'none';
      document.getElementById('inGame').style.display = '';
    } else if (j.phase === 'finished') {
      document.getElementById('preGame').style.display = 'none';
      document.getElementById('inGame').style.display = '';
      if (lastPhase !== 'finished') {
        alert('Match finished! Check the scoreboard and Play Again or Return to Lobby.');
      }
    }

    if (j.scores) {
      document.getElementById('youScore').textContent = (j.scores.you ?? 0);
      document.getElementById('oppScore').textContent = (j.scores.opp ?? 0);
    }

    if (Array.isArray(j.signals) && j.signals.length) {
      j.signals.forEach(s => {
        if (s.signal === 'PLAY_AGAIN') alert(`${s.sender} clicked "Play Again"`);
        if (s.signal === 'RETURN_TO_LOBBY') alert(`${s.sender} clicked "Return to Lobby"`);
      });
    }

    // Conservative turn UI: allow click anytime; server enforces turn.
    if (j.phase === 'active') {
      document.getElementById('yourTurn').style.display = '';
      document.getElementById('oppTurn').style.display = '';
    } else {
      document.getElementById('yourTurn').style.display = 'none';
      document.getElementById('oppTurn').style.display = 'none';
    }

    lastPhase = j.phase || null;
  } catch (e) { /* ignore transient errors */ }
  setTimeout(poll, 2500);
}

// ---------- Actions (send cookies!) ----------
async function chooseStat(stat) {
  try {
    const r = await fetch(`/game_modes/1v1_random_api.php`, {
      method:'POST',
      credentials: 'same-origin',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body: new URLSearchParams({ action:'choose_stat', lobby_id: lobbyId, stat: stat })
    });
    const j = await safeJSON(r);
    if (!j || !j.success) {
      if (j && j.error === 'not_your_turn') {
        alert("It isn't your turn yet. Please wait for your opponent.");
      } else if (j && j.error) {
        alert("Error: " + j.error);
      } else {
        alert("Error performing action.");
      }
      return;
    }
    if (j.scores) {
      // handle both shapes (from different endpoints)
      document.getElementById('youScore').textContent = (j.scores.you ?? j.scores.p1 ?? 0);
      document.getElementById('oppScore').textContent = (j.scores.opp ?? j.scores.p2 ?? 0);
    }
    if (j.phase === 'finished') {
      if (j.result === 'win') alert('You Win!');
      else if (j.result === 'loss') alert('You Lose!');
      else alert('Draw!');
    }
  } catch (e) {
    alert("Network error while choosing stat.");
  }
}

async function playAgain() {
  try {
    const r = await fetch(`/game_modes/1v1_random_api.php`, {
      method:'POST',
      credentials: 'same-origin',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body: new URLSearchParams({action:'play_again', lobby_id: lobbyId})
    });
    const j = await safeJSON(r);
    if (j && j.success) alert('You clicked "Play Again". The owner can start a new match.');
  } catch(e){}
}

async function returnToLobby() {
  try {
    const r = await fetch(`/game_modes/1v1_random_api.php`, {
      method:'POST',
      credentials: 'same-origin',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body: new URLSearchParams({action:'return_to_lobby', lobby_id: lobbyId})
    });
    const j = await safeJSON(r);
    if (j && j.success) {
      alert('You returned to the lobby.');
      window.location.href = `/my_lobby.php?lobby_id=${lobbyId}`;
    } else if (j && j.error) {
      alert('Error: ' + j.error);
    }
  } catch(e){}
}

// ---------- Boot ----------
(async function init(){
  await autoStartIfOwner();   // owner creates battle + sets in_match
  poll();                     // both users begin polling
})();
</script>
</body>
</html>
