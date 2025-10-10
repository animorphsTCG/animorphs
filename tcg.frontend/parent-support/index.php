<?php
// /var/www/html/tcg.frontend/parent-support/index.php
declare(strict_types=1);
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('X-Frame-Options: SAMEORIGIN');

$siteName = 'Animorphs';
$brand    = 'Mythic Masters';
$domain   = 'tcg.mythicmasters.org.za';
$contact  = 'daniel@mythicmasters.org.za';
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Parent Support &amp; FAQ | <?php echo $siteName; ?></title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Parent Support and FAQ for Animorphs TCG. Explains why parental consent is needed, how age verification works, and what financial rewards are available to players.">
  <link rel="canonical" href="https://<?php echo $domain; ?>/parent-support">
</head>
<body>
  <header>
    <h1>Parent Support &amp; FAQ</h1>
    <p><strong><?php echo $siteName; ?></strong> is a trading card game by <strong><?php echo $brand; ?></strong>.  
       This page is for parents and guardians who receive a Kids Web Services (KWS) verification request.</p>
    <hr>
  </header>

  <main>
    <section>
      <h2>Why am I being asked to provide consent?</h2>
      <p>Your child has created an account on <?php echo $siteName; ?>.  
         Some parts of the game (such as the <strong>Battle Pass</strong> and reward competitions) require either the player to be <strong>18+</strong>, or for a parent/guardian to give permission.  
         We use <strong>SuperAwesome Kids Web Services (KWS)</strong>, a trusted system, to handle this securely.</p>
    </section>

    <section>
      <h2>What is at stake for my child?</h2>
      <p>Unlike most games, <?php echo $siteName; ?> has a genuine <strong>play-to-earn system</strong> with real financial rewards.  
         Granting consent allows your child to:</p>
      <ul>
        <li><strong>Earn referral commissions:</strong> R10 is awarded for every referred player who purchases the Full Game or Battle Pass.</li>
        <li><strong>Access prize pool rewards:</strong> For the first year, R10 from every Battle Pass sold is added to a payout pool.  
            Example: if 20,000 Battle Passes are sold, the pool would hold R200,000 annually (~R16,666 per month) for prizes.</li>
        <li><strong>Benefit from the investment fund:</strong> An additional R20 from each Battle Pass goes into a growth fund.  
            This fund earns at least 10% annually, ensuring sustainable, increasing monthly rewards over time.</li>
      </ul>
      <p>In practice, this means top players could receive monthly payouts (e.g., R1,500 for 1st place, R1,000 for 2nd, R500 for 3rd, and many more smaller prizes for top-ranking players).  
         Without consent, your child can still enjoy the free game — but they cannot earn, compete for prize pools, or receive referral commissions.</p>
    </section>

    <section>
      <h2>What information is collected?</h2>
      <ul>
        <li>Child’s account details (username, email).</li>
        <li>Date of birth and, where required, national ID/passport number for age verification.</li>
        <li>Parent/guardian contact details for consent.</li>
        <li>Consent confirmation results from KWS.</li>
      </ul>
      <p>We collect only what is required for legal compliance and fair participation in the game economy.</p>
    </section>

    <section>
      <h2>How is my data used?</h2>
      <ul>
        <li>To verify your child’s eligibility for reward-based features.</li>
        <li>To comply with South African POPIA and international GDPR standards.</li>
        <li>To ensure safe, legal, and transparent rewards distribution.</li>
      </ul>
    </section>

    <section>
      <h2>Do I have to consent?</h2>
      <p>No. If you choose not to give consent, your child may still play <?php echo $siteName; ?> with free features.  
         However, they will <strong>not</strong> be able to earn referral commissions or take part in the monthly reward pool competitions.</p>
    </section>

    <section>
      <h2>Can I withdraw consent?</h2>
      <p>Yes. You may withdraw consent at any time by contacting us at  
         <a href="mailto:<?php echo $contact; ?>"><?php echo $contact; ?></a>.  
         If consent is withdrawn, reward features will be disabled for the account.</p>
    </section>

    <section>
      <h2>More Information</h2>
      <ul>
        <li><a href="/privacy-policy">Privacy Policy</a></li>
        <li><a href="/terms">Terms &amp; Conditions</a></li>
      </ul>
    </section>

    <section>
      <h2>Contact Us</h2>
      <p>Email: <a href="mailto:<?php echo $contact; ?>"><?php echo $contact; ?></a></p>
    </section>
  </main>

  <footer>
    <hr>
    <p>&copy; <?php echo date('Y'); ?> <?php echo $brand; ?>. All rights reserved.</p>
  </footer>
</body>
</html>
