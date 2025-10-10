<?php
// Optional: soft gate – frontend redirect to login if not logged in.
// Backend also blocks unauthenticated play, so this is just nicer UX.
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: login.html');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Animorphs TCG – 1vAI</title>
  <link rel="stylesheet" href="demo.css" />
  <style>
    /* Minimal sidebar layout so users can navigate while playing */
    :root { --sidebar-w: 260px; }
    body { margin: 0; }
    .layout { display: grid; grid-template-columns: var(--sidebar-w) 1fr; min-height: 100vh; }
    .sidebar {
      background: #0f1220; color: #fff; padding: 20px 16px; position: sticky; top: 0; height: 100vh; box-sizing: border-box;
      border-right: 1px solid rgba(255,255,255,0.08);
    }
    .brand { font-weight: 700; letter-spacing: .5px; margin-bottom: 18px; }
    .userbox { font-size: .9rem; opacity:.85; margin-bottom: 16px; }
    .nav { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
    .nav a {
      display: block; padding: 10px 12px; border-radius: 10px; text-decoration: none; color: #e7e7e7;
      background: rgba(255,255,255,0.04);
    }
    .nav a:hover { background: rgba(255,255,255,0.1); }
    .nav a.active { background: rgba(93, 163, 255, 0.18); color: #fff; }
    .content { padding: 24px; }
    /* Tweak existing demo.css layout so it plays nice in the content column */
    .container { max-width: 1100px; margin: 0; }
    .start-area button, #restartArea button, #play1vAI {
      cursor: pointer;
    }
    @media (max-width: 900px){
      .layout { grid-template-columns: 1fr; }
      .sidebar { position: relative; height: auto; }
    }
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
  <div class="layout">
    <aside class="sidebar">
      <div class="brand">Animorphs TCG</div>
      <div class="userbox">Logged in as: <strong><?php echo htmlspecialchars($_SESSION['username'] ?? 'Player'); ?></strong></div>
      <nav class="nav">
        <a href="profile.php">Profile</a>
        <a href="select_free_cards.html">Select Free Cards</a>
        <a href="1vai.php" class="active">1vAI Battle</a>
        <a href="leaderboards.php">Leaderboards</a>
        <a href="logout.php">Logout</a>
      </nav>
    </aside>

    <main class="content">
      <div class="container">
        <h1>1vAI Battle</h1>
        <p id="instructions" class="instructions">
          Click "Start 1vAI" to begin. Your 10 selected free cards will be shuffled. Pick a stat on odd rounds; the AI picks on even rounds.
        </p>

        <div id="startArea" class="start-area">
          <button id="play1vAI">Start 1vAI</button>
        </div>

        <div id="scoreboard" class="scoreboard" style="display:none;">
          <div>Player Wins: <span id="playerWins">0</span></div>
          <div>AI Wins: <span id="aiWins">0</span></div>
        </div>

        <div id="battlefield" class="battlefield" style="display:none;">
          <div id="playerStats" class="card-area"></div>
          <div class="vs">VS</div>
          <div id="aiStats" class="card-area"></div>
        </div>

        <div id="roundResult" class="result"></div>

        <div id="restartArea" style="display:none;">
          <button id="playAgain">Play Again</button>
        </div>
      </div>
    </main>
  </div>

  <script src="1vai.js"></script>
</body>
</html>
