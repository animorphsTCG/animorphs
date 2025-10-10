<?php
// /var/www/tcg.backend/api/me/kyc-status.php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;
Dotenv::createImmutable('/home')->safeLoad();

if (!isset($_SESSION['user_id'])) {
  http_response_code(401);
  echo json_encode(['ok'=>false,'error'=>'unauthorized']); exit;
}
$userId = (int)$_SESSION['user_id'];

try {
  $host=$_ENV['TCG_DB_HOST']??'localhost';
  $db  =$_ENV['TCG_DB_NAME']??'tcg';
  $usr =$_ENV['TCG_DB_USER']??'';
  $pwd =$_ENV['TCG_DB_PASS']??'';
  $prt =(int)($_ENV['TCG_DB_PORT']??5432);
  $pdo = new PDO("pgsql:host=$host;port=$prt;dbname=$db", $usr, $pwd, [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);

  $st=$pdo->prepare("SELECT terms_accepted_at, kyc_status, kyc_verified_at, kyc_provider, guardian_email FROM users WHERE id=:u LIMIT 1");
  $st->execute([':u'=>$userId]);
  $row=$st->fetch(PDO::FETCH_ASSOC);

  if (!$row) { http_response_code(404); echo json_encode(['ok'=>false,'error'=>'not_found']); exit; }

  echo json_encode([
    'ok'=>true,
    'termsAccepted'=> !empty($row['terms_accepted_at']),
    'termsAcceptedAt'=> $row['terms_accepted_at'],
    'kyc'=>[
      'status'=> $row['kyc_status'] ?? 'unverified',   // unverified|pending|verified|rejected
      'verifiedAt'=> $row['kyc_verified_at'],
      'provider'=> $row['kyc_provider'] ?? null,
    ],
    'guardianEmail'=> $row['guardian_email'] ?? null,
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'server_error']);
}
