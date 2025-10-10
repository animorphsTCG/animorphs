<?php
// /var/www/html/tcg.frontend/privacy-policy/index.php
declare(strict_types=1);
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 0');
$siteName   = 'Animorphs';
$brand      = 'Mythic Masters';
$domain     = 'tcg.mythicmasters.org.za';
$contact    = 'daniel@mythicmasters.org.za';
$effective  = '2025-08-17';
$lastUpdated= $effective;
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Privacy Policy | <?php echo htmlspecialchars($siteName, ENT_QUOTES); ?></title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Privacy Policy for <?php echo htmlspecialchars($siteName, ENT_QUOTES); ?>. Explains what we collect, how we use it, legal bases, children’s privacy (KWS), EOS, payments (Yoco), NFTs, and user rights.">
  <link rel="canonical" href="https://<?php echo $domain; ?>/privacy-policy">
</head>
<body>
  <header>
    <h1>Privacy Policy</h1>
    <p><strong><?php echo $siteName; ?></strong> is operated by <strong><?php echo $brand; ?></strong> (“we”, “us”, “our”).</p>
    <p><strong>Effective date:</strong> <?php echo $effective; ?><br>
       <strong>Last updated:</strong> <?php echo $lastUpdated; ?></p>
    <nav>
      <a href="/">Home</a> ·
      <a href="/terms">Terms &amp; Conditions</a>
    </nav>
    <hr>
  </header>

  <main>
    <section id="summary">
      <h2>Quick Summary</h2>
      <ul>
        <li>We collect account and gameplay information to operate the game, enable leaderboards, and process purchases.</li>
        <li>Some services are provided by trusted partners: Epic Online Services (EOS) for authentication; SuperAwesome Kids Web Services (KWS) for <strong>age verification and parental consent</strong>; Yoco for payments.</li>
        <li>Participation in certain features (e.g., <strong>Battle Pass</strong> with real-cash rewards) requires <strong>18+ age verification</strong> or <strong>verified parent/guardian consent</strong>.</li>
        <li>We comply with South Africa’s POPIA and, where applicable, GDPR.</li>
      </ul>
    </section>

    <section id="data-we-collect">
      <h2>Data We Collect</h2>
      <ul>
        <li><strong>Account data:</strong> username, email, password hash.</li>
        <li><strong>Identity &amp; age data:</strong> date of birth and national identification details (e.g., <code>id_number</code> from your SA ID or passport). This is required to comply with South African law for <strong>Battle Pass purchases</strong> and any features with real-money rewards.</li>
        <li><strong>Parental consent data:</strong> for users under 18, KWS will collect and manage parental/guardian contact details and consent confirmations.</li>
        <li><strong>Gameplay data:</strong> card selections, leaderboard points, wins/losses, and anti-cheat signals.</li>
        <li><strong>Transaction data:</strong> purchase history, order references, Yoco payment metadata. (We do not store full card details.)</li>
        <li><strong>Technical data:</strong> IP address, device info, logs, and cookies for security.</li>
        <li><strong>NFT/Blockchain:</strong> wallet addresses and transaction IDs when using on-chain features.</li>
      </ul>
    </section>

    <section id="children">
      <h2>Children’s Privacy &amp; KWS</h2>
      <p>Players aged 5–17 may register and play Animorphs. However, features involving <strong>real-money rewards</strong> (such as the Battle Pass) are locked until:</p>
      <ul>
        <li>The player is verified as 18 or older (via <code>id_number</code> / ID check), or</li>
        <li>A parent/guardian provides verified consent through KWS.</li>
      </ul>
      <p>If verification or consent is not obtained, the account remains restricted to free and age-appropriate features only.</p>
    </section>

    <section id="how-we-use">
      <h2>How We Use Your Data</h2>
      <ul>
        <li>Enable account creation, gameplay, leaderboards, and referral tracking.</li>
        <li>Confirm age and eligibility for Battle Pass and cash-reward features.</li>
        <li>Process payments through Yoco and prevent fraud.</li>
        <li>Authenticate players and enable multiplayer via EOS.</li>
        <li>Verify under-18 players and manage parental consent through KWS.</li>
        <li>Comply with South African and international laws (POPIA, AML, tax).</li>
      </ul>
    </section>

    <section id="legal-bases">
      <h2>Legal Bases</h2>
      <ul>
        <li><strong>Contract:</strong> To deliver services you request (gameplay, purchases).</li>
        <li><strong>Legal obligation:</strong> To verify age (<code>id_number</code>) and manage parental consent for minors before Battle Pass purchases.</li>
        <li><strong>Legitimate interests:</strong> Security, anti-cheat, fraud prevention, improving features.</li>
        <li><strong>Consent:</strong> Required for under-18 players (via KWS parental flows) and optional marketing communications.</li>
      </ul>
    </section>

    <section id="battle-pass">
      <h2>Battle Pass &amp; Age Verification</h2>
      <p>The Battle Pass unlocks premium content and allows participation in <strong>cash-reward competitions</strong>. To comply with law:</p>
      <ul>
        <li>Players <strong>18+</strong> must provide valid ID (e.g., SA <code>id_number</code> or passport) to confirm eligibility.</li>
        <li>Players under 18 require <strong>verified parental consent</strong> through KWS before purchase is allowed.</li>
      </ul>
      <p>Without verification or consent, Battle Pass purchases will be declined.</p>
    </section>

    <!-- Remaining unchanged sections (EOS, Payments, Cookies, Sharing, Security, Rights, etc.) -->
    <section id="contact">
      <h2>Contact</h2>
      <p>Email: <a href="mailto:<?php echo $contact; ?>"><?php echo $contact; ?></a></p>
      <p>URL: <a href="https://<?php echo $domain; ?>/privacy-policy">https://<?php echo $domain; ?>/privacy-policy</a></p>
    </section>
  </main>

  <footer>
    <hr>
    <p>&copy; <?php echo date('Y'); ?> <?php echo $brand; ?>. All rights reserved.</p>
  </footer>
</body>
</html>
