<?php
// /var/www/tcg.backend/lobbies/_common.php
// Standard bootstrap for all lobby endpoints (tcg/PostgreSQL)

ini_set('display_errors', 0); // keep errors out of JSON
error_reporting(E_ALL);
session_start();
header('Content-Type: application/json');

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable('/home');
$dotenv->safeLoad();

function pdo_tcg(): PDO {
    $pdo = new PDO(
        "pgsql:host={$_ENV['TCG_DB_HOST']};port=" . ($_ENV['TCG_DB_PORT'] ?? 5432) . ";dbname={$_ENV['TCG_DB_NAME']}",
        $_ENV['TCG_DB_USER'],
        $_ENV['TCG_DB_PASS'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    return $pdo;
}

function require_login(): int {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'login_required']);
        exit;
    }
    return (int)$_SESSION['user_id'];
}

function ensure_participant(PDO $pdo, int $lobbyId, int $userId): void {
    $q = $pdo->prepare("SELECT 1 FROM lobby_participants WHERE lobby_id=:l AND user_id=:u");
    $q->execute([':l'=>$lobbyId, ':u'=>$userId]);
    if (!$q->fetchColumn()) {
        http_response_code(403);
        echo json_encode(['success'=>false,'error'=>'not_in_lobby']);
        exit;
    }
}

function lobby_capacity_for_mode(string $mode): int {
    // schema: lobbies.mode in ['1v1','3p','4p']
    return ['1v1'=>2, '3p'=>3, '4p'=>4][$mode] ?? 2;
}
