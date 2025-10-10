<?php
// my_lobby.php — personal lobby manager with owner/participant logic
ini_set('display_errors', 0);
error_reporting(E_ALL);
session_start();
require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable('/home');
$dotenv->safeLoad();

if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}
$userId   = $_SESSION['user_id'];
$username = $_SESSION['username'] ?? "Player";

// Connect to DB to check if user is already in a lobby
try {
    $host = $_ENV['TCG_DB_HOST'];
    $db   = $_ENV['TCG_DB_NAME'];
    $user = $_ENV['TCG_DB_USER'];
    $pass = $_ENV['TCG_DB_PASS'];
    $port = $_ENV['TCG_DB_PORT'] ?? 5432;

    $pdo = new PDO(
        "pgsql:host=$host;port=$port;dbname=$db",
        $user,
        $pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $stmt = $pdo->prepare("
        SELECT l.id, l.owner_id, l.mode, l.is_public, u.username AS owner_name
        FROM lobbies l
        JOIN lobby_participants p ON p.lobby_id = l.id
        JOIN users u ON u.id = l.owner_id
        WHERE p.user_id = :uid
        ORDER BY l.id DESC
        LIMIT 1
    ");
    $stmt->execute(['uid' => $userId]);
    $currentLobby = $stmt->fetch(PDO::FETCH_ASSOC);
} catch (Exception $e) {
    $currentLobby = null;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>My Lobby - Animorphs TCG</title>
<link rel="stylesheet" href="/assets/style.css">
<style>
  body { font-family: Arial, sans-serif; }
  .container { display: flex; gap: 20px; flex-wrap: wrap; }
  .section { flex: 1; border: 1px solid #ccc; padding: 10px; border-radius: 6px; min-width: 300px; }
  .chat-box { height: 300px; overflow-y: auto; border: 1px solid #aaa; padding: 5px; margin-bottom: 5px; }
  .chat-input { display: flex; }
  .chat-input input { flex: 1; padding: 5px; }
  .chat-input button { padding: 5px 10px; }
  .participant { padding: 3px; border-bottom: 1px dashed #ccc; }
</style>
</head>
<body>
<script>
function sendHeartbeat(){ fetch('/presence/update_presence.php').catch(()=>{}); }
setInterval(sendHeartbeat, 60000); sendHeartbeat();
</script>

<nav>
  <a href="index.php">Home</a> |
  <a href="profile.php">Profile</a> |
  <a href="store.php">Store</a> |
  <a href="leaderboard.php">Leaderboard</a> |
  <a href="lobbies.php">Lobbies</a> |
  <a href="my_lobby.php"><b>My Lobby</b></a> |
  <a href="messages.php">Messages</a> |
  <a href="logout.php">Logout</a>
</nav>
<hr>

<h1>
  Welcome to My Lobby, 
  <?php 
    if ($currentLobby) {
        echo htmlspecialchars($currentLobby['owner_name']);
    } else {
        echo htmlspecialchars($username);
    }
  ?>
</h1>

<div class="container">
  <?php if (!$currentLobby): ?>
      <!-- NOT IN A LOBBY -->
      <div class="section">
          <h2>Create Lobby</h2>
          <button onclick="startLobby('1v1')">Start 1v1 Lobby</button>
          <button onclick="startLobby('3p')">Start 3 Player Lobby</button>
          <button onclick="startLobby('4p')">Start 4 Player Lobby</button>
      </div>

  <?php elseif ($currentLobby['owner_id'] == $userId): ?>
      <!-- OWNER VIEW -->
      <div class="section">
          <h2>Lobby Controls</h2>
          <button id="toggleVisibilityBtn" onclick="toggleVisibility()">
            <?php echo $currentLobby['is_public'] ? "Make Private" : "Make Public"; ?>
          </button>
          <button onclick="closeLobby()" id="closeBtn">Close Lobby</button>
      </div>
      <div class="section">
          <h2>Lobby Participants</h2>
          <div id="participants"></div>
          <!-- OWNER now also has Set Ready -->
          <button id="readyBtn" onclick="toggleReady()">Set Ready</button>
      </div>
      <div class="section">
          <h2>Game Mode</h2>
          <button onclick="chooseMode('1v1_random')">1v1 Random</button>
          <button onclick="chooseMode('1v1_custom')">1v1 Custom</button>
          <button onclick="chooseMode('3p_random')">3 Player Random</button>
          <button onclick="chooseMode('4p_random')">4 Player Random</button>
          <div id="modeChoice"></div>
          <button id="startMatchBtn" style="display:none;" onclick="startMatch()">Start Match</button>
      </div>
      <div class="section">
          <h2>Invite Friends</h2>
          <div id="friendsList">Loading...</div>
      </div>
      <div class="section">
          <h2>Lobby Chat</h2>
          <div id="chat" class="chat-box"></div>
          <div class="chat-input">
              <input type="text" id="chatMessage" placeholder="Type a message...">
              <button onclick="sendMessage()">Send</button>
          </div>
      </div>

  <?php else: ?>
      <!-- PARTICIPANT VIEW -->
      <div class="section">
          <h2>Lobby Participants</h2>
          <div id="participants"></div>
          <button id="readyBtn" onclick="toggleReady()">Set Ready</button>
          <!-- NEW: participant can leave -->
          <button onclick="leaveLobby()">Leave Lobby</button>
      </div>
      <div class="section">
          <h2>Lobby Chat</h2>
          <div id="chat" class="chat-box"></div>
          <div class="chat-input">
              <input type="text" id="chatMessage" placeholder="Type a message...">
              <button onclick="sendMessage()">Send</button>
          </div>
      </div>
  <?php endif; ?>
</div>

<script>
let currentLobby = <?php echo $currentLobby ? (int)$currentLobby['id'] : 'null'; ?>;
let chatInterval = null;
let participantInterval = null;
let readyInterval = null;
let isReady = false;
let isPublic = <?php echo ($currentLobby && $currentLobby['is_public']) ? 'true' : 'false'; ?>;
const currentUserId = <?php echo (int)$userId; ?>;
let chosenMode = null;

function chooseMode(mode){
  chosenMode = mode;
  document.getElementById('modeChoice').textContent = "Selected mode: "+mode;
  checkStartAvailability();
}

function checkStartAvailability(){
  if(chosenMode && currentLobby){
    fetch('/lobbies/get_participants.php?lobby_id='+currentLobby)
    .then(r=>r.json()).then(resp=>{
      let requiredCount = chosenMode.startsWith('4p') ? 4 : chosenMode.startsWith('3p') ? 3 : 2;
      let allReady = resp.participants.length === requiredCount && resp.participants.every(p=>p.is_ready);
      document.getElementById('startMatchBtn').style.display = allReady ? "inline-block" : "none";
    });
  }
}

function startMatch(){
  if(!chosenMode){ alert("Choose a mode first"); return; }
  window.location.href='/game_modes/'+chosenMode+'.php?lobby_id='+currentLobby;
}

// Toggle ready state
function toggleReady(){
  if(!currentLobby) return;
  fetch('/lobbies/set_ready.php',{
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:'lobby_id='+currentLobby+'&ready='+(isReady?0:1)
  }).then(r=>r.json()).then(data=>{
    if(data.success){
      isReady = data.ready; // comes back from server (true/false)
      document.getElementById('readyBtn').textContent = isReady ? "Unset Ready" : "Set Ready";
      loadParticipants();
      checkStartAvailability();   // <-- added
    }
  });
}

// Create new lobby
function startLobby(mode){
  fetch('/lobbies/create_lobby.php',{
    method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:'mode='+encodeURIComponent(mode)
  }).then(r=>r.json()).then(data=>{
    if(data.success){ location.reload(); }
    else { alert("Error: "+data.error); }
  });
}

// Close lobby (owner only)
function closeLobby(){
  if(!currentLobby) return;
  fetch('/lobbies/leave_lobby.php',{
    method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:'lobby_id='+currentLobby
  }).then(r=>r.json()).then(data=>{
    if(data.success){ location.reload(); }
    else { alert("Error: "+data.error); }
  });
}

// Leave lobby (participant)
function leaveLobby(){
  if(!currentLobby) return;
  fetch('/lobbies/leave_lobby.php',{
    method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:'lobby_id='+currentLobby
  }).then(r=>r.json()).then(data=>{
    if(data.success){ location.href='my_lobby.php'; }
    else { alert("Error: "+data.error); }
  });
}

// Toggle public/private
function toggleVisibility(){
  if(!currentLobby) return;
  fetch('/lobbies/set_visibility.php',{
    method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:'lobby_id='+currentLobby+'&is_public='+(isPublic?0:1)
  }).then(r=>r.json()).then(data=>{
    if(data.success){
      isPublic=data.is_public;
      document.getElementById('toggleVisibilityBtn').textContent=isPublic?"Make Private":"Make Public";
    } else { alert("Error: "+data.error); }
  });
}

// Kick player (owner only)
function kickPlayer(userId){
  if(!currentLobby) return;
  fetch('/lobbies/kick_player.php',{
    method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:'lobby_id='+currentLobby+'&target_user_id='+userId
  }).then(r=>r.json()).then(data=>{
    if(data.success){ loadParticipants(); }
    else { alert("Error: "+data.error); }
  });
}

// Chat
function sendMessage(){
  if(!currentLobby){ alert("Not in a lobby."); return; }
  let msg=document.getElementById('chatMessage').value.trim();
  if(!msg) return;
  fetch('/lobbies/send_message.php',{
    method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:'lobby_id='+currentLobby+'&message='+encodeURIComponent(msg)
  }).then(r=>r.json()).then(()=>{
    document.getElementById('chatMessage').value=''; loadMessages();
  });
}

function loadMessages(){
  if(!currentLobby) return;
  fetch('/lobbies/get_messages.php?lobby_id='+currentLobby+'&limit=50')
  .then(r=>r.json()).then(data=>{
    if(data.messages){
      let chat=document.getElementById('chat');
      chat.innerHTML='';
      data.messages.forEach(m=>{
        let div=document.createElement('div');
        div.textContent="["+m.sent_at+"] "+m.username+": "+m.message;
        chat.appendChild(div);
      });
      chat.scrollTop=chat.scrollHeight;
    }
  });
}

// Participants
function loadParticipants(){
  if(!currentLobby) return;
  fetch('/lobbies/get_participants.php?lobby_id='+currentLobby)
  .then(r=>r.json()).then(resp=>{
    let container=document.getElementById('participants');
    if(!container) return;
    container.innerHTML='';
    resp.participants.forEach(p=>{
      let div=document.createElement('div');
      div.className='participant';
      div.textContent = p.username + (p.user_id==currentUserId ? " (You)" : "") + (p.is_ready ? " ✅" : " ❌");
      if(resp.owner_id==currentUserId && p.user_id!=currentUserId){
        let btn=document.createElement('button');
        btn.textContent="Kick";
        btn.onclick=()=>kickPlayer(p.user_id);
        div.appendChild(document.createTextNode(" "));
        div.appendChild(btn);
      }
      container.appendChild(div);
    });
    checkStartAvailability();   // <-- ensure button visibility updates
  });
}

// Friends
function loadFriends(){
  let el=document.getElementById('friendsList');
  if(!el) return;
  fetch('/lobbies/list_friends.php').then(r=>r.json()).then(data=>{
    el.innerHTML='';
    if(data.friends && data.friends.length){
      data.friends.forEach(f=>{
        let div=document.createElement('div');
        let bp=f.has_battle_pass_entitlement?" (Battle Pass ✅)":" (No Battle Pass)";
        let status=" - Free";
        if(f.in_match){ status=" - In Match #"+f.in_match; }
        else if(f.in_lobby){ status=" - In Lobby #"+f.in_lobby; }
        div.textContent=f.username+bp+status;
        let btn=document.createElement('button');
        btn.textContent="Invite";
        btn.disabled=(f.in_match||f.in_lobby);
        btn.onclick=()=>inviteFriend(f.user_id);
        div.appendChild(document.createTextNode(" "));
        div.appendChild(btn);
        el.appendChild(div);
      });
    } else { el.textContent="No online friends with Full Game."; }
  });
}

function inviteFriend(friendId){
  if(!currentLobby){ alert("You must be in a lobby first."); return; }
  fetch('/lobbies/invite_friend.php',{
    method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:'lobby_id='+currentLobby+'&friend_id='+friendId
  }).then(r=>r.json()).then(data=>{
    if(data.success){ alert("Invite sent"); }
    else { alert("Error: "+data.error); }
  });
}

// Auto-refresh
if(currentLobby){
  chatInterval=setInterval(loadMessages,3000);
  participantInterval=setInterval(loadParticipants,5000);
  readyInterval=setInterval(loadParticipants,5000);
  loadMessages(); loadParticipants(); loadFriends();
  setInterval(loadFriends,10000);
}
</script>
</body>
</html>
