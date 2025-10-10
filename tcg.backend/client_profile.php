<?php
// /var/www/html/tcg.frontend/client_profile.php

ini_set('display_errors', 0);
error_reporting(0);
session_start();

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;
Dotenv::createImmutable('/home')->safeLoad();

$host = $_ENV['TCG_DB_HOST'] ?? 'localhost';
$db   = $_ENV['TCG_DB_NAME'] ?? 'tcg';
$user = $_ENV['TCG_DB_USER'] ?? '';
$pass = $_ENV['TCG_DB_PASS'] ?? '';
$port = (int) ($_ENV['TCG_DB_PORT'] ?? 5432);

$dsn = "pgsql:host={$host};port={$port};dbname={$db}";
try {
    $pdo = new PDO($dsn, $user, $pass, [ PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo "<pre style='color:red'>DB Error: ".htmlspecialchars($e->getMessage())."</pre>";
    exit;
}

$uid = $_SESSION['user_id'] ?? null;
if (!$uid) {
    header("Location: /login.php");
    exit;
}

// Load from users + user_info
$stmt = $pdo->prepare("
  SELECT u.email, u.username, u.id_number AS u_id_number, u.guardian_consent, u.guardian_email,
         r.code AS referral_code,
         e1.expires_at AS bp_expires,
         i.first_name, i.last_name, i.age, i.country, i.timezone, i.gender,
         i.eta_online, i.favorite_animorph
  FROM users u
  LEFT JOIN referral_links r ON r.referrer_user_id = u.id
  LEFT JOIN entitlements e1 ON e1.user_id = u.id AND e1.type = 'battle_pass'
  LEFT JOIN user_info i ON i.user_id = u.id
  WHERE u.id = :uid
  LIMIT 1
");
$stmt->execute([':uid' => $uid]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Full Game status
$hasFull = (bool)$pdo->query("SELECT 1 FROM entitlements WHERE user_id = $uid AND type = 'full_unlock' LIMIT 1")->fetchColumn();

// Referral stats — corrected
$myCode = $user['referral_code'] ?? null;
$refCount = 0;
if ($myCode) {
    $refCountStmt = $pdo->prepare("SELECT COUNT(*) FROM referrals WHERE code = :c");
    $refCountStmt->execute([':c' => $myCode]);
    $refCount = (int)$refCountStmt->fetchColumn();
}

$earnStmt = $pdo->prepare("SELECT COALESCE(SUM(amount_digi),0) FROM referral_earnings WHERE referrer_user_id = :u");
$earnStmt->execute([':u' => $uid]);
$earnings = (int)$earnStmt->fetchColumn();

function h($s){ return htmlspecialchars((string)$s); }
function days_left($expires){
    if (!$expires) return null;
    $now = new DateTimeImmutable('now');
    $exp = new DateTimeImmutable($expires);
    $diff = $exp->diff($now)->format('%r%a');
    return (int)$diff < 0 ? 0 : (int)$diff;
}
$daysLeft = $user['bp_expires'] ? days_left($user['bp_expires']) : null;
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Client Profile — Animorphs TCG</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { background: #0b1022; color: #fff; font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    h1 { font-size: 24px; }
    .card { background: #151d43; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 0 10px rgba(0,0,0,.3); }
    label { display: block; margin-top: 10px; font-weight: bold; }
    input, select { width: 100%; padding: 8px; margin-top: 4px; border-radius: 6px; border: none; }
    .submit-btn { margin-top: 16px; background: #28a745; color: #fff; border: none; padding: 10px 16px; border-radius: 10px; cursor: pointer; font-weight: bold; }
    .submit-btn:disabled { background: #888; cursor: not-allowed; }
    .status { margin: 10px 0; font-size: 14px; color: #ffd966; }
    .note { font-size: 13px; color: #ccc; }
    .nav a { color: #8ab4ff; margin-right: 12px; text-decoration: none; }
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
  <div class="nav">
    <a href="/index.php">Home</a>
    <a href="/store.php">Store</a>
    <a href="/profile.php">Profile</a>
  </div>

  <h1>Client Profile</h1>
  
  <?php if (isset($_GET['updated'])): ?>
  <div style="padding:10px; background:#16321e; border-left:4px solid #2ea44f; margin-bottom:16px; border-radius:8px;">
    ✅ Profile updated successfully.
  </div>
<?php elseif (isset($_GET['error'])): ?>
  <div style="padding:10px; background:#3a1b1b; border-left:4px solid #d05050; margin-bottom:16px; border-radius:8px;">
    ⚠️ <?= htmlspecialchars($_GET['error']) ?>
  </div>
<?php endif; ?>

  <div class="card">
    <h2>Account Summary</h2>
    <p><strong>Username:</strong> <?= h($user['username']) ?></p>
    <p><strong>Email:</strong> <?= h($user['email']) ?></p>
    <p><strong>Full Game Access:</strong> <?= $hasFull ? '✅ Yes' : '❌ No' ?></p>
    <p><strong>Battle Pass:</strong> <?= $daysLeft ? "✅ {$daysLeft} days left" : '❌ None' ?></p>
  </div>

  <div class="card">
    <h2>Personal Information</h2>
    <form method="POST" action="/client_profile_submit.php">
      <label>First Name</label>
      <input type="text" name="first_name" maxlength="50" value="<?= h($user['first_name']) ?>" required>

      <label>Last Name</label>
      <input type="text" name="last_name" maxlength="50" value="<?= h($user['last_name']) ?>" required>

      <label>Age</label>
      <input type="number" name="age" min="5" max="120" value="<?= h($user['age']) ?>" required>

      <label>Country</label>
      <input type="text" name="country" maxlength="56" value="<?= h($user['country'] ?: 'South Africa') ?>">

      <label>Timezone</label>
      <select name="timezone">
        <option value="GMT+2" <?= ($user['timezone'] === 'GMT+2') ? 'selected' : '' ?>>GMT+2 (South Africa)</option>
        <option value="GMT+1">GMT+1</option>
        <option value="GMT+3">GMT+3</option>
      </select>

      <label>Gender</label>
      <select name="gender">
        <option value="">--Select--</option>
        <option value="Male" <?= ($user['gender']==='Male'?'selected':'') ?>>Male</option>
        <option value="Female" <?= ($user['gender']==='Female'?'selected':'') ?>>Female</option>
        <option value="Other" <?= ($user['gender']==='Other'?'selected':'') ?>>Other</option>
      </select>

      <label>Likely Online Times</label>
      <input type="text" name="eta_online" maxlength="64" value="<?= h($user['eta_online']) ?>">

      <label>Favourite Animorph</label>
      <input type="text" name="favorite_animorph" maxlength="50" value="<?= h($user['favorite_animorph']) ?>">

      <button type="submit" class="submit-btn">Save Profile</button>
    </form>
  </div>

  <div class="card">
    <h2>Age Verification</h2>
    <?php if (!empty($user['u_id_number']) || $user['guardian_consent']): ?>
      <p class="status">✅ Age verification completed.</p>
    <?php else: ?>
      <form method="POST" action="/client_profile_submit.php">
        <label for="id_number">South African ID / Passport Number:</label>
        <input type="text" name="id_number" maxlength="64" required />
        <button type="submit" class="submit-btn">Submit ID</button>
      </form>
      <p style="margin-top:16px;">OR</p>
      <a href="/guardian_consent.php" class="submit-btn" style="background:#0077cc;">Submit Guardian Consent</a>
    <?php endif; ?>
  </div>

  <div class="card">
    <h2>Referral Program</h2>
    <?php if (!empty($myCode)): ?>
      <p><strong>Your Referral Code:</strong> <code><?= h($myCode) ?></code></p>
      <p><strong>Referrals:</strong> <?= $refCount ?> user(s)</p>
      <p><strong>Total Earnings:</strong> <?= $earnings ?> Digi</p>
    <?php else: ?>
      <form method="POST" action="/client_profile_submit.php" id="referralForm">
        <label>Create a Custom Referral Code (3–8 letters/numbers):</label>
        <input type="text" name="referral_code" id="referral_code" minlength="3" maxlength="8" pattern="[A-Za-z0-9]+" required>
        <div id="referral_msg" style="margin-top:6px;font-size:13px;"></div>
        <button type="submit" class="submit-btn" id="referral_btn" disabled>Register Code</button>
      </form>

      <script>
        const codeInput = document.getElementById('referral_code');
        const msg = document.getElementById('referral_msg');
        const btn = document.getElementById('referral_btn');

        codeInput.addEventListener('input', async () => {
          const val = codeInput.value.trim();
          if (val.length < 3 || val.length > 8 || !/^[A-Za-z0-9]+$/.test(val)) {
            msg.textContent = "❌ Code must be 3–8 letters/numbers.";
            msg.style.color = "red";
            codeInput.style.border = "2px solid red";
            btn.disabled = true;
            return;
          }

          try {
            const res = await fetch('/ajax/check_referral_code.php?code=' + encodeURIComponent(val));
            const data = await res.json();
            if (data.taken) {
              msg.textContent = "❌ Code already taken.";
              msg.style.color = "red";
              codeInput.style.border = "2px solid red";
              btn.disabled = true;
            } else {
              msg.textContent = "✅ Code available.";
              msg.style.color = "lightgreen";
              codeInput.style.border = "2px solid green";
              btn.disabled = false;
            }
          } catch (e) {
            msg.textContent = "⚠️ Error checking code.";
            msg.style.color = "orange";
            btn.disabled = true;
          }
        });
      </script>
    <?php endif; ?>
  </div>

</body>
</html>
