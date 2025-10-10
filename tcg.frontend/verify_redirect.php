<?php
// /var/www/html/tcg.frontend/verify_redirect.php
ini_set('display_errors', 0);
error_reporting(E_ALL);
session_start();

$token  = $_GET['token'] ?? '';
$error  = $_GET['error'] ?? null;
$sent   = isset($_GET['sent']);
$needEmail = isset($_GET['need_email']);

?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Account Verification</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 2em; }
    .box { max-width: 600px; margin: auto; padding: 1.5em; border: 1px solid #ccc; border-radius: 8px; }
    .success { color: green; font-weight: bold; }
    .error { color: red; font-weight: bold; }
    .info { color: #333; }
    a.button { display:inline-block; margin-top:1em; padding:0.5em 1em; background:#0077cc; color:#fff; text-decoration:none; border-radius:5px; }
  </style>
</head>
<body>
  <div class="box">
    <h2>Account Verification</h2>

    <?php if ($error): ?>
      <p class="error">
        <?php
          switch ($error) {
            case 'auth_fail':
              echo "Verification failed: Could not authenticate with KWS. Please try again later.";
              break;
            case 'no_token':
              echo "Verification failed: No OAuth token returned from KWS.";
              break;
            case 'send_email':
              echo "Verification failed: KWS did not accept the request to send the email.";
              break;
            default:
              echo "Verification failed due to an unknown error.";
          }
        ?>
      </p>
      <p class="info">Please retry the process or contact support if this continues.</p>

    <?php elseif ($sent): ?>
      <p class="success">
        We’ve asked KWS to contact your guardian email with a verification link.
      </p>
      <p class="info">Please check the inbox (and spam folder). Status: Pending</p>

    <?php elseif ($needEmail): ?>
      <p class="info">
        We need a parent/guardian email address before we can continue.  
        <a class="button" href="/profile.php">Update Email</a>
      </p>

    <?php else: ?>
      <p class="info">
        No verification action in progress.  
        <a class="button" href="/profile.php">Back to Profile</a>
      </p>
    <?php endif; ?>

    <p><a class="button" href="/index.php">Back to Store</a></p>
  </div>
</body>
</html>
