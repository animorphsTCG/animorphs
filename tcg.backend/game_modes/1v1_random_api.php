<?php
// 1v1 Random — Production API (owner start, lobby status, match status, choose stat, signals, rewards)
// - Always returns well-formed JSON (never blank)
// - Broadcasts MATCH_LAUNCH so both players are redirected immediately
// - Writes leaderboards, wallet_points, player_statistics on match end
// - Accepts application/json and x-www-form-urlencoded

ini_set('display_errors', 0);
error_reporting(E_ALL);
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable('/home');
$dotenv->safeLoad();

// ---------- helpers ----------
function respond(array $payload, int $code = 200) {
  http_response_code($code);
  // Never return empty (even on errors)
  echo json_encode($payload, JSON_PARTIAL_OUTPUT_ON_ERROR);
  exit;
}

if (!isset($_SESSION['user_id'])) {
  respond(['success'=>false,'error'=>'login_required'], 403);
}
$userId = (int)$_SESSION['user_id'];

// Parse input (support JSON or form)
$action  = $_GET['action'] ?? $_POST['action'] ?? null;
$lobbyId = (int)($_GET['lobby_id'] ?? $_POST['lobby_id'] ?? 0);
if ($_SERVER['REQUEST_METHOD'] === 'POST'
    && isset($_SERVER['CONTENT_TYPE'])
    && stripos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
  $raw = file_get_contents('php://input');
  if ($raw !== '') {
    $json = json_decode($raw, true);
    if (is_array($json)) {
      $action  = $json['action']  ?? $action;
      $lobbyId = (int)($json['lobby_id'] ?? $lobbyId);
      $STAT_IN = $json['stat'] ?? null; // used later
    }
  }
}

// ---------- DB ----------
try {
  $pdo = new PDO(
    "pgsql:host={$_ENV['TCG_DB_HOST']};port=".($_ENV['TCG_DB_PORT'] ?? 5432).";dbname={$_ENV['TCG_DB_NAME']}",
    $_ENV['TCG_DB_USER'],
    $_ENV['TCG_DB_PASS'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
  );
} catch (Throwable $e) {
  respond(['success'=>false,'error'=>'db_connect']);
}

// ---------- query helpers ----------
function is_participant(PDO $p, int $l, int $u): bool {
  $s = $p->prepare("SELECT 1 FROM lobby_participants WHERE lobby_id=:l AND user_id=:u");
  $s->execute([':l'=>$l, ':u'=>$u]);
  return (bool)$s->fetchColumn();
}
function lobby_info(PDO $p, int $l): ?array {
  $s = $p->prepare("SELECT id, owner_id, mode, status FROM lobbies WHERE id=:l");
  $s->execute([':l'=>$l]);
  $r = $s->fetch(PDO::FETCH_ASSOC);
  return $r ?: null;
}
function participants(PDO $p, int $l): array {
  $s = $p->prepare("SELECT p.user_id, p.is_ready, u.username FROM lobby_participants p JOIN users u ON u.id=p.user_id WHERE p.lobby_id=:l ORDER BY p.joined_at ASC");
  $s->execute([':l'=>$l]);
  return $s->fetchAll(PDO::FETCH_ASSOC);
}
function random_deck(PDO $p, int $count = 10): array {
  $r = $p->query("SELECT token_id FROM animorph_cards ORDER BY random() LIMIT ".(int)$count);
  return array_map(fn($x) => (int)$x['token_id'], $r->fetchAll(PDO::FETCH_ASSOC));
}
function get_card(PDO $p, int $tokenId): ?array {
  $s = $p->prepare("SELECT token_id, display_name, card_image, power_rating, health, attack, sats, size, animorph_type FROM animorph_cards WHERE token_id=:t");
  $s->execute([':t'=>$tokenId]);
  $r = $s->fetch(PDO::FETCH_ASSOC);
  return $r ?: null;
}
function statcol(string $label): ?string {
  $map = ['power'=>'power_rating', 'health'=>'health', 'attack'=>'attack', 'sats'=>'sats', 'size'=>'size'];
  return $map[strtolower(trim($label))] ?? null;
}
function load_battle(PDO $p, int $l): ?array {
  try {
    $sql = "SELECT id, lobby_id, mode, p1_user_id, p2_user_id,
                   status, state_json, winner_id AS winner_user_id
            FROM battles
            WHERE lobby_id = :l
            ORDER BY id DESC
            LIMIT 1";
    $s = $p->prepare($sql);
    $s->execute([':l' => $l]);
    $r = $s->fetch(PDO::FETCH_ASSOC);
    return $r ?: null;
  } catch (Throwable $e) {
    file_put_contents(
      '/var/log/tcg_match_start.log',
      sprintf("[%s] load_battle() failed for lobby %d: %s\n",
        date('Y-m-d H:i:s'), $l, $e->getMessage()
      ),
      FILE_APPEND
    );
    return null;
  }
}
function persist(PDO $p, int $id, array $state, ?string $status = null, ?int $winner = null): void {
  $sql = "UPDATE battles SET state_json=:s, updated_at=now()";
  $params = [':s'=>json_encode($state, JSON_PARTIAL_OUTPUT_ON_ERROR), ':id'=>$id];
  if ($status !== null) { $sql .= ", status=:st"; $params[':st'] = $status; }
  if ($winner !== null) { $sql .= ", winner_user_id=:w"; $params[':w'] = $winner; }
  $sql .= " WHERE id=:id";
  $q = $p->prepare($sql);
  $q->execute($params);
}
function signal(PDO $p, int $l, int $fromUser, string $sig): void {
  $q = $p->prepare("INSERT INTO lobby_signals (lobby_id, from_user, signal) VALUES (:l,:u,:s)");
  $q->execute([':l'=>$l, ':u'=>$fromUser, ':s'=>$sig]);
}
function fetch_signals(PDO $p, int $l, int $me): array {
  $q = $p->prepare("SELECT signal, from_user, created_at FROM lobby_signals WHERE lobby_id=:l AND created_at > now() - interval '45 seconds' AND from_user <> :me ORDER BY id DESC");
  $q->execute([':l'=>$l, ':me'=>$me]);
  return $q->fetchAll(PDO::FETCH_ASSOC);
}
function has_bp(PDO $p, int $uid): bool {
  $q = $p->prepare("SELECT 1 FROM entitlements WHERE user_id=:u AND type='battle_pass' AND expires_at IS NOT NULL AND expires_at > now() LIMIT 1");
  $q->execute([':u'=>$uid]);
  return (bool)$q->fetchColumn();
}
function lb_upsert(PDO $p, int $uid, int $mp, int $lbp, bool $won): void {
  $sel = $p->prepare("SELECT 1 FROM leaderboards WHERE user_id=:u");
  $sel->execute([':u'=>$uid]);
  if ($sel->fetchColumn()) {
    $u = $p->prepare("UPDATE leaderboards SET mp_points = COALESCE(mp_points,0)+:mp, lbp_points = COALESCE(lbp_points,0)+:lbp, total_matches = COALESCE(total_matches,0)+1, total_wins = COALESCE(total_wins,0)+:w, last_updated = now() WHERE user_id=:u");
    $u->execute([':mp'=>$mp, ':lbp'=>$lbp, ':w'=>($won?1:0), ':u'=>$uid]);
  } else {
    $i = $p->prepare("INSERT INTO leaderboards (user_id, mp_points, lbp_points, total_wins, total_matches, last_updated, username) VALUES (:u, :mp, :lbp, :w, 1, now(), (SELECT username FROM users WHERE id=:u LIMIT 1))");
    $i->execute([':u'=>$uid, ':mp'=>$mp, ':lbp'=>$lbp, ':w'=>($won?1:0)]);
  }
}
function stats_upsert(PDO $p, int $uid, string $mode, bool $won): void {
  // requires unique (user_id, mode) or we simulate it:
  $q = $p->prepare("INSERT INTO player_statistics (user_id, mode, games_played, games_won, updated_at) VALUES (:u,:m,1,:w,now()) ON CONFLICT (user_id,mode) DO UPDATE SET games_played = player_statistics.games_played+1, games_won = player_statistics.games_won + EXCLUDED.games_won, updated_at = now()");
  $q->execute([':u'=>$uid, ':m'=>$mode, ':w'=>($won?1:0)]);
}
function wallet_add(PDO $p, int $uid, string $mode, int $mp, int $lbp, int $ai, string $result): void {
  $q = $p->prepare("INSERT INTO wallet_points (user_id, mode, mp_earned, lbp_earned, ai_earned, match_result, created_at) VALUES (:u,:m,:mp,:lbp,:ai,:r, now())");
  $q->execute([':u'=>$uid, ':m'=>$mode, ':mp'=>$mp, ':lbp'=>$lbp, ':ai'=>$ai, ':r'=>$result]);
}

// ---------- actions ----------

// 0) lobby_status (polled by my_lobby.php to auto-redirect both players)
if ($action === 'lobby_status') {
  if (!$lobbyId || !is_participant($pdo, $lobbyId, $userId)) {
    respond(['success'=>false,'error'=>'bad_lobby']);
  }
  $l = lobby_info($pdo, $lobbyId);
  if (!$l) respond(['success'=>false,'error'=>'lobby_not_found']);

  $plist = participants($pdo, $lobbyId);
  $norm = array_map(fn($r)=>[
    'username'=>$r['username'],
    'is_ready'=>($r['is_ready']==='t'||$r['is_ready']===true||(int)$r['is_ready']===1)
  ], $plist);

  respond([
    'success'=>true,
    'status'=>$l['status'],
    'mode'=> ($l['mode'] === '1v1' ? '1v1_random' : $l['mode']),
    'participants'=>$norm,
    'signals'=> fetch_signals($pdo, $lobbyId, $userId)
  ]);
}

// 1) owner_start_match
if ($action === 'owner_start_match') {
  if (!$lobbyId) respond(['success'=>false,'error'=>'missing_lobby_id']);

  $l = lobby_info($pdo, $lobbyId);
  if (!$l) respond(['success'=>false,'error'=>'lobby_not_found']);
  if ((int)$l['owner_id'] !== $userId) respond(['success'=>false,'error'=>'not_owner']);

  $ps = participants($pdo, $lobbyId);
  if (count($ps) < 2) respond(['success'=>false,'error'=>'need_two']);

  // determine p1 (owner) and p2
  $p1 = (int)$l['owner_id'];
  $p2 = (int)($ps[0]['user_id'] == $p1 ? $ps[1]['user_id'] : $ps[0]['user_id']);

  // both ready?
  $r1 = ($ps[0]['user_id']==$p1) ? $ps[0] : $ps[1];
  $r2 = ($ps[0]['user_id']==$p1) ? $ps[1] : $ps[0];
  $ready1 = ($r1['is_ready']==='t'||$r1['is_ready']===true||(int)$r1['is_ready']===1);
  $ready2 = ($r2['is_ready']==='t'||$r2['is_ready']===true||(int)$r2['is_ready']===1);
  if (!$ready1 || !$ready2) respond(['success'=>false,'error'=>'not_ready']);

  $state = [
    'p1'=>['user_id'=>$p1, 'deck'=>random_deck($pdo)],
    'p2'=>['user_id'=>$p2, 'deck'=>random_deck($pdo)],
    'round'=>1,
    'turn'=>'p1', // owner starts (odd rounds)
    'scores'=>['p1'=>0, 'p2'=>0],
    'history'=>[]
  ];

  try {
    $pdo->beginTransaction();

    $ins = $pdo->prepare("INSERT INTO battles (lobby_id, mode, p1_user_id, p2_user_id, status, state_json) VALUES (:l,'1v1_random',:p1,:p2,'active',:s)");
    $ins->execute([':l'=>$lobbyId, ':p1'=>$p1, ':p2'=>$p2, ':s'=>json_encode($state, JSON_PARTIAL_OUTPUT_ON_ERROR)]);

    $pdo->prepare("UPDATE lobbies SET status='in_match', updated_at=now() WHERE id=:l")->execute([':l'=>$lobbyId]);

    // Broadcast: tell both clients to open the match page immediately
    signal($pdo, $lobbyId, $userId, 'MATCH_LAUNCH');

    $pdo->commit();
    respond(['success'=>true]);
  } catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    respond(['success'=>false,'error'=>'start_failed']);
  }
}

// 2) match_status (polled by game page)
if ($action === 'match_status') {
  if (!$lobbyId) respond(['success'=>false,'error'=>'missing_lobby_id']);
  if (!is_participant($pdo, $lobbyId, $userId)) respond(['success'=>false,'error'=>'bad_lobby']);

  $b = load_battle($pdo, $lobbyId);
  if (!$b) {
    respond(['success'=>true,'phase'=>'pregame','signals'=>fetch_signals($pdo, $lobbyId, $userId)]);
  }
  $st = json_decode($b['state_json'] ?? '[]', true) ?: [];
  $isP1 = ((int)$b['p1_user_id'] === $userId);

  $phase = ($b['status'] === 'finished') ? 'finished' : 'active';
  $turn_is_me = (($st['turn'] ?? 'p1') === ($isP1 ? 'p1' : 'p2'));
  $round = (int)($st['round'] ?? 1);
  $idx = max(0, $round - 1);

  $p1C = get_card($pdo, (int)($st['p1']['deck'][$idx] ?? 0));
  $p2C = get_card($pdo, (int)($st['p2']['deck'][$idx] ?? 0));

  $res = [
    'success'=>true,
    'phase'=>$phase,
    'turn_is_me'=>$turn_is_me,
    'scores'=>[
      'you'=> $isP1 ? (int)($st['scores']['p1'] ?? 0) : (int)($st['scores']['p2'] ?? 0),
      'opp'=> $isP1 ? (int)($st['scores']['p2'] ?? 0) : (int)($st['scores']['p1'] ?? 0)
    ],
    'current'=>[
      'me'       => $isP1 ? $p1C : $p2C,
      'opponent' => $isP1 ? $p2C : $p1C
    ],
    'signals'=> fetch_signals($pdo, $lobbyId, $userId)
  ];

  if ($phase === 'finished') {
    $p1s = (int)($st['scores']['p1'] ?? 0);
    $p2s = (int)($st['scores']['p2'] ?? 0);
    if ($p1s === $p2s)      $res['result_msg'] = "⚖️ It's a draw!";
    elseif (($p1s > $p2s && $isP1) || ($p2s > $p1s && !$isP1)) $res['result_msg'] = "🎉 You win!";
    else                    $res['result_msg'] = "💀 You lose!";
  }

  respond($res);
}

// 3) choose_stat (player turn)
if ($action === 'choose_stat') {
  if (!$lobbyId) respond(['success'=>false,'error'=>'missing_lobby_id']);
  if (!is_participant($pdo, $lobbyId, $userId)) respond(['success'=>false,'error'=>'bad_lobby']);

  // stat may come from JSON body (STAT_IN) or form
  $statLabel = $STAT_IN ?? ($_POST['stat'] ?? $_GET['stat'] ?? '');
  $col = statcol((string)$statLabel);
  if (!$col) respond(['success'=>false,'error'=>'invalid_stat']);

  $b = load_battle($pdo, $lobbyId);
  if (!$b) respond(['success'=>false,'error'=>'no_battle']);
  if ($b['status'] !== 'active') respond(['success'=>false,'error'=>'not_active']);

  $st = json_decode($b['state_json'] ?? '[]', true) ?: [];
  $isP1 = ((int)$b['p1_user_id'] === $userId);
  $turn = $st['turn'] ?? 'p1';
  if ($turn !== ($isP1 ? 'p1' : 'p2')) respond(['success'=>false,'error'=>'not_your_turn']);

  $round = (int)($st['round'] ?? 1);
  if ($round < 1 || $round > 10) respond(['success'=>false,'error'=>'round_out_of_bounds']);
  $idx = $round - 1;

  $p1Tok = (int)($st['p1']['deck'][$idx] ?? 0);
  $p2Tok = (int)($st['p2']['deck'][$idx] ?? 0);
  $c1 = get_card($pdo, $p1Tok);
  $c2 = get_card($pdo, $p2Tok);
  if (!$c1 || !$c2) respond(['success'=>false,'error'=>'card_not_found']);

  $v1 = (int)$c1[$col];
  $v2 = (int)$c2[$col];

  $winner = 'draw';
  if ($v1 > $v2)      { $winner = 'p1'; $st['scores']['p1'] = (int)($st['scores']['p1'] ?? 0) + 1; }
  elseif ($v2 > $v1)  { $winner = 'p2'; $st['scores']['p2'] = (int)($st['scores']['p2'] ?? 0) + 1; }

  $st['history'][] = [
    'round'=>$round,
    'chosen_stat'=>$statLabel,
    'p1_card'=>$c1['display_name'] ?? $p1Tok,
    'p2_card'=>$c2['display_name'] ?? $p2Tok,
    'p1_value'=>$v1, 'p2_value'=>$v2,
    'winner'=>$winner
  ];

  $st['round'] = $round + 1;
  $st['turn']  = ($turn === 'p1') ? 'p2' : 'p1';

  $msg = ($winner === 'draw')
    ? "Round $round: Draw!"
    : "Round $round: " . ($winner === 'p1' ? "Player 1 wins!" : "Player 2 wins!");

  // End after 10 rounds
  if ($st['round'] > 10) {
    $p1s = (int)($st['scores']['p1'] ?? 0);
    $p2s = (int)($st['scores']['p2'] ?? 0);
    $winUid = null; $res1 = 'draw'; $res2 = 'draw';
    if ($p1s > $p2s) { $winUid = (int)$b['p1_user_id']; $res1='win'; $res2='loss'; }
    elseif ($p2s > $p1s) { $winUid = (int)$b['p2_user_id']; $res1='loss'; $res2='win'; }

    try {
      $pdo->beginTransaction();
      persist($pdo, (int)$b['id'], $st, 'finished', $winUid);

      // rewards
      $bp1 = has_bp($pdo, (int)$b['p1_user_id']);
      $bp2 = has_bp($pdo, (int)$b['p2_user_id']);
      $calc = function(string $r, bool $bp) {
        if ($r === 'win')  return ['mp'=>5, 'lbp'=>($bp?5:0)];
        if ($r === 'loss') return ['mp'=>1, 'lbp'=>($bp?1:0)];
        return ['mp'=>1, 'lbp'=>($bp?1:0)]; // draw
      };
      $rw1 = $calc($res1, $bp1);
      $rw2 = $calc($res2, $bp2);

      lb_upsert($pdo, (int)$b['p1_user_id'], $rw1['mp'], $rw1['lbp'], $res1==='win');
      lb_upsert($pdo, (int)$b['p2_user_id'], $rw2['mp'], $rw2['lbp'], $res2==='win');

      stats_upsert($pdo, (int)$b['p1_user_id'], '1v1_random', $res1==='win');
      stats_upsert($pdo, (int)$b['p2_user_id'], '1v1_random', $res2==='win');

      wallet_add($pdo, (int)$b['p1_user_id'], '1v1_random', $rw1['mp'], $rw1['lbp'], 0, $res1);
      wallet_add($pdo, (int)$b['p2_user_id'], '1v1_random', $rw2['mp'], $rw2['lbp'], 0, $res2);

      $pdo->commit();
    } catch (Throwable $e) {
      if ($pdo->inTransaction()) $pdo->rollBack();
      // Even if reward write fails, we still finish the match
    }

    $msg .= " Match finished!";
    respond(['success'=>true, 'result_msg'=>$msg, 'scores'=>$st['scores']]);
  }

  // Continue match
  persist($pdo, (int)$b['id'], $st, 'active', null);
  respond(['success'=>true, 'result_msg'=>$msg, 'scores'=>$st['scores']]);
}

// 4) signals: play_again / return_lobby
if (in_array($action, ['play_again', 'return_lobby'], true)) {
  if (!$lobbyId || !is_participant($pdo, $lobbyId, $userId)) {
    respond(['success'=>false,'error'=>'bad_lobby']);
  }
  try {
    $pdo->beginTransaction();
    signal($pdo, $lobbyId, $userId, strtoupper($action));
    if ($action === 'return_lobby') {
      $pdo->prepare("UPDATE lobbies SET status='open', updated_at=now() WHERE id=:l")->execute([':l'=>$lobbyId]);
      $pdo->prepare("UPDATE lobby_participants SET is_ready=false WHERE lobby_id=:l")->execute([':l'=>$lobbyId]);
    }
    $pdo->commit();
    respond(['success'=>true]);
  } catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    respond(['success'=>false,'error'=>'signal_fail']);
  }
}

// default
respond(['success'=>false,'error'=>'unknown_action'], 400);
