<?php
// /var/www/html/tcg.frontend/terms/index.php
declare(strict_types=1);
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('X-Frame-Options: SAMEORIGIN');

$siteName = 'Animorphs';
$brand    = 'Mythic Masters';
$domain   = 'tcg.mythicmasters.org.za';
$contact  = 'daniel@mythicmasters.org.za';
$effective  = '2025-08-17';
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Terms &amp; Conditions | <?php echo $siteName; ?></title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Terms and Conditions for Animorphs by Mythic Masters. Rules for gameplay, purchases, age verification (KWS/EOS), rewards, referrals, and NFTs.">
  <link rel="canonical" href="https://<?php echo $domain; ?>/terms">
</head>
<body>
<header>
  <h1>Terms &amp; Conditions</h1>
  <p><strong><?php echo $siteName; ?></strong> is operated by <strong><?php echo $brand; ?></strong> (“we”, “us”, “our”).</p>
  <p><strong>Effective:</strong> <?php echo htmlspecialchars($effective, ENT_QUOTES); ?></p>
  <nav>
    <a href="/">Home</a> ·
    <a href="/privacy-policy">Privacy Policy</a> ·
    <a href="/parent-support">Parent Support</a>
  </nav>
  <hr>
</header>

<main>
  <section id="acceptance">
    <h2>1. Acceptance of Terms</h2>
    <p>By creating an account or using <?php echo $siteName; ?>, you agree to these Terms and our Privacy Policy.</p>
  </section>

  <section id="eligibility">
    <h2>2. Eligibility, Age Verification &amp; Parental Consent</h2>
    <ul>
      <li>Players aged <strong>5–17</strong> may register and play free features.</li>
      <li>Features involving <strong>real-money rewards</strong> (including the <strong>Battle Pass</strong>) require either:
        <ol>
          <li>Verification that the player is <strong>18+</strong> (e.g., SA <code>id_number</code> or passport check), or</li>
          <li>Verified <strong>parent/guardian consent</strong> via SuperAwesome <strong>KWS</strong>.</li>
        </ol>
      </li>
      <li>We may also validate eligibility through trusted partners such as <strong>Epic Online Services (EOS)</strong> for age-gating signals.</li>
    </ul>
    <p><em>Using someone else’s ID information is strictly prohibited and is considered fraud.</em></p>
  </section>

  <section id="kyc">
    <h2>3. KYC / Identity Verification</h2>
    <p>To access restricted features, you agree to complete identity/age checks. We may collect your date of birth and national ID/passport number (<code>id_number</code>) for compliance, or request that a parent/guardian completes KWS consent. We reserve the right to deny or revoke access to restricted features if verification is incomplete, inaccurate, or suspected to be fraudulent.</p>
  </section>

  <section id="consequences">
    <h2>4. If You Don’t Verify Age or Consent</h2>
    <p>If you do not complete age verification (18+) or a parent/guardian does not provide consent (for players under 18), the account will be restricted to free, age-appropriate features only. This means you <strong>cannot</strong>:</p>
    <ul>
      <li>Purchase or use the <strong>Battle Pass</strong>.</li>
      <li>Participate in <strong>cash-reward competitions</strong> or monthly prize distributions.</li>
      <li>Receive <strong>referral commissions</strong> tied to paid products (e.g., Full Game Upgrade or Battle Pass).</li>
    </ul>
    <p>We may restrict or suspend accounts that attempt to bypass verification or provide false information.</p>
  </section>

  <section id="economy">
    <h2>5. Game Economy, Rewards &amp; Referrals</h2>
    <ul>
      <li><strong>Referral Commissions:</strong> Referrers earn R10 when a referred player purchases the Full Game and R10 when they purchase the Battle Pass, subject to eligibility and anti-fraud checks.</li>
      <li><strong>Prize Pool (Year 1):</strong> R10 from each Battle Pass goes to a payout pool. Example: with 20,000 Battle Passes, the pool would be R200,000 annually (~R16,666/month).</li>
      <li><strong>Growth Fund:</strong> An additional R20 from each Battle Pass goes to an investment fund intended to yield at least 10% p.a., supporting sustainable and increasing monthly rewards.</li>
      <li><strong>Distribution:</strong> Monthly prizes may be tiered (e.g., top placements larger amounts; broader placements smaller amounts). Exact allocations may change to maintain fairness, sustainability, and compliance.</li>
    </ul>
    <p><em>Eligibility for any rewards requires completed age/consent verification and compliance with these Terms.</em></p>
  </section>

  <section id="purchases">
    <h2>6. Purchases &amp; Payments</h2>
    <ul>
      <li>Paid products (e.g., Full Game Upgrade, Battle Pass) are processed by <strong>Yoco</strong>. We do not store full card details.</li>
      <li>On success, products unlock in your account. Prices are in ZAR. Taxes shown where applicable.</li>
      <li><strong>Refunds:</strong> Digital purchases are generally final, except where required by law or if fulfillment fails.</li>
    </ul>
  </section>

  <section id="gameplay">
    <h2>7. Gameplay, Fair Use &amp; Anti-Cheat</h2>
    <ul>
      <li>We monitor for cheating, exploitation, and manipulation of referrals or rewards.</li>
      <li>We may suspend or terminate accounts for violations, fraud, or attempts to gain unfair advantage.</li>
    </ul>
  </section>

  <section id="nfts">
    <h2>8. NFTs &amp; Blockchain</h2>
    <p>Some content is represented by NFTs (e.g., ERC-1155 on Polygon). Blockchain transfers are public and irreversible. We cannot undo on-chain transactions.</p>
  </section>

  <section id="liability">
    <h2>9. Service Availability &amp; Liability</h2>
    <p><?php echo $siteName; ?> is provided “as is”. To the maximum extent permitted by law, we disclaim liability for interruptions, data loss, or indirect damages.</p>
  </section>

  <section id="changes">
    <h2>10. Changes to These Terms</h2>
    <p>We may update these Terms to reflect service or legal changes. Continued use after changes constitutes acceptance.</p>
  </section>

  <section id="contact">
    <h2>11. Contact</h2>
    <p>Email: <a href="mailto:<?php echo $contact; ?>"><?php echo $contact; ?></a></p>
  </section>
</main>

<footer>
  <hr>
  <p>&copy; <?php echo date('Y'); ?> <?php echo $brand; ?>. All rights reserved.</p>
</footer>
</body>
</html>
