<?php
// Records Terms & Privacy acceptance (one-click)
declare(strict_types=1);
session_start();
require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable('/home'); $dotenv->safeLoad();
$host=$_ENV['TCG_DB_HOST']??'localhost'; $db=$_ENV['TCG_DB_NAME']??''; $user=$_ENV['TCG_DB_USER']??''; $pass=$_ENV['TCG_DB_PASS']??''; $port=(int)($_ENV['TCG_DB_PORT']??5432);

if (!isset($_SESSION['user_id'])) { header('Location: /login.php'); exit; }

try {
  $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$db", $user, $pass, [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
  $stmt=$pdo->prepare("UPDATE users SET terms_accepted_at=NOW() WHERE id=:id");
  $stmt->execute([':id'=>$_SESSION['user_id']]);
  $_SESSION['terms_accepted']=true;
  header('Location: /tcg.frontend/store.php?accepted=1');
} catch (Throwable $e) {
  http_response_code(500);
  echo "Error saving acceptance.";
}
