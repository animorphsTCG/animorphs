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

document.addEventListener("DOMContentLoaded", () => {
  elScore = document.getElementById("scoreboard");
  elField = document.getElementById("battlefield");
  elRes = document.getElementById("roundResult");
  elP1 = document.getElementById("p1Card");
  elP2 = document.getElementById("p2Card");
  elInstr = document.getElementById("instructions");
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
        renderCards(j.current);
        elInstr.textContent = j.turn_is_me ? "Your turn: choose a stat" : "Opponent’s turn…";
      }

      if (j.phase === "finished") {
        elRes.textContent = j.result_msg || "Match finished.";
        if (j.result_msg) alert(j.result_msg);
        document.getElementById("restartArea").style.display = "block";
      }

      if (j.result_msg && j.phase !== "finished") {
        // Round result popup
        alert(j.result_msg);
      }
    }
  } catch (e) {
    console.error("poll error", e);
  }
  setTimeout(pollMatch, 3000);
}

function renderCards(cur) {
  if (!cur) return;
  elP1.innerHTML = cardHtml(cur.me, true);
  elP2.innerHTML = cardHtml(cur.opponent, false);
}

function cardHtml(card, isMe) {
  if (!card) return "";
  const clickAttr = isMe ? 'class="stat-row" onclick="chooseStat(this.dataset.stat)"' : "";
  return `<div class="card">
    <div class="card-name">${card.display_name}</div>
    <img src="${imageUrl(card.card_image)}" class="card-image">
    <div class="card-stats">
      ${Object.keys(STAT_LABELS)
        .map(
          (k) =>
            `<div data-stat="${k}" ${clickAttr}><strong>${STAT_LABELS[k]}</strong>: ${
              card[k]
            }</div>`
        )
        .join("")}
    </div>
  </div>`;
}

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
      updateScores(j.scores);
    } else if (j.error) {
      alert(j.error);
    }
  } catch (e) {
    console.error("chooseStat error", e);
  }
}

function updateScores(sc) {
  if (!sc) return;
  document.getElementById("p1Wins").textContent = sc.you ?? 0;
  document.getElementById("p2Wins").textContent = sc.opp ?? 0;
}

async function sendSignal(type) {
  await fetch("/game_modes/1v1_random_api.php", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: type, lobby_id: LOBBY_ID })
  });
}
