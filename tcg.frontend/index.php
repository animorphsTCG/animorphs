<?php
// /var/www/html/tcg.frontend/index.php
ini_set('display_errors', 0);           // production-safe: don't echo PHP notices
error_reporting(E_ALL);
session_start();

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable('/home');
$dotenv->safeLoad();

$host = $_ENV['TCG_DB_HOST'] ?? 'localhost';
$db   = $_ENV['TCG_DB_NAME'] ?? '';
$user = $_ENV['TCG_DB_USER'] ?? '';
$pass = $_ENV['TCG_DB_PASS'] ?? '';
$port = $_ENV['TCG_DB_PORT'] ?? 5432;

try {
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$db", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    $stmt = $pdo->query("SELECT * FROM animorph_cards ORDER BY token_id ASC");
    $cards = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    // Fail quietly in production
    http_response_code(500);
    $cards = [];
}

$isLoggedIn = isset($_SESSION['user_id']);
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Animorphs TCG — Home</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    :root {
      --bg:#0b0f1a;
      --bg2:#12192b;
      --card:#0f1525;
      --ink:#e8eefc;
      --muted:#a8b3d1;
      --accent:#7c5cff;
      --accent-2:#22c55e;
      --accent-3:#38bdf8;
      --warn:#f59e0b;
      --shadow:0 10px 30px rgba(0,0,0,.35);
      --radius:14px;
      --pad:20px;
      --maxw:1400px;
    }
    * { box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji";
      color: var(--ink);
      background:
        radial-gradient(1200px 600px at 10% -10%, #1a2452 0%, transparent 60%),
        radial-gradient(1200px 600px at 110% 10%, #103a4a 0%, transparent 60%),
        linear-gradient(180deg, var(--bg), var(--bg2));
      padding: 0; margin: 0;
    }

    /* Top nav */
    .nav-wrap {
      max-width: var(--maxw);
      margin: 0 auto;
      padding: 14px var(--pad);
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
    }
    .brand {
      display: flex; align-items: center; gap: 12px; text-decoration: none; color: var(--ink);
    }
    .brand-logo {
      width: 40px; height: 40px; border-radius: 10px;
      background: linear-gradient(135deg, var(--accent), var(--accent-3));
      box-shadow: var(--shadow);
    }
    .brand h1 { font-size: 20px; margin: 0; letter-spacing: .5px; }

    .nav-bar { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; }
    .nav-bar a button {
      padding: 10px 14px; font-size: 14px; border-radius: 10px;
      border: 1px solid rgba(255,255,255,.08); cursor: pointer;
      background: #1b2340; color: var(--ink);
      box-shadow: var(--shadow);
    }
    .btn-demo { background: #1c3a5a; }
    .btn-login { background: #24406b; }
    .btn-register { background: #3a2d6a; }
    .btn-1vai { background: #2b266d; }
    .btn-profile { background: #1d5044; }
    .btn-leaderboards { background: #3b2a21; }
    .btn-friends { background: #223246; }
    .btn-logout { background: #6b1f28; }

    /* Hero */
    .hero {
      max-width: var(--maxw);
      margin: 12px auto 28px;
      padding: 24px var(--pad) 0;
    }
    .hero-card {
      display: grid; grid-template-columns: 1.2fr .8fr; gap: 24px;
      background: rgba(15,21,37,.7);
      border: 1px solid rgba(255,255,255,.06);
      border-radius: 20px; box-shadow: var(--shadow);
      overflow: hidden;
    }
    @media (max-width: 900px) { .hero-card { grid-template-columns: 1fr; } }
    .hero-left { padding: 28px; }
    .eyebrow {
      display:inline-block; padding: 6px 10px; font-size:12px; letter-spacing:.4px;
      background: rgba(124,92,255,.15); color: #cfc7ff; border: 1px solid rgba(124,92,255,.35);
      border-radius: 999px; margin-bottom: 12px;
    }
    .hero h2 { margin: 0 0 10px; font-size: 28px; }
    .hero p { margin: 6px 0 14px; color: var(--muted); line-height: 1.55; }

    .cta-row { display:flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
    .cta {
      display:inline-flex; align-items:center; gap:8px;
      padding: 12px 16px; font-size: 15px; border-radius: 12px;
      text-decoration:none; color:#081018; font-weight:600;
      background: linear-gradient(135deg, var(--accent), #9b8cff);
      border: none;
    }
    .cta.secondary {
      background: linear-gradient(135deg, var(--accent-3), #90e0ff);
    }
    .cta.ghost {
      background: transparent; color: var(--ink); border:1px solid rgba(255,255,255,.15);
    }

    .hero-right {
      background:
        radial-gradient(600px 300px at 30% 20%, rgba(124,92,255,.25), transparent 60%),
        radial-gradient(600px 300px at 80% 80%, rgba(56,189,248,.25), transparent 60%);
      padding: 22px;
      display: grid; place-items: center;
    }
    .hero-preview {
      width: 100%; max-width: 460px; aspect-ratio: 16 / 10;
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,.08);
      background: url('card-back.png') center/cover no-repeat, #0c1327;
      box-shadow: var(--shadow);
      position: relative; overflow: hidden;
    }
    .preview-badge {
      position: absolute; top: 10px; left: 10px;
      background: rgba(0,0,0,.5); padding: 6px 10px; border-radius: 999px; font-size: 12px; color: #dbeafe;
      border: 1px solid rgba(255,255,255,.15);
    }

    /* Sections */
    .section {
      max-width: var(--maxw);
      margin: 0 auto 22px;
      padding: 0 var(--pad);
    }
    .section h3 { margin: 14px 0 10px; font-size: 20px; }

    .features {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
    }
    @media (max-width: 900px) { .features { grid-template-columns: 1fr; } }
    .feat {
      background: var(--card); border: 1px solid rgba(255,255,255,.06);
      padding: 16px; border-radius: var(--radius); box-shadow: var(--shadow);
    }
    .feat h4 { margin: 0 0 8px; font-size: 16px; }
    .feat p { margin: 0; color: var(--muted); }

    /* Page grid: cards + sidebar widget */
    .home-grid {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 20px;
      align-items: start;
      max-width: var(--maxw);
      margin: 0 auto 40px;
      padding: 0 var(--pad);
    }
    @media (max-width: 1100px) {
      .home-grid { grid-template-columns: 1fr; }
    }

    /* Cards area */
    .panel {
      background: var(--card);
      border: 1px solid rgba(255,255,255,.06);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 16px;
    }
    .panel h2 { margin: 0 0 10px; font-size: 18px; }
    .toggle-button {
      padding: 10px 16px; font-size: 14px;
      background: #2a2558; color: #e9e5ff; border: 1px solid rgba(255,255,255,.12); border-radius: 10px; cursor: pointer;
      box-shadow: var(--shadow);
    }
    .toggle-button:hover { opacity: .95; }
    .card-grid {
      display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; margin-top: 16px;
    }
    .card {
      background: #0c1327; border: 1px solid rgba(255,255,255,.08);
      border-radius: var(--radius); box-shadow: var(--shadow);
      width: 220px; padding: 10px; text-align: center;
    }
    .card img { width: 100%; border-radius: 10px; display:block; }
    .stats { font-size: 13px; margin-top: 10px; color: var(--muted); }
    .stats strong { color: var(--ink); }

    /* Sidebar widget shell (the included file provides its own inner styles/table) */
    .sidebar-widget {
      background: var(--card);
      border: 1px solid rgba(255,255,255,.06);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 12px;
      overflow: hidden;
    }

    /* How it works */
    .how {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
    }
    @media (max-width: 900px) { .how { grid-template-columns: 1fr; } }
    .step {
      background: var(--card); border: 1px solid rgba(255,255,255,.06);
      padding: 16px; border-radius: var(--radius);
    }
    .step b { color: #dbeafe; }

    /* Footer */
    footer {
      border-top: 1px solid rgba(255,255,255,.06);
      color: var(--muted);
      max-width: var(--maxw);
      margin: 18px auto 40px;
      padding: 16px var(--pad) 0;
      font-size: 12px;
    }
  </style>
  <script>
    function toggleCards() {
      const container = document.getElementById("cardsContainer");
      container.style.display = (container.style.display === "none" || !container.style.display) ? "flex" : "none";
    }
  </script>
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

  <!-- Top Navigation -->
  <div class="nav-wrap">
    <a class="brand" href="index.php">
      <div class="brand-logo" aria-hidden="true"></div>
      <h1>Animorphs TCG</h1>
    </a>
    <div class="nav-bar">
      <?php if (!$isLoggedIn): ?>
        <a href="demo.html"><button class="btn-demo">Play Demo</button></a>
        <a href="login.html"><button class="btn-login">Login</button></a>
        <a href="register.html"><button class="btn-register">Register</button></a>
      <?php else: ?>
        <a href="1vai.php"><button class="btn-1vai">1vAI</button></a>
        <a href="profile.php"><button class="btn-profile">Profile</button></a>
        <a href="leaderboards.php"><button class="btn-leaderboards">Leaderboards</button></a>
        <a href="friends.php"><button class="btn-friends">Friends</button></a>
        <a href="logout.php"><button class="btn-logout">Logout</button></a>
      <?php endif; ?>
    </div>
  </div>

  <!-- HERO -->
  <section class="hero">
    <div class="hero-card">
      <div class="hero-left">
        <span class="eyebrow">Competitive Creature Battler</span>
        <h2>Build your deck, battle the AI, and climb the Leaderboards.</h2>
        <p>
          Animorphs is a web TCG where elemental creatures clash using Power, Health, Attack, Size, and Sats.
          New players start strong: <b>claim your 10 free cards</b>, jump into <b>1vAI</b>,
          and <b>earn AI Points</b> with every win to rise on the global rankings.
        </p>

        <div class="cta-row">
          <?php if ($isLoggedIn): ?>
            <a class="cta" href="select_free_cards.html">Claim your 10 Free Cards</a>
            <a class="cta secondary" href="1vai.php">Play 1vAI Now</a>
            <a class="cta ghost" href="leaderboards.php">View Leaderboards</a>
          <?php else: ?>
            <a class="cta" href="register.html">Create Account — Get 10 Free Cards</a>
            <a class="cta secondary" href="demo.html">Try the Demo</a>
            <a class="cta ghost" href="login.html">Already have an account? Login</a>
          <?php endif; ?>
        </div>
      </div>
      <div class="hero-right">
        <div class="hero-preview">
          <div class="preview-badge">1vAI Available • More Modes Coming</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Features -->
  <section class="section">
    <div class="features">
      <div class="feat">
        <h4>? Start with 10 Free Cards</h4>
        <p>Every new player can hand?pick <b>ten</b> Animorphs to kickstart their collection. Log in and claim yours on the selection page.</p>
      </div>
      <div class="feat">
        <h4>? Earn AI Points</h4>
        <p>Win 1vAI matches to collect <b>AI Points</b> and push your name up the <b>Leaderboards</b>. The widget on the right shows current top players.</p>
      </div>
      <div class="feat">
        <h4>?? Play Now — 1vAI</h4>
        <p>Queue into fast matches against the AI. Choose the stat on your turn, outplay the AI, and chain victories to climb.</p>
      </div>
    </div>
  </section>

  <!-- How it works -->
  <section class="section">
    <h3>How it works</h3>
    <div class="how">
      <div class="step">
        <b>1) Create account & claim 10 free cards</b><br>
        Register, log in, then visit <i>Claim Free Cards</i> to lock in your starting deck.
      </div>
      <div class="step">
        <b>2) Play 1vAI matches</b><br>
        Each player (you vs AI) uses 10 cards. A stat is chosen each round; higher value wins the round.
      </div>
      <div class="step">
        <b>3) Earn AI Points & climb</b><br>
        Victories award AI Points. Check your progress on the <i>Leaderboards</i> and try to hit the top!
      </div>
    </div>
  </section>

  <!-- Roadmap note -->
  <section class="section">
    <div class="feat">
      <h4>?? Roadmap</h4>
      <p>
        1vAI is live today. We’re actively building additional modes (ranked, events, and social features). 
        For now, sharpen your skills vs the AI and secure your leaderboard position.
      </p>
    </div>
  </section>

  <!-- Cards + Leaderboard widget -->
  <div class="home-grid">
    <!-- Left: Cards browser -->
    <div class="panel">
      <h2>All Animorph Cards</h2>
      <button class="toggle-button" onclick="toggleCards()">Show / Hide</button>
      <div id="cardsContainer" class="card-grid" style="display:none;">
        <?php foreach ($cards as $card): ?>
          <div class="card">
            <img src="image.php?file=<?= urlencode($card['card_image']) ?>" alt="<?= htmlspecialchars($card['display_name']) ?>">
            <div class="stats">
              <strong><?= htmlspecialchars($card['display_name']) ?></strong><br>
              Type: <?= htmlspecialchars($card['animorph_type']) ?><br>
              Power: <?= (int)$card['power_rating'] ?><br>
              Health: <?= (int)$card['health'] ?><br>
              Attack: <?= (int)$card['attack'] ?><br>
              Sats: <?= (int)$card['sats'] ?><br>
              Size: <?= (int)$card['size'] ?>
            </div>
          </div>
        <?php endforeach; ?>
        <?php if (empty($cards)): ?>
          <p style="color:var(--muted)">Cards are unavailable right now. Please try again later.</p>
        <?php endif; ?>
      </div>
    </div>

    <!-- Right: AI leaderboard widget (DON'T place this include inside <style>) -->
    <aside class="sidebar-widget">
      <?php include '/var/www/tcg.backend/ai_leaderboard_widget.php'; ?>
    </aside>
  </div>

  <footer>
    © <?= date('Y') ?> Animorphs TCG • ERC?1155 NFTs • MythicMasters
  </footer>

</body>
</html>
