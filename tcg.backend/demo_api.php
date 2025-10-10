<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
session_start();
header('Content-Type: application/json');

// Load environment and connect to DB
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
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "DB connection failed."]);
    exit;
}

function getRandomCards(PDO $pdo): array {
    $stmt = $pdo->query("
        SELECT token_id, display_name, card_image, power_rating, health, attack, sats, size, animorph_type AS element
        FROM animorph_cards
        ORDER BY RANDOM() LIMIT 10
    ");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Initialize game session if not already started
if (!isset($_SESSION['demo_game'])) {
    $_SESSION['demo_game'] = [
        'player_deck'  => getRandomCards($pdo),
        'ai_deck'      => getRandomCards($pdo),
        'round'        => 1,
        'player_wins'  => 0,
        'ai_wins'      => 0,
        'history'      => []
    ];
}
$game = &$_SESSION['demo_game'];

$valid_stats = ['power_rating', 'health', 'attack', 'sats', 'size'];

// Handle a round play (POST request)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);

    // Automatically choose stat if it's the AI's turn (even-numbered rounds)
    if (!isset($input['stat']) || !$input['stat']) {
        if ($game['round'] % 2 === 0) {
            $stat = $valid_stats[array_rand($valid_stats)];
        } else {
            echo json_encode(["status" => "error", "message" => "Stat not provided."]);
            exit;
        }
    } else {
        $stat = $input['stat'];
    }

    if (!in_array($stat, $valid_stats)) {
        echo json_encode(["status" => "error", "message" => "Invalid stat."]);
        exit;
    }

    // Draw top card from each deck
    $user_card = array_shift($game['player_deck']);
    $ai_card   = array_shift($game['ai_deck']);

    $user_value = $user_card[$stat];
    $ai_value   = $ai_card[$stat];
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

    // Put played cards back at the bottom of each deck
    $game['player_deck'][] = $user_card;
    $game['ai_deck'][]     = $ai_card;
    $game['round']++;

    // If 10 rounds completed, end match
    if ($game['round'] > 10) {
        $final_result = ($game['player_wins'] > $game['ai_wins']) 
                        ? 'player' 
                        : (($game['ai_wins'] > $game['player_wins']) ? 'ai' : 'draw');
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
        unset($_SESSION['demo_game']);
        echo json_encode($response);
        exit;
    }

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

// Initial game load (GET)
echo json_encode([
    "status"     => "ok",
    "round"      => $game['round'],
    "user_card"  => $game['player_deck'][0],
    "ai_card_back" => "/home/assets/animorphs/150-snow-leopard.jpeg",
    "playerWins" => $game['player_wins'],
    "aiWins"     => $game['ai_wins']
]);
exit;
