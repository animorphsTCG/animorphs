<?php
// /var/www/tcg.backend/game_modes/1v1_random.php
session_start();
if (!isset($_SESSION['user_id'])) {
  header('Location: /login.php');
  exit;
}
$userId = (int)$_SESSION['user_id'];
$username = htmlspecialchars($_SESSION['username'] ?? 'Player');
$lobbyId = (int)($_GET['lobby_id'] ?? 0);
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Animorphs TCG – 1v1 Random</title>
<link rel="stylesheet" href="demo.css" />
<style>
  :root { --sidebar-w: 260px; }
  body { margin: 0; }
  .layout { display: grid; grid-template-columns: var(--sidebar-w) 1fr; min-height: 100vh; }
  .sidebar {
    background:#0f1220; color:#fff; padding:20px 16px; border-right:1px solid rgba(255,255,255,0.08);
  }
  .content { padding:24px; }
</style>
</head>
<body>
<script>
function sendHeartbeat(){ fetch('/presence/update_presence.php').catch(()=>{}); }
setInterval(sendHeartbeat,60000); sendHeartbeat();
</script>

<div class="layout">
  <aside class="sidebar">
    <div class="brand">Animorphs TCG</div>
    <div class="userbox">Logged in as: <strong><?= $username ?></strong></div>
    <nav class="nav">
      <a href="/profile.php">Profile</a>
      <a href="/leaderboard.php">Leaderboards</a>
      <a href="/logout.php">Logout</a>
    </nav>
  </aside>

  <main class="content">
    <div class="container">
      <h1>1v1 Random Battle</h1>
      <p id="instructions">
        Wait for your opponent. Once the game begins, pick a stat when it’s your turn.
      </p>

      <div id="scoreboard" style="display:none;">
        <div>You: <span id="p1Wins">0</span></div>
        <div>Opponent: <span id="p2Wins">0</span></div>
      </div>

      <div id="battlefield" style="display:none;">
        <div id="p1Card" class="card-area"></div>
        <div class="vs">VS</div>
        <div id="p2Card" class="card-area"></div>
      </div>

      <div id="roundResult" class="result"></div>
      <div id="restartArea" style="display:none;">
        <button id="playAgain">Play Again</button>
        <button id="returnLobby">Return to Lobby</button>
      </div>
    </div>
  </main>
</div>

<script>
const LOBBY_ID = <?= $lobbyId ?>;
const USER_ID  = <?= $userId ?>;
</script>
<script src="1v1_random.js"></script>
</body>
</html>
