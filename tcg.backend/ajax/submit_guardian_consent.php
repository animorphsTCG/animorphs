<?php
// /var/www/tcg.backend/ajax/submit_guardian_consent.php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
session_start();
header('Content-Type: application/json');

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

// Load env vars
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
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'You must be logged in.']);
    exit;
}

$childUserId = $_SESSION['user_id'];
$guardianName = trim($_POST['guardian_name'] ?? '');
$guardianIdNumber = trim($_POST['guardian_id_number'] ?? '');
$guardianEmail = trim($_POST['guardian_email'] ?? '');
$relationship = trim($_POST['relationship'] ?? '');
$agree = isset($_POST['agree']);

if (!$guardianName || !$guardianEmail || !$relationship || !$agree) {
    echo json_encode(['success' => false, 'message' => 'Please complete all required fields.']);
    exit;
}

// Snapshot of legal wording (so you keep a record of exactly what they agreed to)
$consentText = "I confirm I am the lawful guardian of this child and consent to their participation in Animorphs, including access to prize pools, referrals, and other reward features. I have read and agree to the Terms & Conditions and Privacy Policy.";

try {
    $pdo->beginTransaction();

    // Insert into guardian_consents
    $stmt = $pdo->prepare("
        INSERT INTO guardian_consents 
        (child_user_id, guardian_name, guardian_id_number, guardian_email, relationship, consent_text, accepted_ip, accepted_ua) 
        VALUES (:child_user_id, :guardian_name, :guardian_id_number, :guardian_email, :relationship, :consent_text, :ip, :ua)
    ");
    $stmt->execute([
        ':child_user_id' => $childUserId,
        ':guardian_name' => $guardianName,
        ':guardian_id_number' => $guardianIdNumber ?: null,
        ':guardian_email' => $guardianEmail,
        ':relationship' => $relationship,
        ':consent_text' => $consentText,
        ':ip' => $_SERVER['REMOTE_ADDR'] ?? null,
        ':ua' => $_SERVER['HTTP_USER_AGENT'] ?? null
    ]);

    // Mark the user as having guardian consent
    $pdo->prepare("UPDATE users SET guardian_consent = TRUE WHERE id = :id")
        ->execute([':id' => $childUserId]);

    // Update KYC status to verified
    $pdo->prepare("UPDATE kyc_status SET status = 'verified', accepted_at = now(), accepted_ip = :ip, accepted_ua = :ua WHERE user_id = :id")
        ->execute([
            ':id' => $childUserId,
            ':ip' => $_SERVER['REMOTE_ADDR'] ?? null,
            ':ua' => $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);

    $pdo->commit();

    echo json_encode(['success' => true, 'message' => 'Guardian consent recorded successfully.']);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Failed to record consent.']);
}
