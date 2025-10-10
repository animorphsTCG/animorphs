<?php
// File: /var/www/tcg.backend/1vai_api.php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
session_start();
header('Content-Type: application/json');

// Require login
if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "code" => "not_logged_in", "message" => "Login required"]);
    exit;
}
$userId = (int)$_SESSION['user_id'];

// Load env + DB
require_once '/var/www/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable('/home');
$dotenv->safeLoad();

$dbname = $_ENV['TCG_DB_NAME'];
$dbuser = $_ENV['TCG_DB_USER'];
$dbpass = $_ENV['TCG_DB_PASS'];
$dbhost = $_ENV['TCG_DB_HOST'];
$dbport = $_ENV['TCG_DB_PORT'] ?? 5432;

try {
    $pdo = new PDO("pgsql:host=$dbhost;port=$dbport;dbname=$dbname", $dbuser, $dbpass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Throwable $e) {
    echo json_encode(["status" => "error", "message" => "DB connection failed."]);
    exit;
}

$valid_stats = ['power_rating', 'health', 'attack', 'sats', 'size'];

function getPlayerDeck(PDO $pdo, int $userId): array {
    // 10 selected free cards, shuffled per match
    $sql = "
        SELECT a.token_id, a.display_name, a.card_image, a.power_rating, a.health, a.attack, a.sats, a.size,
               a.animorph_type AS element
        FROM free_cards f
        JOIN animorph_cards a ON a.token_id = f.token_id
        WHERE f.user_id = :uid
        ORDER BY RANDOM()
        LIMIT 10
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':uid' => $userId]);
    $cards = $stmt->fetchAll(PDO::FETCH_ASSOC);
    return $cards ?: [];
}

function getAIDeck(PDO $pdo, array $excludeTokenIds): array {
    // Select 10 random cards not used by the player this match
    if (empty($excludeTokenIds)) {
        $placeholders = '';
    } else {
        $placeholders = implode(',', array_fill(0, count($excludeTokenIds), '?'));
    }

    $sql = "
        SELECT token_id, display_name, card_image, power_rating, health, attack, sats, size,
               animorph_type AS element
        FROM animorph_cards
        " . (!empty($excludeTokenIds) ? "WHERE token_id NOT IN ($placeholders)" : "") . "
        ORDER BY RANDOM()
        LIMIT 10
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($excludeTokenIds);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function upsertLeaderboard(PDO $pdo, int $userId, bool $won): void {
    // Insert if missing; otherwise bump counters. Also keep username in sync.
    $wins = $won ? 1 : 0;
    $ai   = $won ? 1 : 0;

    $sql = "
        INSERT INTO leaderboards (user_id, total_matches, total_wins, ai_points, last_updated, username)
        VALUES (:uid, 1, :wins, :aip, NOW(), (SELECT username FROM users WHERE id = :uid))
        ON CONFLICT (user_id)
        DO UPDATE SET
            total_matches = leaderboards.total_matches + 1,
            total_wins    = leaderboards.total_wins + EXCLUDED.total_wins,
            ai_points     = COALESCE(leaderboards.ai_points, 0) + EXCLUDED.ai_points,
            last_updated  = NOW(),
            username      = COALESCE(EXCLUDED.username, leaderboards.username)
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':uid'  => $userId,
        ':wins' => $wins,
        ':aip'  => $ai
    ]);
}

function ensureGameSession(PDO $pdo, int $userId): array {
    if (!isset($_SESSION['vai_game'])) {
        $playerDeck = getPlayerDeck($pdo, $userId);
        if (count($playerDeck) < 10) {
            echo json_encode([
                "status"  => "error",
                "code"    => "not_enough_free_cards",
                "message" => "Select your 10 free cards first."
            ]);
            exit;
        }
        $exclude = array_column($playerDeck, 'token_id');
        $aiDeck  = getAIDeck($pdo, $exclude);
        if (count($aiDeck) < 10) {
            echo json_encode(["status" => "error", "message" => "AI deck init failed."]);
            exit;
        }

        $_SESSION['vai_game'] = [
            'player_deck'  => array_values($playerDeck),
            'ai_deck'      => array_values($aiDeck),
            'round'        => 1,
            'player_wins'  => 0,
            'ai_wins'      => 0,
            'history'      => []
        ];
    }
    return $_SESSION['vai_game'];
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $game = ensureGameSession($pdo, $userId);

    echo json_encode([
        "status"       => "ok",
        "round"        => $game['round'],
        "user_card"    => $game['player_deck'][0],
        "ai_card_back" => "/home/assets/animorphs/150-snow-leopard.jpeg",
        "playerWins"   => $game['player_wins'],
        "aiWins"       => $game['ai_wins']
    ]);
    exit;
}

if ($method === 'POST') {
    $game = ensureGameSession($pdo, $userId);

    $payload = json_decode(file_get_contents("php://input"), true) ?? [];
    // If AI's turn (even rounds) we allow missing stat and auto-pick
    if (empty($payload['stat'])) {
        if ($game['round'] % 2 === 0) {
            $stat = $valid_stats[array_rand($valid_stats)];
        } else {
            echo json_encode(["status" => "error", "message" => "Stat not provided."]);
            exit;
        }
    } else {
        $stat = $payload['stat'];
    }

    if (!in_array($stat, $valid_stats, true)) {
        echo json_encode(["status" => "error", "message" => "Invalid stat."]);
        exit;
    }

    // Draw top cards
    $user_card = array_shift($game['player_deck']);
    $ai_card   = array_shift($game['ai_deck']);

    $user_value = (int)$user_card[$stat];
    $ai_value   = (int)$ai_card[$stat];

    $winner = 'draw';
    if ($user_value > $ai_value) {
        $game['player_wins']++;
        $winner = 'player';
    } elseif ($ai_value > $user_value) {
        $game['ai_wins']++;
        $winner = 'ai';
    }

    $game['history'][] = [
        'round'     => $game['round'],
        'stat'      => $stat,
        'user_card' => $user_card,
        'ai_card'   => $ai_card,
        'winner'    => $winner
    ];

    // Re-queue cards to the bottoms
    $game['player_deck'][] = $user_card;
    $game['ai_deck'][]     = $ai_card;

    $game['round']++;

    // Match end after 10 rounds
    if ($game['round'] > 10) {
        $final_result = ($game['player_wins'] > $game['ai_wins'])
            ? 'player'
            : (($game['ai_wins'] > $game['player_wins']) ? 'ai' : 'draw');

        // Persist leaderboard updates
        try {
            $pdo->beginTransaction();
            upsertLeaderboard($pdo, $userId, $final_result === 'player');
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            // Don't fail the response just for LB write; log if you want
        }

        $response = [
            "status"     => "ok",
            "result"     => $final_result,
            "rounds"     => $game['history'],
            "playerWins" => $game['player_wins'],
            "aiWins"     => $game['ai_wins'],
            "user_card"  => $user_card,
            "ai_card"    => $ai_card,
            "stat"       => $stat,
            "winner"     => $winner
        ];
        unset($_SESSION['vai_game']);
        echo json_encode($response);
        exit;
    }

    // Continue match
    $_SESSION['vai_game'] = $game;
    echo json_encode([
        "status"     => "ok",
        "round"      => $game['round'] - 1,
        "stat"       => $stat,
        "user_card"  => $user_card,
        "ai_card"    => $ai_card,
        "winner"     => $winner,
        "playerWins" => $game['player_wins'],
        "aiWins"     => $game['ai_wins']
    ]);
    exit;
}

echo json_encode(["status" => "error", "message" => "Unsupported method"]);
