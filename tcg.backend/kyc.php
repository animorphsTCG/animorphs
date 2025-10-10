<?php
// /var/www/tcg.backend/kyc.php
// KYC hub: Terms acceptance, KWS verification status, optional profile update

declare(strict_types=1);
ini_set('display_errors', 0);
error_reporting(0);
session_start();

require_once '/var/www/vendor/autoload.php';
Dotenv\Dotenv::createImmutable('/home')->safeLoad();

if (!isset($_SESSION['user_id'])) { header('Location: /login.php'); exit; }
$userId = (int)$_SESSION['user_id'];

// ---- Connect Postgres ----
try {
    $pdo = new PDO(
        sprintf(
            "pgsql:host=%s;port=%d;dbname=%s",
            $_ENV['TCG_DB_HOST'] ?? 'localhost',
            (int)($_ENV['TCG_DB_PORT'] ?? 5432),
            $_ENV['TCG_DB_NAME'] ?? 'tcg'
        ),
        $_ENV['TCG_DB_USER'] ?? '',
        $_ENV['TCG_DB_PASS'] ?? '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (Throwable $e) {
    http_response_code(500); echo "Database error."; exit;
}

// ---- Load gating state ----
$ug = $pdo->prepare("SELECT terms_accepted_at, kyc_status, kyc_verified_at, kyc_provider, guardian_email 
                       FROM users WHERE id=:u LIMIT 1");
$ug->execute([':u'=>$userId]);
$row = $ug->fetch(PDO::FETCH_ASSOC) ?: [];

$termsAcceptedAt = $row['terms_accepted_at'] ?? null;
$kycStatus       = $row['kyc_status'] ?? 'unverified';
$kycVerifiedAt   = $row['kyc_verified_at'] ?? null;
$kycProvider     = $row['kyc_provider'] ?? null;
$guardianEmail   = $row['guardian_email'] ?? null;

$_SESSION['terms_accepted'] = !empty($termsAcceptedAt);
$_SESSION['kyc_status']     = $kycStatus;

$hasAcceptedTerms = !empty($termsAcceptedAt);
$isKycVerified    = ($kycStatus === 'verified');
$isKycPending     = ($kycStatus === 'pending');
$isKycRejected    = ($kycStatus === 'rejected');

// helpers
function esc($s){return htmlspecialchars((string)$s, ENT_QUOTES);}
function dt($s){ return $s ? esc($s) : '—'; }
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Account Verification (KYC)</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
body{font-family:system-ui,Arial,sans-serif;background:#f7f7fb;color:#222;margin:0;padding:2rem}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:1rem;max-width:820px;margin-bottom:1rem}
.badge{padding:3px 8px;border-radius:999px;font-size:12px}
.badge-ok{background:#e7f7ee;color:#0a7a3b}
.badge-warn{background:#fff8db;color:#8a6d00}
.badge-err{background:#ffe6e6;color:#8a1f1f}
.btn{display:inline-block;padding:.6rem 1rem;border-radius:8px;text-decoration:none;color:#fff;background:#0b5ed7;margin-top:.5rem}
.btn.alt{background:#0d9488}
.btn.muted{background:#6b7280}
</style>
</head>
<body>
<h1>Account Verification</h1>

<div class="card">
  <h2>Status</h2>
  <p>
    Terms: <?= $hasAcceptedTerms ? '<span class="badge badge-ok">Accepted</span> <small>'.dt($termsAcceptedAt).'</small>' : '<span class="badge badge-warn">Not accepted</span>' ?>
    &nbsp;|&nbsp;
    Verification:
    <?php if ($isKycVerified): ?>
      <span class="badge badge-ok">Verified</span>
      <?php if($kycProvider): ?><small>via <?=esc($kycProvider)?></small><?php endif; ?>
      <?php if($kycVerifiedAt): ?><small><?=dt($kycVerifiedAt)?></small><?php endif; ?>
    <?php elseif ($isKycPending): ?>
      <span class="badge badge-warn">Pending</span>
    <?php elseif ($isKycRejected): ?>
      <span class="badge badge-err">Rejected</span>
    <?php else: ?>
      <span class="badge badge-warn">Not started</span>
    <?php endif; ?>
  </p>

  <?php if (!$isKycVerified): ?>
    <p><strong>Parent / Guardian Email:</strong> <?= $guardianEmail ? esc($guardianEmail) : '—' ?></p>
    <a class="btn" href="/kws/start_kws.php">Start / Continue Verification</a>
    <a class="btn muted" href="/terms" target="_blank">View Terms</a>
    <a class="btn muted" href="/parent-support" target="_blank">Parent Support</a>
  <?php else: ?>
    <p>All set! You can now purchase the Full Game and Battle Pass in the <a href="/store.php">Store</a>.</p>
  <?php endif; ?>
</div>
</body>
</html>
