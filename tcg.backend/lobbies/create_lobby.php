<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);
session_start();
require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

if (!isset($_SESSION['user_id'])) { echo json_encode(['success'=>false,'error'=>'login_required']); exit; }
$ownerId = (int)$_SESSION['user_id'];
$mode    = $_POST['mode'] ?? null;
if (!$mode || !in_array($mode, ['1v1','3p','4p'], true)) {
  echo json_encode(['success'=>false,'error'=>'invalid_mode']); exit;
}

$dotenv = Dotenv::createImmutable('/home'); $dotenv->safeLoad();
$pdo = new PDO(
  "pgsql:host={$_ENV['TCG_DB_HOST']};port=".($_ENV['TCG_DB_PORT']??5432).";dbname={$_ENV['TCG_DB_NAME']}",
  $_ENV['TCG_DB_USER'], $_ENV['TCG_DB_PASS'], [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]
);

$pdo->beginTransaction();
try {
  $stmt = $pdo->prepare("
  INSERT INTO lobbies (owner_id, mode, status, is_public, created_at, updated_at)
  VALUES (:o, :m, 'open', true, NOW(), NOW())
  RETURNING id
");
$stmt->execute([':o'=>$ownerId, ':m'=>$mode]);
$lobbyId = (int)$stmt->fetchColumn();

  $pdo->commit();
  echo json_encode(['success'=>true,'lobby_id'=>$lobbyId]);
} catch(Throwable $e) {
  if ($pdo->inTransaction()) $pdo->rollBack();
  echo json_encode(['success'=>false,'error'=>'db_error']);
}
