<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);
session_start();
require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

header('Content-Type: application/json');
if (!isset($_SESSION['user_id'])) { echo json_encode(['success'=>false,'error'=>'login_required']); exit; }
$userId = (int)$_SESSION['user_id'];

$dotenv = Dotenv::createImmutable('/home'); $dotenv->safeLoad();
$pdo = new PDO(
  "pgsql:host={$_ENV['TCG_DB_HOST']};port=".($_ENV['TCG_DB_PORT']??5432).";dbname={$_ENV['TCG_DB_NAME']}",
  $_ENV['TCG_DB_USER'], $_ENV['TCG_DB_PASS'], [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]
);

$lobbyId = isset($_POST['lobby_id']) ? (int)$_POST['lobby_id'] : 0;
if (!$lobbyId){ echo json_encode(['success'=>false,'error'=>'invalid_lobby']); exit; }

// Check owner
$ownerQ = $pdo->prepare("SELECT owner_id FROM lobbies WHERE id=:l");
$ownerQ->execute([':l'=>$lobbyId]);
$ownerId = (int)($ownerQ->fetchColumn() ?? 0);

$pdo->beginTransaction();
try {
  if ($ownerId === $userId) {
    // Owner closes lobby entirely
    $pdo->prepare("DELETE FROM lobby_participants WHERE lobby_id=:l")->execute([':l'=>$lobbyId]);
    $pdo->prepare("DELETE FROM lobbies WHERE id=:l")->execute([':l'=>$lobbyId]);
  } else {
    // Participant leaves
    $pdo->prepare("DELETE FROM lobby_participants WHERE lobby_id=:l AND user_id=:u")->execute([':l'=>$lobbyId, ':u'=>$userId]);
    // If no one left, remove lobby
    $cnt = $pdo->prepare("SELECT COUNT(*) FROM lobby_participants WHERE lobby_id=:l");
    $cnt->execute([':l'=>$lobbyId]);
    if ((int)$cnt->fetchColumn() === 0) {
      $pdo->prepare("DELETE FROM lobbies WHERE id=:l")->execute([':l'=>$lobbyId]);
    }
  }
  $pdo->commit();
  echo json_encode(['success'=>true]);
} catch(Throwable $e){
  if ($pdo->inTransaction()) $pdo->rollBack();
  echo json_encode(['success'=>false,'error'=>'db_error']);
}
