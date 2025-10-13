// /var/www/tcg.backend/game_modes/1v1_random.js

const STAT_LABELS = {
  power_rating: "Power",
  health: "Health",
  attack: "Attack",
  sats: "SATS",
  size: "Size"
};

function imageUrl(path) {
  return `image.php?file=${encodeURIComponent(path)}`;
}

let elScore, elField, elRes, elP1, elP2, elInstr, btnAgain, btnLobby;
let lastPhase = null; // to avoid duplicate popups on same finish frame
let myTurn = false;

document.addEventListener("DOMContentLoaded", () => {
  elScore  = document.getElementById("scoreboard");
  elField  = document.getElementById("battlefield");
  elRes    = document.getElementById("roundResult");
  elP1     = document.getElementById("p1Card");
  elP2     = document.getElementById("p2Card");
  elInstr  = document.getElementById("instructions");
  btnAgain = document.getElementById("playAgain");
  btnLobby = document.getElementById("returnLobby");

  btnAgain.onclick = () => sendSignal("play_again");
  btnLobby.onclick = () => sendSignal("return_lobby");

  pollMatch();
});

async function pollMatch() {
  try {
    const r = await fetch(`/game_modes/1v1_random_api.php?action=match_status&lobby_id=${LOBBY_ID}`, {
      cache: "no-store",
      credentials: "same-origin"
    });
    const j = await r.json();

    if (j.success) {
      if (j.phase === "pregame") {
        elInstr.textContent = "Waiting for opponent…";
      }

      if (j.phase === "active") {
        elScore.style.display = "flex";
        elField.style.display = "flex";
        renderCards(j.current, j.turn_is_me);
        myTurn = !!j.turn_is_me;
        elInstr.textContent = myTurn ? "Your turn: choose a stat" : "Opponent’s turn…";

        if (j.result_msg) {
          alert(j.result_msg);
          elRes.textContent = j.result_msg;
        }
      }

      if (j.phase === "finished") {
        if (lastPhase !== "finished") {
          // Only alert once on transition to finished
          if (j.result_msg) alert(j.result_msg);
          elRes.textContent = j.result_msg || "Match finished.";
          document.getElementById("restartArea").style.display = "block";
        }
      }

      // Update score board whenever present
      if (j.scores) {
        document.getElementById("p1Wins").textContent = j.scores.you ?? 0;
        document.getElementById("p2Wins").textContent = j.scores.opp ?? 0;
      }

      lastPhase = j.phase;
    }
  } catch (e) {
    console.error("poll error", e);
  }
  setTimeout(pollMatch, 3000);
}

function renderCards(cur, canClick) {
  if (!cur) return;
  elP1.innerHTML = cardHtml(cur.me, canClick);
  elP2.innerHTML = cardHtml(cur.opponent, false);
}

function cardHtml(card, isClickable) {
  if (!card) return "";
  return `
    <div class="card">
      <div class="card-name">${card.display_name}</div>
      <img src="${imageUrl(card.card_image)}" class="card-image" alt="${card.display_name}">
      <div class="card-element">${card.animorph_type ?? ""}</div>
      <div class="card-stats">
        ${Object.keys(STAT_LABELS)
          .map((k) => {
            const row = `<div class="stat-row${isClickable ? "" : " disabled"}" data-stat="${k}">
              <strong>${STAT_LABELS[k]}</strong>: ${Number(card[k]).toLocaleString()}
            </div>`;
            return row;
          })
          .join("")}
      </div>
    </div>`;
}

document.addEventListener("click", (e) => {
  const row = e.target.closest(".stat-row");
  if (!row) return;
  if (!myTurn || row.classList.contains("disabled")) return;
  const stat = row.getAttribute("data-stat");
  chooseStat(stat);
});

async function chooseStat(stat) {
  try {
    const r = await fetch("/game_modes/1v1_random_api.php", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "choose_stat", lobby_id: LOBBY_ID, stat })
    });
    const j = await r.json();
    if (j.success) {
      if (j.result_msg) alert(j.result_msg);
      elRes.textContent = j.result_msg || "";
      if (j.scores) {
        document.getElementById("p1Wins").textContent = j.scores.p1 ?? j.scores.you ?? 0;
        document.getElementById("p2Wins").textContent = j.scores.p2 ?? j.scores.opp ?? 0;
      }
      myTurn = false; // after choosing, turn flips
    } else if (j.error) {
      alert(j.error);
    }
  } catch (e) {
    console.error("chooseStat error", e);
  }
}

async function sendSignal(type) {
  await fetch("/game_modes/1v1_random_api.php", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: type, lobby_id: LOBBY_ID })
  });
}
