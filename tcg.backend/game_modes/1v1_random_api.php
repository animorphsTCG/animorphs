<?php
// /var/www/tcg.backend/game_modes/1v1_random_api.php
// 1v1 Random — full production version with rewards & end-of-match popup

ini_set('display_errors', 0);
error_reporting(E_ALL);
session_start();
header('Content-Type: application/json');

require_once '/var/www/vendor/autoload.php';
use Dotenv\Dotenv;
$dotenv = Dotenv::createImmutable('/home');
$dotenv->safeLoad();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success'=>false,'error'=>'login_required']); exit;
}
$userId  = (int)$_SESSION['user_id'];
$action  = $_GET['action'] ?? $_POST['action'] ?? '';
$lobbyId = (int)($_GET['lobby_id'] ?? $_POST['lobby_id'] ?? 0);

/* ---------- DB ---------- */
try {
    $pdo = new PDO(
        "pgsql:host={$_ENV['TCG_DB_HOST']};port=".($_ENV['TCG_DB_PORT'] ?? 5432).";dbname={$_ENV['TCG_DB_NAME']}",
        $_ENV['TCG_DB_USER'], $_ENV['TCG_DB_PASS'],
        [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]
    );
} catch(Throwable $e){ echo json_encode(['success'=>false,'error'=>'db_connect']); exit; }

/* ---------- Helpers ---------- */
function is_participant(PDO $p,$l,$u){$s=$p->prepare("SELECT 1 FROM lobby_participants WHERE lobby_id=:l AND user_id=:u");$s->execute([':l'=>$l,':u'=>$u]);return(bool)$s->fetchColumn();}
function lobby_info(PDO $p,$l){$s=$p->prepare("SELECT * FROM lobbies WHERE id=:l");$s->execute([':l'=>$l]);return$s->fetch(PDO::FETCH_ASSOC);}
function random_deck(PDO $p){$r=$p->query("SELECT token_id FROM animorph_cards ORDER BY random() LIMIT 10");return array_column($r->fetchAll(PDO::FETCH_ASSOC),'token_id');}
function get_card(PDO $p,$id){$s=$p->prepare("SELECT token_id,display_name,card_image,power_rating,health,attack,sats,size,animorph_type FROM animorph_cards WHERE token_id=:t");$s->execute([':t'=>$id]);return$s->fetch(PDO::FETCH_ASSOC);}
function statcol($l){$m=['power'=>'power_rating','health'=>'health','attack'=>'attack','sats'=>'sats','size'=>'size'];return$m[strtolower($l)]??null;}
function load_battle(PDO $p,$l){$s=$p->prepare("SELECT * FROM battles WHERE lobby_id=:l ORDER BY id DESC LIMIT 1");$s->execute([':l'=>$l]);return$s->fetch(PDO::FETCH_ASSOC)?:null;}
function persist(PDO $p,$id,$st,$stt=null,$win=null){$q=$p->prepare("UPDATE battles SET state_json=:s,updated_at=now(),status=COALESCE(:st,status),winner_user_id=COALESCE(:w,winner_user_id) WHERE id=:id");$q->execute([':s'=>json_encode($st),':st'=>$stt,':w'=>$win,':id'=>$id]);}
function signal(PDO $p,$l,$u,$sig){$q=$p->prepare("INSERT INTO lobby_signals(lobby_id,from_user,signal)VALUES(:l,:u,:s)");$q->execute([':l'=>$l,':u'=>$u,':s'=>$sig]);}
function fetch_signals(PDO $p,$l,$u){$q=$p->prepare("SELECT signal,from_user,created_at FROM lobby_signals WHERE lobby_id=:l AND created_at>now()-interval'30s' AND from_user<>:u ORDER BY id DESC");$q->execute([':l'=>$l,':u'=>$u]);return$q->fetchAll(PDO::FETCH_ASSOC);}
function has_bp(PDO $p,$u){$q=$p->prepare("SELECT 1 FROM entitlements WHERE user_id=:u AND type='battle_pass' AND expires_at>now() LIMIT 1");$q->execute([':u'=>$u]);return(bool)$q->fetchColumn();}
function up_lb(PDO $p,$u,$mp,$lbp,$w){$sel=$p->prepare("SELECT user_id FROM leaderboards WHERE user_id=:u");$sel->execute([':u'=>$u]);
 if($sel->fetchColumn()){
  $u1=$p->prepare("UPDATE leaderboards SET mp_points=COALESCE(mp_points,0)+:m,lbp_points=COALESCE(lbp_points,0)+:l,total_matches=COALESCE(total_matches,0)+1,total_wins=COALESCE(total_wins,0)+:w,last_updated=now() WHERE user_id=:u");
  $u1->execute([':m'=>$mp,':l'=>$lbp,':w'=>($w?1:0),':u'=>$u]);
 }else{
  $i=$p->prepare("INSERT INTO leaderboards(user_id,mp_points,lbp_points,total_wins,total_matches,last_updated,username)VALUES(:u,:m,:l,:w,1,now(),(SELECT username FROM users WHERE id=:u LIMIT 1))");
  $i->execute([':u'=>$u,':m'=>$mp,':l'=>$lbp,':w'=>($w?1:0)]);
 }}
function up_stats(PDO $p,$u,$m,$w){$q=$p->prepare("INSERT INTO player_statistics(user_id,mode,games_played,games_won,updated_at) VALUES(:u,:m,1,:w,now()) ON CONFLICT(user_id,mode) DO UPDATE SET games_played=player_statistics.games_played+1,games_won=player_statistics.games_won+EXCLUDED.games_won,updated_at=now()");$q->execute([':u'=>$u,':m'=>$m,':w'=>($w?1:0)]);}
function add_wallet(PDO $p,$u,$m,$mp,$lbp,$ai,$r){$q=$p->prepare("INSERT INTO wallet_points(user_id,mode,mp_earned,lbp_earned,ai_earned,match_result,created_at)VALUES(:u,:m,:mp,:lb,:ai,:r,now())");$q->execute([':u'=>$u,':m'=>$m,':mp'=>$mp,':lb'=>$lbp,':ai'=>$ai,':r'=>$r]);}

/* ---------- ACTIONS ---------- */

// OWNER START MATCH
if($action==='owner_start_match'){
  $l=lobby_info($pdo,$lobbyId); if(!$l||$l['owner_id']!=$userId){echo json_encode(['success'=>false,'error'=>'not_owner']);exit;}
  $p=$pdo->prepare("SELECT user_id,is_ready FROM lobby_participants WHERE lobby_id=:l ORDER BY joined_at ASC");$p->execute([':l'=>$lobbyId]);$ps=$p->fetchAll(PDO::FETCH_ASSOC);
  if(count($ps)<2){echo json_encode(['success'=>false,'error'=>'need_two']);exit;}
  if(!($ps[0]['is_ready']||$ps[1]['is_ready'])){echo json_encode(['success'=>false,'error'=>'not_ready']);exit;}
  $p1=(int)$l['owner_id'];$p2=(int)($ps[0]['user_id']==$p1?$ps[1]['user_id']:$ps[0]['user_id']);
  $state=['p1'=>['user_id'=>$p1,'deck'=>random_deck($pdo)],'p2'=>['user_id'=>$p2,'deck'=>random_deck($pdo)],
          'round'=>1,'turn'=>'p1','scores'=>['p1'=>0,'p2'=>0],'history'=>[]];
  $pdo->beginTransaction();
  $pdo->prepare("INSERT INTO battles(lobby_id,mode,p1_user_id,p2_user_id,status,state_json)
                 VALUES(:l,'1v1_random',:p1,:p2,'active',:s)")->execute([':l'=>$lobbyId,':p1'=>$p1,':p2'=>$p2,':s'=>json_encode($state)]);
    // Mark lobby as in match and broadcast launch signal
  $pdo->prepare("UPDATE lobbies SET status='in_match',updated_at=now() WHERE id=:l")->execute([':l'=>$lobbyId]);

  // ✅ NEW: notify both players to open the match page
  signal($pdo, $lobbyId, $userId, 'MATCH_LAUNCH');

  $pdo->commit();
  echo json_encode(['success'=>true]);
  exit;

/* ---------- POLL STATUS ---------- */
if($action==='match_status'){
  $b=load_battle($pdo,$lobbyId);
  if(!$b){echo json_encode(['success'=>true,'phase'=>'pregame','signals'=>fetch_signals($pdo,$lobbyId,$userId)]);exit;}
  $st=json_decode($b['state_json'],true)??[];
  $isP1=($b['p1_user_id']==$userId);
  $phase=($b['status']=='finished')?'finished':'active';
  $turn_is_me=(($st['turn']??'p1')==($isP1?'p1':'p2'));
  $round=(int)($st['round']??1);
  $idx=$round-1; $p1C=get_card($pdo,$st['p1']['deck'][$idx]??0); $p2C=get_card($pdo,$st['p2']['deck'][$idx]??0);
  $res=['success'=>true,'phase'=>$phase,'turn_is_me'=>$turn_is_me,
        'scores'=>['you'=>$isP1?($st['scores']['p1']??0):($st['scores']['p2']??0),
                   'opp'=>$isP1?($st['scores']['p2']??0):($st['scores']['p1']??0)],
        'current'=>['me'=>$isP1?$p1C:$p2C,'opponent'=>$isP1?$p2C:$p1C],
        'signals'=>fetch_signals($pdo,$lobbyId,$userId)];
  if($phase==='finished'){
     $p1s=(int)($st['scores']['p1']??0);$p2s=(int)($st['scores']['p2']??0);
     if($p1s==$p2s)$res['result_msg']="⚖️ It's a draw!"; elseif(($p1s>$p2s && $isP1)||($p2s>$p1s && !$isP1))$res['result_msg']="🎉 You win!"; else $res['result_msg']="💀 You lose!";
  }
  echo json_encode($res); exit;
}

/* ---------- CHOOSE STAT ---------- */
if($action==='choose_stat'){
  $in=json_decode(file_get_contents('php://input'),true)??[];
  $stat=$in['stat']??''; $col=statcol($stat);
  if(!$col){echo json_encode(['success'=>false,'error'=>'invalid_stat']);exit;}
  $b=load_battle($pdo,$lobbyId); if(!$b){echo json_encode(['success'=>false,'error'=>'no_battle']);exit;}
  $st=json_decode($b['state_json'],true)??[];
  $isP1=($b['p1_user_id']==$userId);
  $turn=$st['turn']??'p1';
  if($turn!=($isP1?'p1':'p2')){echo json_encode(['success'=>false,'error'=>'not_your_turn']);exit;}
  $r=(int)($st['round']??1); $idx=$r-1;
  $c1=get_card($pdo,$st['p1']['deck'][$idx]); $c2=get_card($pdo,$st['p2']['deck'][$idx]);
  $v1=(int)$c1[$col]; $v2=(int)$c2[$col];
  $winner='draw'; if($v1>$v2)$winner='p1'; elseif($v2>$v1)$winner='p2';
  if($winner=='p1')$st['scores']['p1']++; elseif($winner=='p2')$st['scores']['p2']++;
  $st['history'][]=['round'=>$r,'chosen_stat'=>$stat,'winner'=>$winner,'p1_card'=>$c1['display_name'],'p2_card'=>$c2['display_name']];
  $st['round']=$r+1; $st['turn']=($st['turn']=='p1')?'p2':'p1';
  $msg=($winner=='draw')?"Round $r: Draw!":(($winner=='p1')?"Round $r: Player 1 wins!":"Round $r: Player 2 wins!");
  /* ----- END MATCH AFTER 10 ROUNDS ----- */
  if($st['round']>10){
      $p1s=(int)$st['scores']['p1']; $p2s=(int)$st['scores']['p2'];
      $winUid=null; $res1='draw'; $res2='draw';
      if($p1s>$p2s){$winUid=(int)$b['p1_user_id'];$res1='win';$res2='loss';}
      elseif($p2s>$p1s){$winUid=(int)$b['p2_user_id'];$res1='loss';$res2='win';}
      $pdo->beginTransaction();
      try{
        persist($pdo,$b['id'],$st,'finished',$winUid);
        $bp1=has_bp($pdo,(int)$b['p1_user_id']); $bp2=has_bp($pdo,(int)$b['p2_user_id']);
        $calc=function($r,$bp){return['mp'=>($r=='win'?5:1),'lbp'=>($bp?($r=='win'?5:1):0)];};
        $rw1=$calc($res1,$bp1); $rw2=$calc($res2,$bp2);
        up_lb($pdo,(int)$b['p1_user_id'],$rw1['mp'],$rw1['lbp'],$res1==='win');
        up_lb($pdo,(int)$b['p2_user_id'],$rw2['mp'],$rw2['lbp'],$res2==='win');
        up_stats($pdo,(int)$b['p1_user_id'],'1v1_random',$res1==='win');
        up_stats($pdo,(int)$b['p2_user_id'],'1v1_random',$res2==='win');
        add_wallet($pdo,(int)$b['p1_user_id'],'1v1_random',$rw1['mp'],$rw1['lbp'],0,$res1);
        add_wallet($pdo,(int)$b['p2_user_id'],'1v1_random',$rw2['mp'],$rw2['lbp'],0,$res2);
        $pdo->commit();
      }catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();}
      $msg.=" Match finished!";
  }else{
      persist($pdo,$b['id'],$st,'active');
  }
  echo json_encode(['success'=>true,'result_msg'=>$msg,'scores'=>$st['scores']]); exit;
}

/* ---------- PLAY AGAIN / RETURN ---------- */
if(in_array($action,['play_again','return_lobby'])){
  signal($pdo,$lobbyId,$userId,strtoupper($action));
  if($action==='return_lobby'){
    $pdo->prepare("UPDATE lobbies SET status='open',updated_at=now() WHERE id=:l")->execute([':l'=>$lobbyId]);
    $pdo->prepare("UPDATE lobby_participants SET is_ready=false WHERE lobby_id=:l")->execute([':l'=>$lobbyId]);
  }
  echo json_encode(['success'=>true]); exit;
}

echo json_encode(['success'=>false,'error'=>'unknown_action']);
