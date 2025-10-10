<?php
// show guidance + action buttons
$needsTerms = !($_SESSION['terms_accepted'] ?? false);
$needsKyc   = ($_SESSION['kyc_status'] ?? 'unverified') !== 'verified';
?>
<div class="notice">
  <h3>Age Verification &amp; Consent Required</h3>
  <p>To purchase paid products and earn rewards (referrals, prize pools), you must:</p>
  <ol>
    <li>Accept our <a href="/terms" target="_blank">Terms</a> and <a href="/privacy-policy" target="_blank">Privacy Policy</a></li>
    <li>Complete one-time age/consent verification (KWS)</li>
  </ol>
  <div class="actions">
    <?php if ($needsTerms): ?>
      <a class="btn" href="/accept_terms.php">I Accept Terms &amp; Privacy</a>
    <?php endif; ?>
    <?php if ($needsKyc): ?>
      <a class="btn" href="/kws/start.php">Start Verification</a>
    <?php endif; ?>
  </div>
</div>
