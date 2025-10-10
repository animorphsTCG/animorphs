<?php
// /var/www/tcg.backend/game_modes/1v1_random_api.php
ini_set('display_errors', 1);
error_reporting(E_ALL);
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status"=>"error","message"=>"Login required"]);
    exit;
}

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;
$dotenv = Dotenv::createImmutable('/home');
$dotenv->safeLoad();

$host = $_ENV['TCG_DB_HOST'];
$db   = $_ENV['TCG_DB_NAME'];
$user = $_ENV['TCG_DB_USER'];
$pass = $_ENV['TCG_DB_PASS'];
$port = $_ENV['TCG_DB_PORT'] ?? 5432;

try {
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Throwable $e) {
    echo json_encode(["status"=>"error","message"=>"DB connect failed"]);
    exit;
}

$userId = (int)$_SESSION['user_id'];
$valid_stats = ['power_rating','health','attack','sats','size'];

/**
 * Get 10 unique random cards not overlapping with exclude list.
 */
function getRandomDeck(PDO $pdo, array $exclude = []): array {
    $ph = str_repeat('?,', count($exclude));
    $ph = rtrim($ph, ',');
    $sql = "SELECT token_id, display_name, card_image, animorph_type AS element,
                   power_rating, health, attack, sats, size
            FROM animorph_cards
            " . (!empty($exclude) ? "WHERE token_id NOT IN ($ph)" : "") . "
            ORDER BY RANDOM() LIMIT 10";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($exclude);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Update leaderboard + stats.
 */
function applyRewards(PDO $pdo, int $uid, bool $won, bool $draw, bool $hasBattlePass) {
    $mp = $won ? 5 : 1;
    $lbp = $hasBattlePass ? ($won ? 5 : 1) : 0;

    $sql = "
        INSERT INTO leaderboards (user_id, mp_points, lbp_points, total_matches, total_wins, username, last_updated)
        VALUES (:uid, :mp, :lbp, 1, :wins, (SELECT username FROM users WHERE id=:uid), NOW())
        ON CONFLICT (user_id) DO UPDATE SET
            mp_points = COALESCE(leaderboards.mp_points,0) + EXCLUDED.mp_points,
            lbp_points = COALESCE(leaderboards.lbp_points,0) + EXCLUDED.lbp_points,
            total_matches = leaderboards.total_matches + 1,
            total_wins = leaderboards.total_wins + EXCLUDED.total_wins,
            username = COALESCE(EXCLUDED.username, leaderboards.username),
            last_updated = NOW()
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':uid'=>$uid,
        ':mp'=>$mp,
        ':lbp'=>$lbp,
        ':wins'=>($won?1:0)
    ]);

    // Player stats (per mode)
    $sql2 = "
        INSERT INTO player_statistics (user_id, mode, games_played, games_won, updated_at)
        VALUES (:uid, '1v1_random', 1, :wins, NOW())
        ON CONFLICT (user_id, mode) DO UPDATE SET
            games_played = player_statistics.games_played + 1,
            games_won = player_statistics.games_won + EXCLUDED.games_won,
            updated_at = NOW()
    ";
    $stmt2 = $pdo->prepare($sql2);
    $stmt2->execute([':uid'=>$uid, ':wins'=>($won?1:0)]);
}

// ---- Handle game state in $_SESSION for prototype ----
// In production you might want to persist to battles table earlier.

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (!isset($_SESSION['v1_game'])) {
        // Setup: get both players from lobby
        $lobbyId = $_GET['lobby_id'] ?? null;
        if (!$lobbyId) {
            echo json_encode(["status"=>"error","message"=>"No lobby specified"]);
            exit;
        }
        // Find both participants
        $stmt = $pdo->prepare("SELECT user_id FROM lobby_participants WHERE lobby_id=:lid ORDER BY joined_at");
        $stmt->execute([':lid'=>$lobbyId]);
        $users = $stmt->fetchAll(PDO::FETCH_COLUMN);
        if (count($users) !== 2) {
            echo json_encode(["status"=>"error","message"=>"Lobby not ready"]);
            exit;
        }
        $p1 = (int)$users[0]; $p2 = (int)$users[1];

        // Deal decks
        $p1Deck = getRandomDeck($pdo);
        $exclude = array_column($p1Deck,'token_id');
        $p2Deck = getRandomDeck($pdo,$exclude);

        $_SESSION['v1_game'] = [
            'players'=>[$p1,$p2],
            'decks'=>[$p1=>$p1Deck, $p2=>$p2Deck],
            'wins'=>[$p1=>0,$p2=>0],
            'round'=>1,
            'history'=>[]
        ];
    }
    $game = $_SESSION['v1_game'];
    // Lookup usernames for both players
$placeholders = implode(',', array_fill(0, count($game['players']), '?'));
$stmt = $pdo->prepare("SELECT id, username FROM users WHERE id IN ($placeholders)");
$stmt->execute($game['players']);
$userRows = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

echo json_encode([
    "status"=>"ok",
    "round"=>$game['round'],
    "players"=>array_map(function($uid) use ($userRows){
        return ["id"=>$uid, "username"=>$userRows[$uid] ?? ("Player ".$uid)];
    }, $game['players']),
    "me"=>$userId
]);
    exit;
}

if ($method === 'POST') {
    if (!isset($_SESSION['v1_game'])) {
        echo json_encode(["status"=>"error","message"=>"No game"]);
        exit;
    }
    $game = $_SESSION['v1_game'];
    $payload = json_decode(file_get_contents("php://input"), true) ?? [];

    $stat = $payload['stat'] ?? null;
    if (!$stat || !in_array($stat,$valid_stats,true)) {
        echo json_encode(["status"=>"error","message"=>"Invalid stat"]);
        exit;
    }

    $p1 = $game['players'][0]; $p2 = $game['players'][1];
    $u1Card = array_shift($game['decks'][$p1]);
    $u2Card = array_shift($game['decks'][$p2]);

    $v1 = (int)$u1Card[$stat]; $v2 = (int)$u2Card[$stat];
    $winner = null;
    if ($v1>$v2) { $game['wins'][$p1]++; $winner=$p1; }
    elseif ($v2>$v1) { $game['wins'][$p2]++; $winner=$p2; }

    $game['history'][] = [
        'round'=>$game['round'],'stat'=>$stat,
        'p1_card'=>$u1Card,'p2_card'=>$u2Card,'winner'=>$winner
    ];

    // Requeue cards
    $game['decks'][$p1][]=$u1Card; $game['decks'][$p2][]=$u2Card;
    $game['round']++;

    if ($game['round']>10) {
        // Decide winner
        $w1=$game['wins'][$p1]; $w2=$game['wins'][$p2];
        $result = $w1>$w2 ? $p1 : ($w2>$w1 ? $p2 : 'draw');

        try {
            $pdo->beginTransaction();
            // Get battle pass flags
            $stmt=$pdo->prepare("SELECT id,has_battle_pass,battle_pass_expires FROM users WHERE id IN (?,?)");
            $stmt->execute([$p1,$p2]);
            $flags=[]; foreach($stmt->fetchAll(PDO::FETCH_ASSOC) as $r){ 
                $flags[$r['id']] = ($r['has_battle_pass'] && (!$r['battle_pass_expires'] || $r['battle_pass_expires']>=date('Y-m-d')));
            }

            if ($result==='draw') {
                applyRewards($pdo,$p1,false,true,$flags[$p1]??false);
                applyRewards($pdo,$p2,false,true,$flags[$p2]??false);
            } else {
                $winnerId=$result; $loserId=($winnerId===$p1?$p2:$p1);
                applyRewards($pdo,$winnerId,true,false,$flags[$winnerId]??false);
                applyRewards($pdo,$loserId,false,false,$flags[$loserId]??false);
            }

            // Save battle
            $stmt=$pdo->prepare("INSERT INTO battles (player1_id,player2_id,battle_state,result,winner_id) VALUES (?,?,?,?,?)");
            $stmt->execute([$p1,$p2,json_encode($game),$result==='draw'?'draw':'win',($result==='draw'?null:$result)]);
            $pdo->commit();
        } catch(Throwable $e){ if($pdo->inTransaction()) $pdo->rollBack(); }

        unset($_SESSION['v1_game']);
        $allIds = $game['players'];
$ph = implode(',', array_fill(0,count($allIds),'?'));
$stmt = $pdo->prepare("SELECT id, username FROM users WHERE id IN ($ph)");
$stmt->execute($allIds);
$userRows = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

echo json_encode([
    "status"=>"done",
    "result"=>$result,
    "history"=>$game['history'],
    "me"=>$userId,
    "players"=>array_map(function($uid) use ($userRows){
        return ["id"=>$uid, "username"=>$userRows[$uid] ?? ("Player ".$uid)];
    }, $game['players'])
]);
        exit;
    }

    $_SESSION['v1_game']=$game;
    $allIds = $game['players'];
$ph = implode(',', array_fill(0,count($allIds),'?'));
$stmt = $pdo->prepare("SELECT id, username FROM users WHERE id IN ($ph)");
$stmt->execute($allIds);
$userRows = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

echo json_encode([
    "status"=>"ok",
    "round"=>$game['round']-1,
    "winner"=>$winner,
    "me"=>$userId,
    "players"=>array_map(function($uid) use ($userRows){
        return ["id"=>$uid, "username"=>$userRows[$uid] ?? ("Player ".$uid)];
    }, $game['players'])
]);
    exit;
}

echo json_encode(["status"=>"error","message"=>"Unsupported method"]);
