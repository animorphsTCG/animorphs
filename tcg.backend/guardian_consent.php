<?php
// /var/www/tcg.backend/guardian_consent.php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
session_start();
require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

// Load environment vars
$dotenv = Dotenv::createImmutable('/home');
$dotenv->safeLoad();

if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

$userId = $_SESSION['user_id'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Guardian Consent Form - Animorphs</title>
    <link rel="stylesheet" href="/assets/style.css">
    <style>
        body { font-family: Arial, sans-serif; background: #f9f9fb; }
        .container { max-width: 700px; margin: 40px auto; padding: 25px; background: #fff; border-radius: 12px; box-shadow: 0 3px 8px rgba(0,0,0,0.1); }
        h1 { font-size: 24px; margin-bottom: 10px; }
        p { line-height: 1.5; }
        label { font-weight: bold; display: block; margin-top: 15px; }
        input, select, textarea { width: 100%; padding: 10px; margin-top: 6px; border: 1px solid #ccc; border-radius: 8px; }
        .btn { margin-top: 20px; padding: 12px 20px; border: none; background: #0073e6; color: #fff; font-size: 16px; border-radius: 8px; cursor: pointer; }
        .btn:hover { background: #005bb5; }
        .legal { font-size: 13px; margin-top: 20px; }
        .nav-link { display: inline-block; margin-top: 25px; text-decoration: none; color: #0073e6; font-weight: bold; }
        .nav-link:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <!-- Navigation link back to profile -->
    <a href="/client_profile.php" class="nav-link">← Back to Profile</a>
<div class="container">
    <h1>Guardian Consent Form</h1>
    <p>As per South African law, players under 18 require verified guardian consent to access features with real-money rewards. Please complete this form carefully. Your information will be kept secure under <a href="/privacy-policy/" target="_blank">POPIA</a>.</p>

    <form id="consentForm">
        <label for="guardian_name">Guardian Full Name</label>
        <input type="text" id="guardian_name" name="guardian_name" required>

        <label for="guardian_id_number">Guardian ID / Passport Number (optional)</label>
        <input type="text" id="guardian_id_number" name="guardian_id_number">

        <label for="guardian_email">Guardian Email Address</label>
        <input type="email" id="guardian_email" name="guardian_email" required>

        <label for="relationship">Relationship to Child</label>
        <select id="relationship" name="relationship" required>
            <option value="">Select</option>
            <option value="Parent">Parent</option>
            <option value="Legal Guardian">Legal Guardian</option>
            <option value="Foster Parent">Foster Parent</option>
            <option value="Other">Other</option>
        </select>

        <label>
            <input type="checkbox" name="agree" required>
            I confirm I am the lawful guardian of this child and consent to their participation in Animorphs, including access to prize pools, referrals, and other reward features. I have read and agree to the <a href="/terms/" target="_blank">Terms & Conditions</a> and <a href="/privacy-policy/" target="_blank">Privacy Policy</a>.
        </label>

        <button type="submit" class="btn">Submit Consent</button>
    </form>

    <div id="result" style="margin-top:20px;"></div>

    <!-- Navigation link back to profile -->
    <a href="/client_profile.php" class="nav-link">← Back to Profile</a>
</div>

<script>
document.getElementById('consentForm').addEventListener('submit', function(e){
    e.preventDefault();
    const formData = new FormData(this);
    fetch('/ajax/submit_guardian_consent.php', {
        method: 'POST',
        body: formData
    }).then(r => r.json()).then(data => {
        document.getElementById('result').innerHTML = data.message;
    }).catch(err => {
        document.getElementById('result').innerHTML = "An error occurred. Please try again.";
    });
});
</script>
</body>
</html>
