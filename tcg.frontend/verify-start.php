<?php
// /var/www/html/tcg.frontend/verify-start.php
declare(strict_types=1);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
session_start();

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;
Dotenv::createImmutable('/home')->safeLoad();

if (!isset($_SESSION['user_id'])) { header('Location: /login.php'); exit; }
$userId = (int)$_SESSION['user_id'];

try {
  $host=$_ENV['TCG_DB_HOST']??'localhost';
  $db  =$_ENV['TCG_DB_NAME']??'tcg';
  $usr =$_ENV['TCG_DB_USER']??'';
  $pwd =$_ENV['TCG_DB_PASS']??'';
  $prt =(int)($_ENV['TCG_DB_PORT']??5432);
  $pdo = new PDO("pgsql:host=$host;port=$prt;dbname=$db", $usr, $pwd, [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
} catch (Throwable $e) {
  http_response_code(500); echo "Database error."; exit;
}

// Load gating + guardian email
$termsAcceptedAt = null;
$kycStatus='unverified'; $kycVerifiedAt=null; $kycProvider=null; $guardianEmail=null;

$ug = $pdo->prepare("SELECT terms_accepted_at, kyc_status, kyc_verified_at, kyc_provider, guardian_email FROM users WHERE id=:u LIMIT 1");
$ug->execute([':u'=>$userId]);
if ($row = $ug->fetch(PDO::FETCH_ASSOC)) {
  $termsAcceptedAt = $row['terms_accepted_at'] ?? null;
  $kycStatus       = $row['kyc_status'] ?? 'unverified';
  $kycVerifiedAt   = $row['kyc_verified_at'] ?? null;
  $kycProvider     = $row['kyc_provider'] ?? null;
  $guardianEmail   = $row['guardian_email'] ?? null;
}

// Sync session for other includes
$_SESSION['terms_accepted'] = !empty($termsAcceptedAt);
$_SESSION['kyc_status']     = $kycStatus;

$token    = $_GET['token'] ?? null;
$resent   = isset($_GET['resent']);
$error    = $_GET['error'] ?? null;
$masked   = $token ? (str_repeat('•', max(0, strlen($token)-6)) . substr($token, -6)) : null;

function h($s){ return htmlspecialchars((string)$s, ENT_QUOTES); }
function dt($s){ return $s ? h($s) : '—'; }

$hasAcceptedTerms = !empty($termsAcceptedAt);
$isKycVerified    = ($kycStatus === 'verified');
$isKycPending     = ($kycStatus === 'pending');
$isKycRejected    = ($kycStatus === 'rejected');

// CSP-friendly nonce for inline JS if you add a CSP header site-wide
$nonce = bin2hex(random_bytes(16));
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Account Verification — Animorphs</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body{font-family:system-ui,Arial,sans-serif;background:#f7f7fb;color:#222;margin:0;padding:2rem}
  h1{margin-top:0}
  .card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:1rem;max-width:820px;margin:0 auto 1rem}
  .msg{margin:1rem 0;padding:.8rem;border-radius:8px}
  .ok{background:#dcfce7;color:#14532d;border:1px solid #bbf7d0}
  .warn{background:#fff8db;color:#8a6d00;border:1px solid #ffec99}
  .err{background:#fee2e2;color:#991b1b;border:1px solid #fecaca}
  .grid{display:grid;gap:1rem}
  .btn{display:inline-block;padding:.7rem 1rem;border-radius:10px;text-decoration:none;color:#fff;background:#0b5ed7;margin-right:.5rem}
  .btn.alt{background:#0d9488}
  .btn.muted{background:#6b7280}
  .badge{display:inline-block;padding:4px 10px;border-radius:999px;font-size:12px}
  .badge-ok{background:#e7f7ee;color:#0a7a3b;border:1px solid #b6ebc7}
  .badge-warn{background:#fff8db;color:#8a6d00;border:1px solid #ffec99}
  .badge-err{background:#ffe6e6;color:#8a1f1f;border:1px solid #ffb3b3}
  input[type=email]{width:100%;padding:.7rem;border:1px solid #d1d5db;border-radius:10px}
  form.inline { display:inline-block; }
  small.mono{font-family:ui-monospace, SFMono-Regular, Menlo, monospace;color:#555}
  .hidden{display:none}
</style>
</head>
<body>
  <h1>Account Verification</h1>

  <div id="card-verified" class="card ok <?= $isKycVerified ? '' : 'hidden' ?>">
    <h2>✅ You’re verified</h2>
    <p>
      Terms: <span class="badge badge-ok">Accepted</span> <small class="mono"><?=dt($termsAcceptedAt)?></small>
      &nbsp;&nbsp;|&nbsp;&nbsp;
      Verification: <span class="badge badge-ok">Verified</span>
      <?php if($kycProvider): ?><small class="mono"> via <?=h($kycProvider)?></small><?php endif; ?>
      <?php if($kycVerifiedAt): ?>&nbsp;<small class="mono"><?=dt($kycVerifiedAt)?></small><?php endif; ?>
    </p>
    <p>You can now purchase the <strong>Full Game</strong> and <strong>Battle Pass</strong> in the <a href="/store.php">Store</a>.</p>
    <p><small>You’ll be redirected to the Store shortly…</small></p>
  </div>

  <div id="card-progress" class="card <?= $isKycVerified ? 'hidden' : '' ?>">
    <h2>We’re setting up your verification</h2>
    <?php if ($token): ?><p><small class="mono">Reference: <?=h($masked)?></small></p><?php endif; ?>

    <?php if ($isKycPending): ?>
      <div class="msg warn">
        <?php if ($guardianEmail): ?>
          We’ve asked KWS to contact <strong><?=h($guardianEmail)?></strong> with a verification link. Please ask them to check their inbox (and spam folder).
        <?php else: ?>
          We’ve asked KWS to contact your parent/guardian by email to complete verification.
        <?php endif; ?>
      </div>
    <?php elseif ($isKycRejected): ?>
      <div class="msg err">Your previous verification attempt was not approved. You can try again below or contact support.</div>
    <?php else: ?>
      <div class="msg warn">Verification hasn’t started yet. Complete the steps below.</div>
    <?php endif; ?>

    <?php if ($error === 'send_email'): ?>
      <div class="msg err">We couldn’t start the email with KWS. Please check the parent email address and try again.</div>
    <?php endif; ?>
    <?php if ($resent): ?>
      <div class="msg ok">We’ve asked KWS to send (or resend) the email. If it doesn’t arrive, confirm the address below and try again.</div>
    <?php endif; ?>

    <h3>Steps</h3>
    <ol>
      <li>
        Terms &amp; Privacy:
        <?php if ($hasAcceptedTerms): ?>
          <span class="badge badge-ok">Accepted</span> <small class="mono"><?=dt($termsAcceptedAt)?></small>
          <a class="btn muted" href="/terms" target="_blank">View Terms</a>
        <?php else: ?>
          <a class="btn" href="/accept_terms.php">I Accept Terms &amp; Privacy</a>
        <?php endif; ?>
      </li>
      <li style="margin-top:.5rem">
        Start / Continue Verification:
        <form class="inline" method="post" action="/kws/start.php">
          <input type="email" name="parent_email" placeholder="Parent/guardian email (if under 18; if you're 18+, enter your own email to verify)" value="<?=h($guardianEmail ?? '')?>" style="min-width:260px" required>
          <button class="btn alt" type="submit">Send / Resend Verification Email</button>
        </form>
        <a class="btn muted" href="/parent-support" target="_blank" style="margin-top:.4rem">Parent Support</a>
      </li>
    </ol>

    <p style="margin-top:1rem"><small>
      KWS sends the verification email to the parent/guardian and notifies our server via webhook once complete.
      This page will auto-update when that happens.
    </small></p>
    <p><a class="btn" href="/store.php">Back to Store</a></p>
  </div>

  <div class="card">
    <h3>What does verification unlock?</h3>
    <ul>
      <li>Purchase the <strong>Full Game</strong> to enable play-to-earn rewards (e.g., referrals).</li>
      <li>Purchase the <strong>Battle Pass</strong> to join the LBP prize pool competitions.</li>
    </ul>
    <p><small>If you’re under 18, a verified parent/guardian must approve your account first.</small></p>
  </div>

  <script nonce="<?= $nonce ?>">
  (function(){
    const elVerified = document.getElementById('card-verified');
    const elProgress = document.getElementById('card-progress');

    let delay = 7000;      // 7s initial
    const maxDelay = 30000; // cap at 30s
    let redirectTimer = null;

    async function poll(){
      try {
        const res = await fetch('/api/me/kyc-status.php', {credentials:'same-origin', headers:{'Accept':'application/json'}});
        if(!res.ok){ throw new Error('HTTP '+res.status); }
        const j = await res.json();
        if(!j.ok){ throw new Error('Bad payload'); }

        const termsOk = !!j.termsAccepted;
        const status  = (j.kyc && j.kyc.status) ? j.kyc.status : 'unverified';

        if (termsOk && status === 'verified') {
          // Flip UI
          elProgress.classList.add('hidden');
          elVerified.classList.remove('hidden');
          // Redirect after short pause (so user sees success)
          if (!redirectTimer) {
            redirectTimer = setTimeout(()=>{ window.location.href = '/store.php?verified=1'; }, 2500);
          }
          return; // stop polling; webhook has done its job
        }

        // If rejected, keep polling (user might retry) but slow down a bit
        if (status === 'rejected' || status === 'pending' || status === 'unverified') {
          setTimeout(poll, delay);
          // gentle backoff up to maxDelay
          delay = Math.min(maxDelay, Math.floor(delay * 1.25));
        }
      } catch (e) {
        // Network or parse error — retry with backoff
        setTimeout(poll, delay);
        delay = Math.min(maxDelay, Math.floor(delay * 1.5));
      }
    }

    // Start after a brief moment to let first render settle
    setTimeout(poll, 1200);
  })();
  </script>
</body>
</html>
