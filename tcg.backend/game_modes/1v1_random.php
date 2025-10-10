<?php
// /var/www/tcg.backend/game_modes/1v1_random.php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: /login.php');
    exit;
}
$lobbyId = $_GET['lobby_id'] ?? null;
if (!$lobbyId) {
    header('Location: /lobbies.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Animorphs TCG – 1v1 Random Battle</title>
  <link rel="stylesheet" href="/assets/style.css" />
  <style>
    :root { --sidebar-w: 240px; }
    body { margin:0; }
    .layout { display:grid; grid-template-columns: var(--sidebar-w) 1fr 300px; min-height:100vh; }
    .sidebar { background:#0f1220; color:#fff; padding:20px; }
    .nav a { display:block; padding:8px; margin:4px 0; border-radius:8px; background:rgba(255,255,255,0.08); text-decoration:none; color:#eee; }
    .nav a:hover { background:rgba(255,255,255,0.15); }
    .content { padding:20px; }
    .chatbox { border-left:1px solid #444; display:flex; flex-direction:column; }
    .chat-messages { flex:1; padding:10px; overflow-y:auto; background:#181b2a; color:#fff; }
    .chat-input { display:flex; border-top:1px solid #444; }
    .chat-input input { flex:1; padding:8px; border:none; }
    .chat-input button { padding:8px 12px; background:#2c80ff; color:#fff; border:none; cursor:pointer; }
    .battlefield { display:flex; align-items:center; justify-content:center; gap:20px; margin:20px 0; }
    .card-area { width:200px; }
    .vs { font-size:24px; font-weight:bold; }
  </style>
</head>
<body>
<div class="layout">
  <aside class="sidebar">
    <div class="brand">Animorphs TCG</div>
    <div class="userbox">Logged in as: <strong><?php echo htmlspecialchars($_SESSION['username'] ?? 'Player'); ?></strong></div>
    <nav class="nav">
      <a href="/profile.php">Profile</a>
      <a href="/leaderboards.php">Leaderboards</a>
      <a href="/lobbies.php">Back to Lobbies</a>
      <a href="/logout.php">Logout</a>
    </nav>
  </aside>

  <main class="content">
    <h1>1v1 Random Battle</h1>
    <p id="instructions">
      Once both players are ready and the owner starts the game, click "Start Battle" to begin. 
      You’ll get 10 random cards each. Pick stats each round to battle.
    </p>

    <div id="startArea">
      <button id="startBtn">Start Battle</button>
    </div>

    <div id="scoreboard" style="display:none;">
      <div>You: <span id="myWins">0</span></div>
      <div>Opponent: <span id="oppWins">0</span></div>
    </div>

    <div id="battlefield" class="battlefield" style="display:none;">
      <div id="myCard" class="card-area"></div>
      <div class="vs">VS</div>
      <div id="oppCard" class="card-area"></div>
    </div>

    <div id="roundResult"></div>

    <div id="restartArea" style="display:none;">
      <button onclick="location.href='/lobbies.php'">Return to Lobby</button>
    </div>
  </main>

  <aside class="chatbox">
    <div class="chat-messages" id="chatMessages"></div>
    <div class="chat-input">
      <input type="text" id="chatInput" placeholder="Type a message..." />
      <button id="sendChat">Send</button>
    </div>
  </aside>
</div>

<script>
const lobbyId = <?php echo (int)$lobbyId; ?>;
</script>
<script src="/game_modes/1v1_random.js"></script>
</body>
</html>
