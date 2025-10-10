<?php
// File: /var/www/tcg.backend/select_free_cards.php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
session_start();

header('Content-Type: application/json');

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable('/home');
$dotenv->safeLoad();

$dbname = $_ENV['TCG_DB_NAME'];
$dbuser = $_ENV['TCG_DB_USER'];
$dbpass = $_ENV['TCG_DB_PASS'];
$dbhost = $_ENV['TCG_DB_HOST'];
$dbport = $_ENV['TCG_DB_PORT'] ?? 5432;

try {
    $pdo = new PDO("pgsql:host=$dbhost;port=$dbport;dbname=$dbname", $dbuser, $dbpass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database connection failed."]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $alreadySelected = false;
    if (isset($_SESSION['user_id'])) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM free_cards WHERE user_id = :uid");
        $stmt->execute(['uid' => (int)$_SESSION['user_id']]);
        $alreadySelected = ((int)$stmt->fetchColumn()) > 0;
    }

    $cardsStmt = $pdo->query("
        SELECT 
            token_id,
            display_name,
            card_image,
            animorph_type,
            power_rating,
            health,
            attack,
            sats,
            size
        FROM animorph_cards
        ORDER BY token_id ASC
    ");
    $cards = $cardsStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "ok",
        "alreadySelected" => $alreadySelected,
        "cards" => $cards
    ]);
    exit;
}

if ($method === 'POST') {
    if (!isset($_SESSION['user_id']) || !is_numeric($_SESSION['user_id'])) {
        echo json_encode(["status" => "error", "message" => "Not logged in."]);
        exit;
    }
    $userId = (int)$_SESSION['user_id'];

    // Block repeat selections
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM free_cards WHERE user_id = :uid");
    $stmt->execute(['uid' => $userId]);
    if ((int)$stmt->fetchColumn() > 0) {
        echo json_encode(["status" => "error", "message" => "You have already selected your free cards."]);
        exit;
    }

    // Payload
    $input = json_decode(file_get_contents("php://input"), true);
    $tokenIds = $input['token_ids'] ?? [];

    if (!is_array($tokenIds)) {
        echo json_encode(["status" => "error", "message" => "Invalid payload."]);
        exit;
    }

    // Enforce exactly 10 unique integers (keep insertion order)
    $tokenIds = array_map('intval', $tokenIds);
    $tokenIds = array_values(array_unique($tokenIds));
    if (count($tokenIds) !== 10) {
        echo json_encode(["status" => "error", "message" => "Exactly 10 unique cards must be selected."]);
        exit;
    }

    // Verify all token_ids exist
    $placeholders = implode(',', array_fill(0, count($tokenIds), '?'));
    $check = $pdo->prepare("SELECT token_id FROM animorph_cards WHERE token_id IN ($placeholders)");
    $check->execute($tokenIds);
    $found = $check->fetchAll(PDO::FETCH_COLUMN, 0);
    if (count($found) !== 10) {
        echo json_encode(["status" => "error", "message" => "One or more selected cards do not exist."]);
        exit;
    }

    // Insert with picked_order (1..10) and selected_at (NOW())
    try {
        $pdo->beginTransaction();

        $ins = $pdo->prepare("
            INSERT INTO free_cards (user_id, token_id, picked_order, selected_at)
            VALUES (:uid, :tid, :ord, NOW())
        ");

        foreach ($tokenIds as $i => $tid) {
            $ins->execute([
                'uid' => $userId,
                'tid' => $tid,
                'ord' => $i + 1
            ]);
        }

        $pdo->commit();
        echo json_encode(["status" => "ok", "message" => "Free cards selected successfully."]);
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log("free_cards insert failed: {$e->getCode()} {$e->getMessage()}");
        // Friendlier messages for common constraint errors
        if ($e->getCode() === '23505') {
            echo json_encode(["status" => "error", "message" => "Duplicate card picked. Choose 10 unique cards."]);
        } elseif ($e->getCode() === '23503') {
            echo json_encode(["status" => "error", "message" => "A selected card is invalid. Refresh and try again."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Error saving your selections."]);
        }
    }
    exit;
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
