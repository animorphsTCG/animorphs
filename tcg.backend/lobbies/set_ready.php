<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);
session_start();
require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) { echo json_encode(['success'=>false,'error'=>'login_required']); exit; }
$userId = (int)$_SESSION['user_id'];

$lobbyId = isset($_POST['lobby_id']) ? (int)$_POST['lobby_id'] : 0;
$ready   = isset($_POST['ready']) ? (int)$_POST['ready'] : null;
if (!$lobbyId || ($ready !== 0 && $ready !== 1)) {
  echo json_encode(['success'=>false,'error'=>'invalid_params']); exit;
}

$dotenv = Dotenv::createImmutable('/home'); $dotenv->safeLoad();
$pdo = new PDO(
  "pgsql:host={$_ENV['TCG_DB_HOST']};port=".($_ENV['TCG_DB_PORT']??5432).";dbname={$_ENV['TCG_DB_NAME']}",
  $_ENV['TCG_DB_USER'], $_ENV['TCG_DB_PASS'], [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]
);

// Confirm user belongs to this lobby
$check = $pdo->prepare("SELECT 1 FROM lobby_participants WHERE lobby_id=:l AND user_id=:u");
$check->execute([':l'=>$lobbyId, ':u'=>$userId]);
if (!$check->fetchColumn()) {
  echo json_encode(['success'=>false,'error'=>'not_in_lobby']); exit;
}

// Update ready state
$upd = $pdo->prepare("UPDATE lobby_participants SET is_ready=:r WHERE lobby_id=:l AND user_id=:u");
$upd->execute([':r'=>$ready, ':l'=>$lobbyId, ':u'=>$userId]);

echo json_encode(['success'=>true,'ready'=> (bool)$ready]);
