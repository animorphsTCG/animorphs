let lobbyId = new URLSearchParams(window.location.search).get("lobby_id");
let intervalId = null;
let hasSubmittedStat = false;

const resultDiv = document.getElementById("result");
const yourCardDiv = document.getElementById("yourCard");
const oppCardDiv = document.getElementById("oppCard");
const scoreDiv = document.getElementById("score");
const statButtons = document.getElementById("statButtons");

function fetchMatchStatus() {
  fetch(`/game_modes/1v1_random_api.php?action=match_status&lobby_id=${lobbyId}`)
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        resultDiv.textContent = "Error: " + (data.error || "unknown");
        return;
      }

      if (data.phase === "pregame") {
        resultDiv.textContent = "Waiting for match to start...";
        return;
      }

      const cardMe = data.current.me;
      const cardOpp = data.current.opponent;
      yourCardDiv.innerHTML = renderCard(cardMe);
      oppCardDiv.innerHTML = renderCard(data.turn_is_me || data.phase === "finished" ? cardOpp : null);

      scoreDiv.textContent = `You: ${data.scores.you} | Opponent: ${data.scores.opp}`;

      if (data.phase === "finished") {
        resultDiv.innerHTML = `${data.result_msg || "Match complete."}`;
        statButtons.innerHTML = `
          <button onclick="sendSignal('play_again')">🔁 Play Again</button>
          <button onclick="sendSignal('return_lobby')">↩️ Return to Lobby</button>
        `;
        clearInterval(intervalId);
        return;
      }

      if (data.turn_is_me && !hasSubmittedStat) {
        resultDiv.textContent = "Your turn! Choose a stat.";
        renderStatButtons(cardMe);
      } else if (!data.turn_is_me && !hasSubmittedStat) {
        resultDiv.textContent = "Waiting for opponent's move...";
        statButtons.innerHTML = ""; // prevent stat selection
      }
    })
    .catch(err => {
      console.error("Fetch error:", err);
      resultDiv.textContent = "Network error.";
    });
}

function renderCard(card) {
  if (!card) return `<div class="card-back">Opponent Card</div>`;
  return `
    <div class="card">
      <img src="/image.php?file=${card.card_image}" alt="${card.display_name}" height="160">
      <h3>${card.display_name}</h3>
      <ul>
        <li>Power: ${card.power_rating}</li>
        <li>Health: ${card.health}</li>
        <li>Attack: ${card.attack}</li>
        <li>Sats: ${card.sats}</li>
        <li>Size: ${card.size}</li>
      </ul>
    </div>
  `;
}

function renderStatButtons(card) {
  const stats = ["power", "health", "attack", "sats", "size"];
  statButtons.innerHTML = stats.map(stat =>
    `<button onclick="chooseStat('${stat}')">${stat.toUpperCase()}</button>`
  ).join(" ");
}

function chooseStat(stat) {
  if (hasSubmittedStat) return;
  hasSubmittedStat = true;

  fetch(`/game_modes/1v1_random_api.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "choose_stat", lobby_id: lobbyId, stat })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        resultDiv.textContent = data.result_msg || "Stat chosen.";
        setTimeout(() => { hasSubmittedStat = false; }, 2000);
      } else {
        resultDiv.textContent = "Error: " + (data.error || "unknown");
        hasSubmittedStat = false;
      }
    });
}

function sendSignal(type) {
  fetch(`/game_modes/1v1_random_api.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: type, lobby_id: lobbyId })
  })
    .then(() => {
      if (type === "return_lobby") {
        window.location.href = "/lobbies/my_lobby.php";
      } else {
        window.location.reload();
      }
    });
}

window.onload = () => {
  fetchMatchStatus();
  intervalId = setInterval(fetchMatchStatus, 3000);
};
