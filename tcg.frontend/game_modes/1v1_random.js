let round = 0;
let myWins = 0, oppWins = 0;

document.getElementById("startBtn").addEventListener("click", () => {
  fetch(`/game_modes/1v1_random_api.php?lobby_id=${lobbyId}`)
    .then(r => r.json())
    .then(d => {
      if (d.status === "ok") {
        document.getElementById("startArea").style.display="none";
        document.getElementById("scoreboard").style.display="block";
        document.getElementById("battlefield").style.display="flex";
        round = d.round;
        loadChat();
      } else { alert(d.message); }
    });
});

function playRound(stat){
  fetch(`/game_modes/1v1_random_api.php?lobby_id=${lobbyId}`, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({stat})
  })
  .then(r=>r.json()).then(d=>{
    if(d.status==="ok"){
      round=d.round;
      if(d.winner){
        if(d.winner===d.me){ myWins++; } else { oppWins++; }
      }
      document.getElementById("myWins").innerText=myWins;
      document.getElementById("oppWins").innerText=oppWins;
      document.getElementById("roundResult").innerText = d.winner ? `Round winner: ${d.winner}` : "Draw!";
    }
    else if(d.status==="done"){
      document.getElementById("roundResult").innerText = `Game over! Result: ${d.result}`;
      document.getElementById("restartArea").style.display="block";
    }
  });
}

// ---- Chat logic ----
function loadChat(){
  fetch(`/lobbies/get_messages.php?lobby_id=${lobbyId}`)
    .then(r=>r.json())
    .then(msgs=>{
      const box=document.getElementById("chatMessages");
      box.innerHTML="";
      msgs.forEach(m=>{
        const div=document.createElement("div");
        div.textContent = `${m.username}: ${m.message}`;
        box.appendChild(div);
      });
      box.scrollTop = box.scrollHeight;
    });
}
setInterval(loadChat, 3000);

document.getElementById("sendChat").addEventListener("click",()=>{
  const val=document.getElementById("chatInput").value.trim();
  if(!val) return;
  fetch(`/lobbies/send_message.php`,{
    method:"POST",
    headers:{"Content-Type":"application/x-www-form-urlencoded"},
    body:`lobby_id=${lobbyId}&message=${encodeURIComponent(val)}`
  }).then(()=>{ document.getElementById("chatInput").value=""; loadChat(); });
});
