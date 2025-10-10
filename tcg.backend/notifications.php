<?php
// notifications.php — user-facing notifications page (UI)
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
$username = $_SESSION['username'] ?? "Player";
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Notifications - Animorphs TCG</title>
<link rel="stylesheet" href="/assets/style.css">
<style>
  body { font-family: Arial, sans-serif; }
  .wrap { max-width: 1000px; margin: 0 auto; padding: 10px; }
  .section { margin: 16px 0; padding: 12px; border:1px solid #ddd; border-radius:8px; background:#fff; }
  .row { padding:8px 0; border-bottom:1px dashed #e5e5e5; display:flex; align-items:center; justify-content:space-between; gap:8px; }
  .row:last-child { border-bottom:0; }
  .row .meta { font-size: 0.9em; color:#555; }
  .btn { padding:6px 10px; border-radius:6px; border:1px solid #ccc; background:#f8f8f8; cursor:pointer; }
  .btn:disabled { opacity:0.5; cursor:not-allowed; }
  .empty { color:#777; }
</style>
</head>
<body>
<script>
function sendHeartbeat(){ fetch('/presence/update_presence.php').catch(()=>{}); }
setInterval(sendHeartbeat, 60000); sendHeartbeat();
</script>

<nav style="padding:8px;">
  <a href="index.php">Home</a> |
  <a href="profile.php">Profile</a> |
  <a href="store.php">Store</a> |
  <a href="leaderboard.php">Leaderboard</a> |
  <a href="lobbies.php">Lobbies</a> |
  <a href="my_lobby.php">My Lobby</a> |
  <a href="notifications.php"><b>Notifications</b></a> |
  <a href="messages.php">Messages</a> |
  <a href="logout.php">Logout</a>
</nav>
<hr>

<div class="wrap">
  <h1>Notifications for <?php echo htmlspecialchars($username); ?></h1>

  <div class="section">
    <h2>Incoming Lobby Invites</h2>
    <div id="incomingList" class="list"></div>
  </div>

  <div class="section">
    <h2>My Sent Invites</h2>
    <div id="outgoingList" class="list"></div>
  </div>

  <!-- Future sections:
  <div class="section"><h2>Unread Messages</h2><div id="unreadMessages"></div></div>
  <div class="section"><h2>Announcements</h2><div id="announcements"></div></div>
  -->
</div>

<script>
function fmt(ts){ // simple timestamp trunc
  if(!ts) return '';
  return ts.replace('T',' ').split('.')[0];
}

function fetchNotifications(){
  fetch('/notifications_api.php')
    .then(r=>r.json())
    .then(data=>{
      renderIncoming(data.incoming_invites || []);
      renderOutgoing(data.outgoing_invites || []);
    })
    .catch(err=>console.error('Notification fetch failed', err));
}

function renderIncoming(items){
  const parent = document.getElementById('incomingList');
  parent.innerHTML = '';
  if(!items.length){
    parent.innerHTML = '<div class="empty">No incoming invites.</div>';
    return;
  }
  items.forEach(inv=>{
    const row = document.createElement('div'); row.className='row';
    const left = document.createElement('div');
    left.innerHTML = `<div><b>${inv.from_username}</b> invited you to Lobby #${inv.lobby_id}</div>
                      <div class="meta">${fmt(inv.created_at)}</div>`;
    const right = document.createElement('div');
    const joinBtn = document.createElement('button');
    joinBtn.className='btn'; joinBtn.textContent='Join';
    joinBtn.onclick = ()=>acceptInvite(inv.id, inv.lobby_id, row, joinBtn);
    const declineBtn = document.createElement('button');
    declineBtn.className='btn'; declineBtn.textContent='Decline';
    declineBtn.onclick = ()=>declineInvite(inv.id, row);
    right.appendChild(joinBtn); right.appendChild(declineBtn);
    row.appendChild(left); row.appendChild(right);
    parent.appendChild(row);
  });
}

function renderOutgoing(items){
  const parent = document.getElementById('outgoingList');
  parent.innerHTML = '';
  if(!items.length){
    parent.innerHTML = '<div class="empty">You have not sent any invites.</div>';
    return;
  }
  items.forEach(inv=>{
    const row = document.createElement('div'); row.className='row';
    const status = inv.accepted ? 'Accepted ✅'
                 : inv.declined ? 'Declined ❌'
                 : 'Pending ⏳';
    row.innerHTML = `<div>
        <div>Invite to <b>${inv.to_username}</b> for Lobby #${inv.lobby_id}</div>
        <div class="meta">${fmt(inv.created_at)} — ${status}</div>
      </div>`;
    parent.appendChild(row);
  });
}

function acceptInvite(inviteId, lobbyId, row, btn){
  btn.disabled = true;
  fetch('/lobbies/accept_invite.php', {
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:'invite_id='+encodeURIComponent(inviteId)+'&ajax=1'
  })
  .then(r=>r.json())
  .then(resp=>{
    if(resp.success){
      try{ row.remove(); }catch(e){}
      // Redirect user into the lobby they accepted
      window.location.href = "my_lobby.php?lobby_id="+resp.lobby_id;
    } else {
      alert('Accept failed: '+(resp.error||'unknown'));
      btn.disabled=false;
    }
  })
  .catch(err=>{
    console.error(err);
    btn.disabled=false;
    alert('Error accepting invite');
  });
}

function declineInvite(inviteId, row){
  fetch('/lobbies/decline_invite.php', {
    method:'POST',
    headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:'invite_id='+encodeURIComponent(inviteId)
  })
  .then(r=>r.json())
  .then(resp=>{
    if(resp.success){ try{ row.remove(); }catch(e){} }
    else { alert('Decline failed: '+(resp.error||'unknown')); }
  })
  .catch(()=>alert('Error declining invite'));
}

setInterval(fetchNotifications, 5000);
fetchNotifications();
</script>
</body>
</html>
