<?php
// /var/www/tcg.backend/game_modes/1v1_random.php
// One-click start: when owner arrives here from my_lobby.php, we auto-start the battle.
// Page shows 5 stat buttons for the current player to choose each round.
// Polling updates the score display and handles signals/alerts.

ini_set('display_errors', 1);
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
  <p>Once both players are ready and the owner starts the game, the battle begins. You’ll get 10 random cards each. Pick a stat on your turn.</p>

  <!-- Pregame note (non-owner waiting) -->
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
      <div class="hint">If it isn’t actually your turn yet, the server will say so — just wait for your turn.</div>
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
// ---------- Config ----------
const lobbyId = <?= (int)$lobbyId ?>;
const isOwner = <?= ((int)$lobby['owner_id'] === $userId) ? 'true' : 'false' ?>;

// We keep a tiny bit of local turn tracking for UX.
// Server is authoritative and will reject out-of-turn plays.
let lastPhase = null;

// ---------- Auto-start for owner ----------
async function autoStartIfOwner() {
  if (!isOwner) return; // opponent waits; owner triggers match creation once
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
    // If success or already started, polling below will flip to in-game UI.
    // If fail (e.g., someone un-readied), owner will see no transition.
  } catch (e) {
    // non-fatal; polling still runs
  }
}

// ---------- Poll match status ----------
async function poll() {
  try {
    const r = await fetch(`/tcg.backend/game_modes/1v1_random_api.php?action=match_status&lobby_id=${lobbyId}`, {cache:'no-store'});
    const j = await r.json();
    if (j && j.success) {
      // Phase handling
      if (j.phase === 'pregame') {
        document.getElementById('preGame').style.display = '';
        document.getElementById('inGame').style.display = 'none';
      } else if (j.phase === 'active') {
        document.getElementById('preGame').style.display = 'none';
        document.getElementById('inGame').style.display = '';
      } else if (j.phase === 'finished') {
        document.getElementById('preGame').style.display = 'none';
        document.getElementById('inGame').style.display = '';
        // The API returns perspective result only to the turn chooser on final play.
        // If we don't have it via polling, show a generic alert once.
        if (lastPhase !== 'finished') {
          alert('Match finished! Check the scoreboard and Play Again or Return to Lobby.');
        }
      }

      // Update scores if present
      if (j.scores) {
        document.getElementById('youScore').textContent = (j.scores.you ?? 0);
        document.getElementById('oppScore').textContent = (j.scores.opp ?? 0);
      }

      // Signals (manual-close popups)
      if (Array.isArray(j.signals) && j.signals.length) {
        j.signals.forEach(s => {
          if (s.signal === 'PLAY_AGAIN') alert(`${s.sender} clicked "Play Again"`);
          if (s.signal === 'RETURN_TO_LOBBY') alert(`${s.sender} clicked "Return to Lobby"`);
        });
      }

      // We don’t yet receive authoritative "whose turn" via match_status.
      // For now, show both turn panels in a conservative way:
      // - If game active: allow the user to try a stat; server will block if it's not their turn.
      if (j.phase === 'active') {
        document.getElementById('yourTurn').style.display = '';
        document.getElementById('oppTurn').style.display = '';
      } else {
        document.getElementById('yourTurn').style.display = 'none';
        document.getElementById('oppTurn').style.display = 'none';
      }

      lastPhase = j.phase || null;
    }
  } catch (e) {
    // ignore transient errors
  }
  setTimeout(poll, 2500);
}

// ---------- Actions ----------
async function chooseStat(stat) {
  try {
    const r = await fetch(`/tcg.backend/game_modes/1v1_random_api.php`, {
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body: new URLSearchParams({
        action: 'choose_stat',
        lobby_id: lobbyId,
        stat: stat
      })
    });
    const j = await r.json();
    if (!j.success) {
      if (j.error === 'not_your_turn') {
        alert("It isn't your turn yet. Please wait for your opponent.");
      } else if (j.error) {
        alert("Error: " + j.error);
      }
      return;
    }

    // Update scores if returned
    if (j.scores) {
      document.getElementById('youScore').textContent = (j.scores.p1 ?? j.scores.you ?? 0); // API may send different shapes; we handle both.
      document.getElementById('oppScore').textContent = (j.scores.p2 ?? j.scores.opp ?? 0);
    }

    // Handle finished result (API returns perspective result to the chooser)
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
    const r = await fetch(`/tcg.backend/game_modes/1v1_random_api.php`, {
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body: new URLSearchParams({action:'play_again', lobby_id: lobbyId})
    });
    const j = await r.json();
    if (j.success) alert('You clicked "Play Again". The owner can start a new match.');
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
    } else if (j.error) {
      alert('Error: ' + j.error);
    }
  } catch(e){}
}

// ---------- Boot ----------
(async function init(){
  // Owner auto-starts (creates battle, sets in_match)
  await autoStartIfOwner();
  // Everyone polls status/scores/signals
  poll();
})();
</script>
</body>
</html>
