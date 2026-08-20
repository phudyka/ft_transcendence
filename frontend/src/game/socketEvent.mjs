import { ball, gameState, sounds } from "./main.mjs";
import { hidePanel, showPanel } from "./panels.mjs";

// Deux lignes : le message, puis un décompte dont le nombre est le seul nœud
// qui change.
function setMatchInfo(container, message, label, seconds) {
  container.textContent = "";
  const line = document.createElement("p");
  line.textContent = message;
  const timer = document.createElement("p");
  timer.append(`${label} `);
  const count = document.createElement("span");
  count.id = "countdown";
  // Le conteneur est une région vive : sans cela, un décompte de cinq secondes
  // produisait cinq annonces successives. La phrase est dite une fois, le
  // nombre qui défile ne l'est pas.
  count.setAttribute("aria-hidden", "true");
  count.textContent = seconds;
  timer.append(count, " seconds…");
  container.append(line, timer);
}

export function initSocketEvent(socket) {
  // `hitPadEvent` et `SoundLobby` étaient deux fonctions exportées pour un
  // écouteur chacune, appelées juste après celle-ci.
  socket.on("hitPad", () => {
    sounds.stop("pong");
    sounds.play("pong");
  });

  socket.on("lobby", () => {
    sounds.play("woosh");
    sounds.play("lobby");
  });

  socket.on("initBall", (data) => {
    ball.mesh.position.x = data.position.x;
    ball.mesh.position.z = data.position.z;
  });

  socket.on("moveBall", (data) => {
    ball.mesh.position.x = data.position.x;
    ball.mesh.position.z = data.position.z;
    ball.speed = data.speed;
  });

  socket.on("updateScores", (scores) => {
    const scoreLeft = document.getElementById("scoreLeft");
    const scoreRight = document.getElementById("scoreRight");

    scoreLeft.textContent = scores.score1;
    scoreRight.textContent = scores.score2;
    // Le bandeau est trois nœuds séparés : lu tel quel, chaque but annonçait un
    // nombre nu. La phrase dit qui mène, et de combien.
    document.getElementById("score-announce").textContent =
      `Orange ${scores.score1}, blue ${scores.score2}`;
    sounds.play("goal");

    scoreLeft.classList.add("pop-animation");
    scoreRight.classList.add("pop-animation");

    setTimeout(() => {
      scoreLeft.classList.remove("pop-animation");
      scoreRight.classList.remove("pop-animation");
    }, 300);
  });

  // Un bouton de menu, un événement. `LeaveRoom` a disparu avec ce bloc :
  // aucun serveur ne l'émettait, et son corps émettait `disconnect` côté
  // client, ce que socket.io ignore.
  const MENU_EMITS = {
    "solo-ia": "solo_vs_ia",
    "multi-2-local": "multi-2-local",
    "multi-2-online": "multi-2-online",
    "multi-four": "multi-four",
    "multi-tournament": "return-list",
    "create-tournament": "create-tournament",
    "quit-tournament": "quit-tournament",
  };

  for (const [id, event] of Object.entries(MENU_EMITS)) {
    document.getElementById(id).addEventListener(
      "click",
      () => socket.emit(event),
    );
  }

  // Quel panneau chaque bouton ferme et lequel il ouvre. C'était un
  // `<script>` en ligne dans game.html, qui doublonnait la table ci-dessus et
  // gardait trois blocs commentés.
  const MENU_NAV = {
    "solo-ia": ["menu", null],
    "multi-button": ["menu", "multi"],
    "multi-back-button": ["multi", "menu"],
    "multi-tournament": ["multi", "tournament"],
    "tournament-back-button": ["tournament", "multi"],
    "create-tournament": ["tournament", null],
    "multi-2-local": ["multi", null],
    "multi-2-online": ["multi", "waiting"],
    "multi-four": ["multi", "waiting"],
  };

  for (const [id, [close, open]] of Object.entries(MENU_NAV)) {
    document.getElementById(id).addEventListener("click", () => {
      hidePanel(close);
      if (open) showPanel(open);
    });
  }

  document.getElementById("back").addEventListener("click", () => {
    stopWaitingTimer();
    showPanel("multi");
    hidePanel("waiting");
    socket.emit("cancel");
  });

  // L'attente n'avait aucun repère : ni durée écoulée, ni idée de ce qu'on
  // attend. Sans joueur en ligne, c'était un spinner sans fin.
  let waitingTimer = null;

  function startWaitingTimer() {
    stopWaitingTimer();
    const line = document.getElementById("waiting-elapsed");
    let seconds = 0;
    line.textContent = "Waiting for 0 s";
    waitingTimer = setInterval(() => {
      seconds += 1;
      line.textContent = seconds < 30
        ? `Waiting for ${seconds} s`
        : `Waiting for ${seconds} s — nobody else is online right now. Solo against the AI is one menu away.`;
    }, 1000);
  }

  function stopWaitingTimer() {
    clearInterval(waitingTimer);
    waitingTimer = null;
  }

  for (const id of ["multi-2-online", "multi-four"]) {
    document.getElementById(id).addEventListener("click", startWaitingTimer);
  }

  // Le compteur s'arrête quand la partie commence, pas quand le panneau
  // disparaît : `start-game` est traité dans main.mjs, l'intervalle survivrait.
  socket.on("start-game", stopWaitingTimer);

  let pendingInvite = null;

  socket.on("invite", (data) => {
    pendingInvite = data;
    document.getElementById("invite-text").textContent =
      `${data.from} invited you to a game.`;
    // La fenêtre pour répondre est courte : l'invitation prend le focus, et
    // `role="alert"` la fait annoncer.
    showPanel("invite");
  });

  function answerInvite(event) {
    return () => {
      if (pendingInvite) {
        socket.emit(event, { from: pendingInvite.from, to: pendingInvite.to });
      }
      pendingInvite = null;
      document.getElementById("invite").classList.add("hidden");
    };
  }

  document.getElementById("accept").addEventListener(
    "click",
    answerInvite("accept"),
  );
  document.getElementById("cancel").addEventListener(
    "click",
    answerInvite("refuse"),
  );

  // Les deux avis « ça n'a pas marché » n'ont jamais différé que par leur texte.
  // Deux refus coup sur coup : le timer du premier masquait le second avant
  // qu'il ait été lu.
  let noticeTimer = null;

  function flashNotReady(text) {
    document.getElementById("not-ready-text").textContent = text;
    document.getElementById("notReady").classList.remove("hidden");
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(
      () => document.getElementById("notReady").classList.add("hidden"),
      3000,
    );
  }

  socket.on("refuse-invit", (data) => {
    flashNotReady(`${data.to} declined your invitation.`);
  });

  socket.on("not-ready", (data) => {
    flashNotReady(`${data.from} is not available right now.`);
  });

  socket.on("tournament-list", (tournamentList) => {
    const tournamentMenu = document.getElementById("tournament-list");
    tournamentMenu.innerHTML = "";

    if (tournamentList.length === 0) {
      const empty = document.createElement("li");
      empty.className = "tournament-empty";
      empty.textContent = "No tournament yet — create one below.";
      tournamentMenu.appendChild(empty);
      return;
    }

    tournamentList.forEach((roomName) => {
      const listItem = document.createElement("li");
      const join = document.createElement("button");
      join.type = "button";
      join.className = "tournament-item";
      join.textContent = roomName;
      join.addEventListener("click", () => {
        socket.emit("join-tournament", { roomName });
      });
      listItem.appendChild(join);
      tournamentMenu.appendChild(listItem);
    });
  });

  socket.on("tournament-created", () => {
    displayTournamentPage();
  });

  socket.on("tournament-updated", (socketIds) => {
    displayTournamentPage(socketIds);
  });

  // L'écouteur était posé à chaque `tournament-full` : au deuxième tournoi
  // d'une même session, `player_ready` partait en double. Il est posé une
  // fois, et l'invite elle-même sert de bouton là où il n'y a pas de clavier.
  const space = document.getElementById("space");

  function readyUp() {
    if (space.classList.contains("hidden")) return;
    socket.emit("player_ready");
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === " " && !event.repeat) readyUp();
  });

  space.addEventListener("click", readyUp);

  socket.on("tournament-full", () => {
    space.classList.remove("hidden");
    // C'est le bouton qui lance le match : au clavier comme au doigt, il doit
    // être là où l'on agit.
    space.focus();
  });

  function displayTournamentPage(data) {
    document.getElementById("tournament").classList.add("hidden");
    document.getElementById("quit-tournament").classList.remove("hidden");
    document.getElementById("tournament-details").classList.remove("hidden");
    document.getElementById("tournament-details").classList.add("flex");
    // `tournament-created` n'a pas encore de liste de joueurs.
    const room = data?.room ?? [];
    for (let i = 0; i < 4; i++) {
      document.getElementById(`player-${i + 1}`).textContent = room[i] ?? "";
    }
  }

  socket.on("match-info", (data) => {
    const matchInfoDiv = document.getElementById("match-info");
    document.getElementById("match-info").classList.remove("hidden");
    document.getElementById("quit-tournament").classList.add("hidden");

    setMatchInfo(matchInfoDiv, data.message, "Match starts in", data.countdown);

    startCountdown(data.countdown, () => {
      matchInfoDiv.innerHTML = "";
      document.getElementById("match-info").classList.add("hidden");
    });
  });

  socket.on("update tournament", (winner) => {
    if (winner.length === 2) {
      const winner1 = winner[0];
      const winner2 = winner[1];
      updateSemiFinal(winner1, winner2);
    } else if (winner.length === 1) {
      updateFinal(winner[0]);
    }
  });

  function updateSemiFinal(winner1, winner2) {
    const player1 = document.getElementById("player-1").textContent;
    const player2 = document.getElementById("player-2").textContent;
    const player3 = document.getElementById("player-3").textContent;
    const player4 = document.getElementById("player-4").textContent;

    const gagnant1 = document.getElementById("Gagnant-1");
    const gagnant2 = document.getElementById("Gagnant-2");

    if (winner1 === player1 || winner1 === player2) {
      gagnant1.textContent = winner1;
    } else if (winner1 === player3 || winner1 === player4) {
      gagnant2.textContent = winner1;
    }

    if (winner2 === player1 || winner2 === player2) {
      gagnant1.textContent = winner2;
    } else if (winner2 === player3 || winner2 === player4) {
      gagnant2.textContent = winner2;
    }
  }

  function updateFinal(winner) {
    sounds.play("endTournament");
    const matchInfoDiv = document.getElementById("match-info");
    document.getElementById("match-info").classList.remove("hidden");
    const gagnantFinale = document.getElementById("Gagnant-Finale");
    gagnantFinale.textContent = winner;
    let countdown = 5;
    setMatchInfo(
      matchInfoDiv,
      `${winner} wins the tournament`,
      "Back to the menu in",
      countdown,
    );

    startCountdown(countdown, () => {
      matchInfoDiv.innerHTML = "";
      document.getElementById("match-info").classList.add("hidden");
      document.getElementById("tournament-details").classList.add("hidden");
      document.getElementById("tournament-details").classList.remove("flex");
      showPanel("menu");
      for (const id of ["player-1", "player-2", "player-3", "player-4"]) {
        document.getElementById(id).textContent = "";
      }
      for (const id of ["Gagnant-1", "Gagnant-2", "Gagnant-Finale"]) {
        document.getElementById(id).textContent = "";
      }
      sounds.stop("endTournament");
      sounds.play("lobby");
      sounds.stop("ambient");
      sounds.stop("inGame");
      gameState.choice = false;
      socket.emit("quit-tournament", gagnantFinale);
    });
  }
}

// `#countdown` n'a qu'un propriétaire. Les deux décomptes du tournoi — celui
// d'avant-match et celui de la fin — écrivaient chacun dans ce nœud depuis un
// intervalle que personne ne gardait : une finale annoncée pendant que le
// décompte précédent courait encore faisait tomber le chiffre de deux par
// seconde, et le premier des deux masquait `#match-info` sous le second.
let countdownTimer = null;

function startCountdown(seconds, onDone) {
  clearInterval(countdownTimer);
  let remaining = seconds;
  countdownTimer = setInterval(() => {
    remaining--;
    document.getElementById("countdown").innerText = remaining;
    if (remaining > 0) return;
    clearInterval(countdownTimer);
    countdownTimer = null;
    onDone();
  }, 1000);
}
