const STAT_LABELS = {
  power_rating: "Power",
  health: "Health",
  attack: "Attack",
  sats: "Sats",
  size: "Size"
};

function imageUrl(path) {
  return `image.php?file=${encodeURIComponent(path)}`;
}

let btnPlay, btnAgain, elScore, elField, elInstr, elResult, elPlayerStats, elAIStats;

document.addEventListener("DOMContentLoaded", () => {
  btnPlay = document.getElementById("playDemo");
  btnAgain = document.getElementById("playAgain");
  elScore = document.getElementById("scoreboard");
  elField = document.getElementById("battlefield");
  elInstr = document.getElementById("instructions");
  elResult = document.getElementById("roundResult");
  elPlayerStats = document.getElementById("playerStats");
  elAIStats = document.getElementById("aiStats");

  btnPlay.addEventListener("click", startMatch);
  btnAgain.addEventListener("click", () => location.reload());
});

async function startMatch() {
  disableAll(true);
  try {
    const res = await fetch("demo_api.php");
    const data = await res.json();
    if (data.status !== "ok") throw new Error("Failed to start match.");

    elScore.style.display = "flex";
    elField.style.display = "flex";
    document.getElementById("startArea").style.display = "none";
    document.getElementById("restartArea").style.display = "none";

    renderPlayerCard(data.user_card);
    renderAICardBack(data.ai_card_back || "card-back.png");
    updateScores(data.playerWins, data.aiWins);

    if (data.round % 2 === 0) {
      elResult.textContent = `Round ${data.round}: Opponent choosing a statistic...`;
      setTimeout(() => playRound(data.ai_choice), 2000 + Math.random() * 1000);
    } else {
      elResult.textContent = `Round ${data.round}: Choose a stat to play`;
    }
  } catch (err) {
    console.error(err);
    alert("Failed to start match");
  }
  disableAll(false);
}

function renderPlayerCard(card) {
  elPlayerStats.innerHTML = `
    <div class="card">
      <div class="card-name">${card.display_name}</div>
      <img src="${imageUrl(card.card_image)}" alt="${card.display_name}" class="card-image">
      <div class="card-element">${card.element ?? ""}</div>
      <div class="card-stats">
        ${Object.keys(STAT_LABELS).map(k => `
          <div class="stat-row" data-stat="${k}">
            <strong>${STAT_LABELS[k]}</strong>: ${card[k].toLocaleString()}
          </div>`).join("")}
      </div>
    </div>
  `;
  elPlayerStats.querySelectorAll(".stat-row").forEach(row => {
    row.addEventListener("click", () => playRound(row.getAttribute("data-stat")));
  });
}

function renderAICardBack(path) {
  elAIStats.innerHTML = `
    <div class="card card-back-only">
      <img src="${imageUrl(path)}" alt="Card Back" class="card-back-image">
    </div>
  `;
}

function renderAICard(card) {
  elAIStats.innerHTML = `
    <div class="card">
      <div class="card-name">${card.display_name}</div>
      <img src="${imageUrl(card.card_image)}" alt="${card.display_name}" class="card-image">
      <div class="card-element">${card.element ?? ""}</div>
      <div class="card-stats">
        ${Object.keys(STAT_LABELS).map(k => `
          <div class="stat-row">
            <strong>${STAT_LABELS[k]}</strong>: ${card[k].toLocaleString()}
          </div>`).join("")}
      </div>
    </div>
  `;
}

async function playRound(stat) {
  disableAll(true);
  try {
    const res = await fetch("demo_api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stat })
    });
    const data = await res.json();
    if (data.status !== "ok") throw new Error("API error");

    renderAICard(data.ai_card);
    document.querySelectorAll(".stat-row").forEach(row => row.classList.add("disabled"));

    let msg = "Draw";
    if (data.winner === "player") msg = "You win this round!";
    if (data.winner === "ai") msg = "AI wins this round!";
    elResult.textContent = `Round ${data.round}: ${STAT_LABELS[stat]} — ${msg}`;
    updateScores(data.playerWins, data.aiWins);

    if (data.result) {
      const finalMsg = data.result === "player" ? "🎉 You won the match!" :
                       data.result === "ai" ? "💀 AI won the match!" :
                       "⚖️ It's a draw!";
      elResult.textContent = `🏁 ${finalMsg}`;
      document.getElementById("restartArea").style.display = "block";
    } else {
      setTimeout(startMatch, 2000);
    }
  } catch (err) {
    console.error(err);
    alert("Error processing round.");
  }
  disableAll(false);
}

function updateScores(p, a) {
  document.getElementById("playerWins").textContent = p ?? 0;
  document.getElementById("aiWins").textContent = a ?? 0;
}

function disableAll(state) {
  const container = document.querySelector(".container");
  if (state) container.classList.add("disabled");
  else container.classList.remove("disabled");
}
