<?php
// 1v1 Random Battle – page shell + layout (demo-style) + presence ping
ini_set('display_errors', 0);
error_reporting(E_ALL);
session_start();
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

// Optional: quick sanity that lobby exists
try {
    $pdo = new PDO(
        "pgsql:host={$_ENV['TCG_DB_HOST']};port=".($_ENV['TCG_DB_PORT'] ?? 5432).";dbname={$_ENV['TCG_DB_NAME']}",
        $_ENV['TCG_DB_USER'],
        $_ENV['TCG_DB_PASS'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $st = $pdo->prepare("SELECT id FROM lobbies WHERE id=:l LIMIT 1");
    $st->execute([':l'=>$lobbyId]);
    if (!$st->fetch(PDO::FETCH_ASSOC)) { echo "Lobby not found."; exit; }
} catch (Throwable $e) {
    // non-fatal to the UI; polling will surface issues
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>1v1 Random Battle</title>
  <link rel="stylesheet" href="/tcg.frontend/demo.css" />
  <style>
    .layout { max-width: 1100px; margin: 0 auto; padding: 24px; }
  </style>
</head>
<body>
<script>
function sendHeartbeat(){
  fetch('/presence/update_presence.php').catch(()=>{});
}
setInterval(sendHeartbeat, 60000); sendHeartbeat();
const LOBBY_ID = <?= (int)$lobbyId ?>;
</script>

<div class="layout">
  <div class="container">
    <h1>1v1 Random Battle</h1>
    <p id="instructions" class="instructions">
      You’ll each get 10 random cards. Pick a stat on your turn (owner: odd rounds, opponent: even rounds).
    </p>

    <div id="scoreboard" class="scoreboard" style="display:none;">
      <div>You: <span id="p1Wins">0</span></div>
      <div>Opponent: <span id="p2Wins">0</span></div>
    </div>

    <div id="battlefield" class="battlefield" style="display:none;">
      <div id="p1Card" class="card-area"></div>
      <div class="vs">VS</div>
      <div id="p2Card" class="card-area"></div>
    </div>

    <div id="roundResult" class="result"></div>

    <div id="restartArea" class="start-area" style="display:none;">
      <button id="playAgain">Play Again</button>
      <button id="returnLobby">Return to Lobby</button>
    </div>
  </div>
</div>

<script src="/game_modes/1v1_random.js"></script>
</body>
</html>
