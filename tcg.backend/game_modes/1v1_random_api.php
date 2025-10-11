<?php
// /var/www/tcg.backend/game_modes/1v1_random_api.php
// Engine for 1v1 Random: match start, lobby/match status, stat choose, play-again/return.

ini_set('display_errors', 0);
error_reporting(E_ALL);
session_start();
header('Content-Type: application/json');

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable('/home');
$dotenv->safeLoad();

if (!isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(['success'=>false,'error'=>'login_required']);
    exit;
}

$userId  = (int)$_SESSION['user_id'];
$action  = $_GET['action'] ?? $_POST['action'] ?? '';
$lobbyId = (int)($_GET['lobby_id'] ?? $_POST['lobby_id'] ?? 0);

try {
    $pdo = new PDO(
        "pgsql:host={$_ENV['TCG_DB_HOST']};port=".($_ENV['TCG_DB_PORT'] ?? 5432).";dbname={$_ENV['TCG_DB_NAME']}",
        $_ENV['TCG_DB_USER'],
        $_ENV['TCG_DB_PASS'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'error'=>'db_connect']);
    exit;
}

/* -------------------- Helpers -------------------- */

function is_participant(PDO $pdo, int $lobbyId, int $userId): bool {
    $q = $pdo->prepare("SELECT 1 FROM lobby_participants WHERE lobby_id=:l AND user_id=:u");
    $q->execute([':l'=>$lobbyId, ':u'=>$userId]);
    return (bool)$q->fetchColumn();
}

function lobby_info(PDO $pdo, int $lobbyId): ?array {
    $st = $pdo->prepare("SELECT id, owner_id, mode, status FROM lobbies WHERE id=:l");
    $st->execute([':l'=>$lobbyId]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function other_user(PDO $pdo, int $lobbyId, int $userId): ?array {
    $st = $pdo->prepare("
        SELECT u.id, u.username
        FROM lobby_participants p
        JOIN users u ON u.id = p.user_id
        WHERE p.lobby_id=:l AND p.user_id<>:u
        ORDER BY p.joined_at ASC
        LIMIT 1
    ");
    $st->execute([':l'=>$lobbyId, ':u'=>$userId]);
    $r = $st->fetch(PDO::FETCH_ASSOC);
    return $r ?: null;
}

function fetch_participants(PDO $pdo, int $lobbyId): array {
    $p = $pdo->prepare("
      SELECT p.user_id, u.username, p.is_ready
      FROM lobby_participants p
      JOIN users u ON u.id = p.user_id
      WHERE p.lobby_id = :l
      ORDER BY p.joined_at ASC
    ");
    $p->execute([':l'=>$lobbyId]);
    return $p->fetchAll(PDO::FETCH_ASSOC);
}

function signal(PDO $pdo, int $lobbyId, int $from, string $sig): void {
    // lobby_signals: id, lobby_id, from_user, signal, created_at
    $s = $pdo->prepare("INSERT INTO lobby_signals (lobby_id, from_user, signal) VALUES (:l,:f,:s)");
    $s->execute([':l'=>$lobbyId, ':f'=>$from, ':s'=>$sig]);
}

function fetch_signals(PDO $pdo, int $lobbyId, int $userId): array {
    // last 30s, excluding own signals
    $st = $pdo->prepare("
        SELECT ls.signal, u.username AS sender, ls.created_at
        FROM lobby_signals ls
        JOIN users u ON u.id = ls.from_user
        WHERE ls.lobby_id=:l AND ls.created_at > now() - interval '30 seconds'
          AND ls.from_user <> :me
        ORDER BY ls.created_at DESC
    ");
    $st->execute([':l'=>$lobbyId, ':me'=>$userId]);
    return $st->fetchAll(PDO::FETCH_ASSOC);
}

function random_deck(PDO $pdo, int $count=10): array {
    // Use token_id from animorph_cards
    $q = $pdo->query("SELECT token_id FROM animorph_cards ORDER BY random() LIMIT ".(int)$count);
    return array_map(fn($r)=> (int)$r['token_id'], $q->fetchAll(PDO::FETCH_ASSOC));
}

function get_card_stats(PDO $pdo, int $tokenId): ?array {
    $q = $pdo->prepare("
      SELECT token_id, power_rating, health, attack, sats, size, nft_name, display_name, card_image, animorph_type
      FROM animorph_cards
      WHERE token_id = :t
    ");
    $q->execute([':t'=>$tokenId]);
    $r = $q->fetch(PDO::FETCH_ASSOC);
    return $r ?: null;
}

function has_active_battle_pass(PDO $pdo, int $userId): bool {
    $q = $pdo->prepare("
      SELECT 1 FROM entitlements
      WHERE user_id = :u
        AND type = 'battle_pass'
        AND expires_at IS NOT NULL
        AND expires_at > now()
      LIMIT 1
    ");
    $q->execute([':u'=>$userId]);
    return (bool)$q->fetchColumn();
}

function upsert_leaderboards(PDO $pdo, int $userId, int $mpEarned, int $lbpEarned, bool $won): void {
    // Select then update/insert (no assumption about unique index)
    $sel = $pdo->prepare("SELECT user_id, mp_points, lbp_points, total_wins, total_matches FROM leaderboards WHERE user_id=:u");
    $sel->execute([':u'=>$userId]);
    $row = $sel->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        $upd = $pdo->prepare("
          UPDATE leaderboards
             SET mp_points = COALESCE(mp_points,0) + :mp,
                 lbp_points = COALESCE(lbp_points,0) + :lbp,
                 total_wins = COALESCE(total_wins,0) + :w,
                 total_matches = COALESCE(total_matches,0) + 1,
                 last_updated = now()
           WHERE user_id=:u
        ");
        $upd->execute([
            ':mp'=>$mpEarned, ':lbp'=>$lbpEarned, ':w'=>($won?1:0), ':u'=>$userId
        ]);
    } else {
        $ins = $pdo->prepare("
          INSERT INTO leaderboards (user_id, mp_points, lbp_points, total_wins, total_matches, last_updated, username)
          VALUES (:u, :mp, :lbp, :w, 1, now(),
            (SELECT username FROM users WHERE id=:u LIMIT 1))
        ");
        $ins->execute([
            ':u'=>$userId, ':mp'=>$mpEarned, ':lbp'=>$lbpEarned, ':w'=>($won?1:0)
        ]);
    }
}

function update_player_stats(PDO $pdo, int $userId, string $mode, bool $won): void {
    // player_statistics: id, user_id, mode, games_played, games_won, updated_at
    $sel = $pdo->prepare("SELECT id, games_played, games_won FROM player_statistics WHERE user_id=:u AND mode=:m");
    $sel->execute([':u'=>$userId, ':m'=>$mode]);
    $row = $sel->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        $upd = $pdo->prepare("
          UPDATE player_statistics
             SET games_played = games_played + 1,
                 games_won    = games_won + :w,
                 updated_at   = now()
           WHERE id = :id
        ");
        $upd->execute([':w'=>($won?1:0), ':id'=>$row['id']]);
    } else {
        $ins = $pdo->prepare("
          INSERT INTO player_statistics (user_id, mode, games_played, games_won, updated_at)
          VALUES (:u, :m, 1, :w, now())
        ");
        $ins->execute([':u'=>$userId, ':m'=>$mode, ':w'=>($won?1:0)]);
    }
}

function add_wallet_points(PDO $pdo, int $userId, string $mode, int $mp, int $lbp, int $ai, string $result): void {
    $ins = $pdo->prepare("
      INSERT INTO wallet_points (user_id, mode, mp_earned, lbp_earned, ai_earned, match_result)
      VALUES (:u, :m, :mp, :lbp, :ai, :r)
    ");
    $ins->execute([':u'=>$userId, ':m'=>$mode, ':mp'=>$mp, ':lbp'=>$lbp, ':ai'=>$ai, ':r'=>$result]);
}

function load_active_battle(PDO $pdo, int $lobbyId): ?array {
    $b = $pdo->prepare("SELECT id, status, state_json, p1_user_id, p2_user_id FROM battles WHERE lobby_id=:l ORDER BY id DESC LIMIT 1");
    $b->execute([':l'=>$lobbyId]);
    $row = $b->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

function persist_battle_state(PDO $pdo, int $battleId, array $state, ?string $status=null, ?int $winnerUserId=null): void {
    $params = [':id'=>$battleId, ':s'=>json_encode($state)];
    $set = "state_json=:s, updated_at=now()";
    if ($status !== null) { $set .= ", status=:st"; $params[':st'] = $status; }
    if ($winnerUserId !== null) { $set .= ", winner_user_id=:w"; $params[':w'] = $winnerUserId; }
    $q = $pdo->prepare("UPDATE battles SET {$set} WHERE id=:id");
    $q->execute($params);
}

function stat_column_from_label(string $label): ?string {
    $map = [
        'power'  => 'power_rating',
        'health' => 'health',
        'attack' => 'attack',
        'sats'   => 'sats',
        'size'   => 'size'
    ];
    $key = strtolower($label);
    return $map[$key] ?? null;
}

/* -------------------- Actions -------------------- */

// Start: owner starts match (create battle, draw decks, set lobby in_match, signal)
if ($action === 'owner_start_match') {
    if (!$lobbyId) { echo json_encode(['success'=>false,'error'=>'missing_lobby_id']); exit; }
    $lobby = lobby_info($pdo, $lobbyId);
    if (!$lobby) { echo json_encode(['success'=>false,'error'=>'lobby_not_found']); exit; }
    if ((int)$lobby['owner_id'] !== $userId) { echo json_encode(['success'=>false,'error'=>'not_owner']); exit; }

    // Need 2 participants, both ready
    $plist = fetch_participants($pdo, $lobbyId);
    if (count($plist) < 2) { echo json_encode(['success'=>false,'error'=>'need_two_players']); exit; }

    // Ensure p1 = owner, p2 = other (owner goes first / odd rounds)
    $ownerIdx = array_search($lobby['owner_id'], array_column($plist, 'user_id'));
$p1 = (int)$plist[$ownerIdx]['user_id'];
$p2 = (int)$plist[1 - $ownerIdx]['user_id'];
    $r1 = ($plist[$ownerIdx]['is_ready'] === true || $plist[$ownerIdx]['is_ready'] === 't' || (int)$plist[$ownerIdx]['is_ready'] === 1);
    $r2 = ($plist[1 - $ownerIdx]['is_ready'] === true || $plist[1 - $ownerIdx]['is_ready'] === 't' || (int)$plist[1 - $ownerIdx]['is_ready'] === 1);
    if (!$r1 || !$r2) { echo json_encode(['success'=>false,'error'=>'both_not_ready']); exit; }

    $pdo->beginTransaction();
    try {
        $deck1 = random_deck($pdo, 10);
        $deck2 = random_deck($pdo, 10);

        $state = [
            'p1' => ['user_id'=>$p1, 'deck'=>$deck1],
            'p2' => ['user_id'=>$p2, 'deck'=>$deck2],
            'round'  => 1,
            'turn'   => 'p1', // owner first (odd rounds)
            'scores' => ['p1'=>0, 'p2'=>0],
            'history'=> []
        ];

        $ins = $pdo->prepare("
          INSERT INTO battles (lobby_id, mode, p1_user_id, p2_user_id, status, state_json)
          VALUES (:l, '1v1_random', :p1, :p2, 'active', :s)
          RETURNING id
        ");
        $ins->execute([':l'=>$lobbyId, ':p1'=>$p1, ':p2'=>$p2, ':s'=>json_encode($state)]);
        $battleId = (int)$ins->fetchColumn();

        $pdo->prepare("UPDATE lobbies SET status='in_match', updated_at=now() WHERE id=:l")->execute([':l'=>$lobbyId]);

        // Notify
        signal($pdo, $lobbyId, $userId, 'MATCH_STARTED');

        $pdo->commit();
        echo json_encode(['success'=>true,'battle_id'=>$battleId]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        echo json_encode(['success'=>false,'error'=>'start_failed']);
    }
    exit;
}

// Poll from lobby page: return status + participants + signals
if ($action === 'lobby_status') {
    if (!$lobbyId || !is_participant($pdo, $lobbyId, $userId)) { echo json_encode(['success'=>false,'error'=>'bad_lobby']); exit; }
    $lobby = lobby_info($pdo, $lobbyId);
    if (!$lobby) { echo json_encode(['success'=>false,'error'=>'lobby_not_found']); exit; }

    $plist = fetch_participants($pdo, $lobbyId);
    $plist = array_map(function($r){
        return [
            'username' => $r['username'],
            'is_ready' => ($r['is_ready'] === true || $r['is_ready'] === 't' || (int)$r['is_ready'] === 1)
        ];
    }, $plist);

    echo json_encode([
        'success'=>true,
        'status'=>$lobby['status'],
        'mode'=> ($lobby['mode'] === '1v1' ? '1v1_random' : $lobby['mode']),
        'participants'=>$plist,
        'signals'=> fetch_signals($pdo, $lobbyId, $userId)
    ]);
    exit;
}

// Poll from game page: match phase + scores + signals
if ($action === 'match_status') {
    if (!$lobbyId || !is_participant($pdo, $lobbyId, $userId)) { echo json_encode(['success'=>false,'error'=>'bad_lobby']); exit; }
    $lobby = lobby_info($pdo, $lobbyId);
    if (!$lobby) { echo json_encode(['success'=>false,'error'=>'lobby_not_found']); exit; }

    $battle = load_active_battle($pdo, $lobbyId);
    if (!$battle || $lobby['status'] !== 'in_match') {
        echo json_encode([
            'success'=>true,
            'phase'=>'pregame',
            'signals'=> fetch_signals($pdo, $lobbyId, $userId)
        ]);
        exit;
    }

    $state = json_decode($battle['state_json'], true) ?: [];
    $isP1  = ($battle['p1_user_id'] == $userId);
    $you   = $isP1 ? ($state['scores']['p1'] ?? 0) : ($state['scores']['p2'] ?? 0);
    $opp   = $isP1 ? ($state['scores']['p2'] ?? 0) : ($state['scores']['p1'] ?? 0);

    $phase = ($battle['status'] === 'finished') ? 'finished' : 'active';

    echo json_encode([
        'success'=>true,
        'phase'=>$phase,
        'scores'=> ['you'=>$you, 'opp'=>$opp],
        'signals'=> fetch_signals($pdo, $lobbyId, $userId)
    ]);
    exit;
}

// Choose stat for current round
if ($action === 'choose_stat') {
    if (!$lobbyId || !is_participant($pdo, $lobbyId, $userId)) { echo json_encode(['success'=>false,'error'=>'bad_lobby']); exit; }
    $statLabel = strtolower(trim((string)($_POST['stat'] ?? $_GET['stat'] ?? '')));
    $column = stat_column_from_label($statLabel);
    if (!$column) { echo json_encode(['success'=>false,'error'=>'invalid_stat']); exit; }

    $lobby  = lobby_info($pdo, $lobbyId);
    if (!$lobby || $lobby['status'] !== 'in_match') { echo json_encode(['success'=>false,'error'=>'no_active_match']); exit; }

    $battle = load_active_battle($pdo, $lobbyId);
    if (!$battle || $battle['status'] !== 'active') { echo json_encode(['success'=>false,'error'=>'no_active_battle']); exit; }

    $state = json_decode($battle['state_json'], true) ?: [];
    $turn  = $state['turn'] ?? 'p1';
    $round = (int)($state['round'] ?? 1);

    // Whose turn?
    $isP1Turn = ($turn === 'p1');
    $mustUser = $isP1Turn ? (int)$battle['p1_user_id'] : (int)$battle['p2_user_id'];
    if ($mustUser !== $userId) { echo json_encode(['success'=>false,'error'=>'not_your_turn']); exit; }

    // Bounds
    if ($round < 1 || $round > 10) {
        echo json_encode(['success'=>false,'error'=>'round_out_of_bounds']);
        exit;
    }

    // Get current cards (index = round-1)
    $idx    = $round - 1;
    $p1Deck = $state['p1']['deck'] ?? [];
    $p2Deck = $state['p2']['deck'] ?? [];
    if (!isset($p1Deck[$idx], $p2Deck[$idx])) {
        echo json_encode(['success'=>false,'error'=>'missing_card']);
        exit;
    }

    $p1Token = (int)$p1Deck[$idx];
    $p2Token = (int)$p2Deck[$idx];

    $c1 = get_card_stats($pdo, $p1Token);
    $c2 = get_card_stats($pdo, $p2Token);
    if (!$c1 || !$c2) {
        echo json_encode(['success'=>false,'error'=>'card_not_found']);
        exit;
    }

    $v1 = (int)$c1[$column];
    $v2 = (int)$c2[$column];

    $winner = null; // 'p1' | 'p2' | 'draw'
    if ($v1 > $v2)      { $state['scores']['p1'] = (int)($state['scores']['p1'] ?? 0) + 1; $winner = 'p1'; }
    else if ($v2 > $v1) { $state['scores']['p2'] = (int)($state['scores']['p2'] ?? 0) + 1; $winner = 'p2'; }
    else                { $winner = 'draw'; }

    $state['history'][] = [
        'round'       => $round,
        'chosen_stat' => $statLabel,
        'p1_card'     => $p1Token,
        'p2_card'     => $p2Token,
        'p1_value'    => $v1,
        'p2_value'    => $v2,
        'winner'      => $winner
    ];

    // Advance round / turn
    $state['round'] = $round + 1;
    if ($state['round'] <= 10) {
        // swap turn
        $state['turn'] = $isP1Turn ? 'p2' : 'p1';
        persist_battle_state($pdo, (int)$battle['id'], $state, 'active', null);
        echo json_encode([
            'success'=>true,
            'phase'=>'active',
            'scores'=>$state['scores'],
            'next_turn'=>$state['turn'],
            'next_round'=>$state['round']
        ]);
        exit;
    }

    // Match finished after 10th play → decide result & reward
    $p1Score = (int)($state['scores']['p1'] ?? 0);
    $p2Score = (int)($state['scores']['p2'] ?? 0);

    $winnerUserId = null;
    $resultP1 = 'draw';
    $resultP2 = 'draw';

    if ($p1Score > $p2Score) { $winnerUserId = (int)$battle['p1_user_id']; $resultP1='win'; $resultP2='loss'; }
    elseif ($p2Score > $p1Score) { $winnerUserId = (int)$battle['p2_user_id']; $resultP1='loss'; $resultP2='win'; }

    // Rewards
    $modeName = '1v1_random';
    $p1BP = has_active_battle_pass($pdo, (int)$battle['p1_user_id']);
    $p2BP = has_active_battle_pass($pdo, (int)$battle['p2_user_id']);

    // Helper closure: compute MP/LBP for a single result
    $compute = function(string $res, bool $bp): array {
        if ($res === 'win')  return ['mp'=>5, 'lbp'=>($bp?5:0)];
        if ($res === 'loss') return ['mp'=>1, 'lbp'=>($bp?1:0)];
        return ['mp'=>1, 'lbp'=>($bp?1:0)]; // draw
    };

    $p1Reward = $compute($resultP1, $p1BP);
    $p2Reward = $compute($resultP2, $p2BP);

    $pdo->beginTransaction();
    try {
        // Persist battle finished
        persist_battle_state($pdo, (int)$battle['id'], $state, 'finished', $winnerUserId);

        // Leaderboards
        upsert_leaderboards($pdo, (int)$battle['p1_user_id'], $p1Reward['mp'], $p1Reward['lbp'], $resultP1==='win');
        upsert_leaderboards($pdo, (int)$battle['p2_user_id'], $p2Reward['mp'], $p2Reward['lbp'], $resultP2==='win');

        // Player stats
        update_player_stats($pdo, (int)$battle['p1_user_id'], $modeName, $resultP1==='win');
        update_player_stats($pdo, (int)$battle['p2_user_id'], $modeName, $resultP2==='win');

        // Wallet points
        add_wallet_points($pdo, (int)$battle['p1_user_id'], $modeName, $p1Reward['mp'], $p1Reward['lbp'], 0, $resultP1);
        add_wallet_points($pdo, (int)$battle['p2_user_id'], $modeName, $p2Reward['mp'], $p2Reward['lbp'], 0, $resultP2);

        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        echo json_encode(['success'=>false,'error'=>'reward_fail']);
        exit;
    }

    // Return result perspective for the chooser
    $youRes = ($userId == $battle['p1_user_id']) ? $resultP1 : $resultP2;
    echo json_encode([
        'success'=>true,
        'phase'=>'finished',
        'scores'=>$state['scores'],
        'result'=>$youRes,             // 'win' | 'loss' | 'draw' (your perspective)
        'signals'=> fetch_signals($pdo, $lobbyId, $userId)
    ]);
    exit;
}

// PLAY AGAIN (notify only; owner can immediately start again)
if ($action === 'play_again') {
    if (!$lobbyId || !is_participant($pdo, $lobbyId, $userId)) { echo json_encode(['success'=>false,'error'=>'bad_lobby']); exit; }
    signal($pdo, $lobbyId, $userId, 'PLAY_AGAIN');
    echo json_encode(['success'=>true]);
    exit;
}

// RETURN TO LOBBY (set all ready=false, lobby open, notify)
if ($action === 'return_to_lobby') {
    if (!$lobbyId || !is_participant($pdo, $lobbyId, $userId)) { echo json_encode(['success'=>false,'error'=>'bad_lobby']); exit; }
    $pdo->beginTransaction();
    try {
        $pdo->prepare("UPDATE lobby_participants SET is_ready=false WHERE lobby_id=:l")->execute([':l'=>$lobbyId]);
        $pdo->prepare("UPDATE lobbies SET status='open', updated_at=now() WHERE id=:l")->execute([':l'=>$lobbyId]);
        signal($pdo, $lobbyId, $userId, 'RETURN_TO_LOBBY');
        $pdo->commit();
        echo json_encode(['success'=>true]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        echo json_encode(['success'=>false,'error'=>'rollback']);
    }
    exit;
}

echo json_encode(['success'=>false,'error'=>'unknown_action']);
