<?php
// /var/www/tcg.backend/messages.php
// WhatsApp-style messaging UI with friend selector + robust AJAX (multi-path fallback).

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
session_start();

if (!isset($_SESSION['user_id'])) {
    header("Location: /login.php");
    exit;
}

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;
Dotenv::createImmutable('/home')->safeLoad();

$host = $_ENV['TCG_DB_HOST'] ?? 'localhost';
$db   = $_ENV['TCG_DB_NAME'] ?? 'tcg';
$user = $_ENV['TCG_DB_USER'] ?? '';
$pass = $_ENV['TCG_DB_PASS'] ?? '';
$port = (int)($_ENV['TCG_DB_PORT'] ?? 5432);
$dsn  = "pgsql:host={$host};port={$port};dbname={$db}";

try {
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (Throwable $e) {
    http_response_code(500);
    echo "DB connection failed.";
    exit;
}

$uid = (int)$_SESSION['user_id'];
$fid = isset($_GET['friend_id']) ? (int)$_GET['friend_id'] : 0;

/** Friends list for selector (accepted, deduped both directions) */
$sql = "
WITH friend_ids AS (
  SELECT CASE WHEN f.user_id = :uid THEN f.friend_user_id ELSE f.user_id END AS fid
  FROM friends f
  WHERE (f.user_id = :uid OR f.friend_user_id = :uid)
    AND f.status = 'accepted'
)
SELECT u.id, u.username
FROM friend_ids fi
JOIN users u ON u.id = fi.fid
ORDER BY u.username ASC
";
$stmt = $pdo->prepare($sql);
$stmt->execute([':uid' => $uid]);
$friends = $stmt->fetchAll(PDO::FETCH_ASSOC);

/** Default chat target: first friend (if none selected) */
if ($fid === 0 && $friends) {
    $fid = (int)$friends[0]['id'];
}

/** If a friend is chosen, load their username (display only) */
$friendName = null;
if ($fid > 0) {
    $nq = $pdo->prepare("SELECT username FROM users WHERE id=:id");
    $nq->execute([':id'=>$fid]);
    $friendName = $nq->fetchColumn() ?: null;
}

function h($s){ return htmlspecialchars((string)$s, ENT_QUOTES); }
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Messages — Animorphs TCG</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  :root{
    --bg:#0b1022; --panel:#151d43; --line:#243079; --ink:#fff; --muted:#cbd6ff;
    --accent:#28a745; --accent2:#0077cc; --chip:#0f1630; --errbg:#3a1b1b; --errline:#d05050;
  }
  *{box-sizing:border-box}
  body { margin:0; font-family: Arial, sans-serif; background:var(--bg); color:var(--ink); display:flex; height:100vh; }
  .sidebar { width:280px; background:#11183a; display:flex; flex-direction:column; border-right:1px solid var(--line); }
  .sidebar h2 { padding:16px; margin:0; font-size:18px; border-bottom:1px solid var(--line); }
  .friend-list { flex:1; overflow-y:auto; }
  .friend { padding:12px 16px; cursor:pointer; border-bottom:1px solid var(--line); }
  .friend:hover { background:#1b2555; }
  .friend.active { background:#243079; }
  .chat { flex:1; display:flex; flex-direction:column; }
  header { background:var(--panel); padding:10px 12px; border-bottom:1px solid var(--line); display:flex; align-items:center; justify-content:space-between; }
  header .title{font-weight:700}
  nav a { color:#8ab4ff; margin-left:12px; text-decoration:none; }

  .banner { margin:10px; padding:10px; border-radius:8px; }
  .err { background:var(--errbg); border-left:4px solid var(--errline); }

  #chat-box { flex:1; background:var(--chip); padding:12px; overflow-y:auto; }
  .msg { margin:6px 0; padding:8px 10px; border-radius:8px; max-width:75%; display:inline-block; }
  .me { background:#2a6f2a; color:#fff; align-self:flex-end; }
  .them { background:#444; color:#fff; }
  .meta { display:block; font-size:11px; color:#eee; opacity:.8; margin-top:4px; }
  .empty { color:var(--muted); text-align:center; margin-top:24px; }

  #msg-form { display:flex; padding:10px; border-top:1px solid var(--line); background:var(--panel); }
  #msg-form input { flex:1; padding:10px; border-radius:8px; border:none; }
  #msg-form button { margin-left:8px; padding:10px 16px; background:var(--accent); color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer; }
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
  <div class="sidebar">
    <h2>Friends</h2>
    <div class="friend-list">
      <?php if ($friends): ?>
        <?php foreach ($friends as $f): ?>
          <div class="friend <?= ($fid == (int)$f['id'] ? 'active' : '') ?>">
            <a href="/messages.php?friend_id=<?= (int)$f['id'] ?>" style="color:#fff;text-decoration:none;display:block;">
              <?= h($f['username']) ?>
            </a>
          </div>
        <?php endforeach; ?>
      <?php else: ?>
        <div class="friend">No friends yet</div>
      <?php endif; ?>
    </div>
  </div>

  <div class="chat">
    <header>
      <div class="title">
        <?php if ($friendName): ?>
          Chat with <?= h($friendName) ?>
        <?php else: ?>
          Messages
        <?php endif; ?>
      </div>
      <nav>
        <a href="/index.php">Home</a>
        <a href="/friends.php">Friends</a>
        <a href="/profile.php">Profile</a>
      </nav>
    </header>

    <div id="error-box" class="banner err" style="display:none;"></div>

    <?php if ($friendName): ?>
      <div id="chat-box"></div>
      <form id="msg-form" autocomplete="off">
        <input type="text" id="msg-input" placeholder="Type a message..." required />
        <button type="submit">Send</button>
      </form>
    <?php else: ?>
      <div class="empty">Select a friend from the left panel to start chatting.</div>
    <?php endif; ?>
  </div>

<?php if ($friendName): ?>
<script>
async function fetchWithFallback(paths, options = {}) {
  let lastErr = null;
  for (const url of paths) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const text = await res.text();
        lastErr = {status: res.status, body: text || '(no body)', url};
        continue;
      }
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
      const text = await res.text();
      try { return JSON.parse(text); } catch (_) { return text; }
    } catch (e) {
      lastErr = {status: -1, body: e.message, url};
      continue;
    }
  }
  throw lastErr || new Error('request failed');
}

const chatBox  = document.getElementById('chat-box');
const form     = document.getElementById('msg-form');
const input    = document.getElementById('msg-input');
const errorBox = document.getElementById('error-box');
const myUserId = <?= (int)$uid ?>;
const friendId = <?= (int)$fid ?>;

function showError(msg){
  if (!errorBox) return;
  errorBox.style.display = 'block';
  errorBox.textContent = msg;
}
function clearError(){
  if (!errorBox) return;
  errorBox.style.display = 'none';
  errorBox.textContent = '';
}
function fmt(ts){
  try { return new Date(ts || Date.now()).toLocaleString(); }
  catch(_) { return ts || ''; }
}

async function loadMessages(){
  clearError();
  const qs = '?friend_id=' + encodeURIComponent(friendId);
  try {
    const data = await fetchWithFallback([
      'get_messages.php' + qs,
      '/get_messages.php' + qs
    ]);
    chatBox.innerHTML = '';
    if (!data || (Array.isArray(data) && data.length === 0)) {
      const p = document.createElement('p');
      p.className = 'empty';
      p.textContent = 'No messages yet. Say hello!';
      chatBox.appendChild(p);
      return;
    }
    (Array.isArray(data) ? data : []).forEach(m => {
      const wrap = document.createElement('div');
      wrap.style.display = 'flex';
      wrap.style.flexDirection = 'column';
      wrap.style.alignItems = (m.sender_id == myUserId) ? 'flex-end' : 'flex-start';

      const bubble = document.createElement('div');
      bubble.className = 'msg ' + (m.sender_id == myUserId ? 'me' : 'them');
      bubble.textContent = m.content;

      const meta = document.createElement('span');
      meta.className = 'meta';
      meta.textContent = (m.sender_id == myUserId ? 'You' : (m.sender_name || 'Friend')) + ' • ' + fmt(m.sent_at);

      wrap.appendChild(bubble);
      wrap.appendChild(meta);
      chatBox.appendChild(wrap);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  } catch (e) {
    showError('HTTP ' + (e.status ?? 'ERR') + ' from ' + (e.url || 'request') + ' — ' + (e.body || ''));
  }
}

async function sendMessage(text){
  clearError();
  const body = new FormData();
  body.append('receiver_id', String(friendId));
  body.append('content', text);
  try {
    await fetchWithFallback([
      'send_message.php',
      '/send_message.php'
    ], { method:'POST', body });
    await loadMessages();
  } catch (e) {
    showError('HTTP ' + (e.status ?? 'ERR') + ' while sending — ' + (e.body || ''));
  }
}

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const text = (input.value || '').trim();
  if (!text) return;
  input.value = '';
  await sendMessage(text);
});

setInterval(loadMessages, 3000);
loadMessages();
</script>
<?php endif; ?>

</body>
</html>
