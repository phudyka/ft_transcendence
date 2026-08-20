import { announceRoute, navigateTo } from "../app.js";
import { logout } from "../utils/token.js";
import { getSocket, initializeSocket } from "../utils/socketManager.js";
import {
  acceptFriendRequest,
  rejectFriendRequest,
  sendFriendRequest,
} from "../utils/friendManager.js";
import { removeLoginEventListeners } from "./login.js";
import { setBusy, showToast } from "../utils/feedback.js";
import { checkFriendshipStatus } from "./profile.js";
import { sendFriendRequestSocket } from "../utils/socketManager.js";
import { html, raw } from "../utils/html.js";
import { CHECK_ICON, CROSS_ICON, SEND_ICON } from "../utils/icons.js";
import { fetchWithToken } from "../utils/api.js";

let socket;
const privateMessages = new Map();
const blockedUsers = new Set();
let activePrivateChat = null;

// Le tiroir de chat privé était un `bootstrap.Offcanvas`. Ouvert par
// `showModal()`, un `<dialog>` apporte le voile, la fermeture par Échap et le
// piège à focus, et son bouton de fermeture est un `<form method="dialog">`.
// Il tient aussi son propre état : plus de classe `.show` à interroger.
const isDrawerOpen = () => document.getElementById("chatbox")?.open === true;

export async function dashboard() {
  // Le routeur ne sert cette vue qu'à une session ouverte, et le garde sur
  // `displayName` plus bas rattrape le reste. `checkAuthentication()` posait
  // par-dessus un POST /api/verify-token/ dont n'importe quel appel authentifié
  // donne déjà la réponse par un 401 — un aller-retour avant chaque affichage.
  removeLoginEventListeners();

  const displayName = sessionStorage.getItem("display_name");
  let avatarUrl = sessionStorage.getItem("avatar_url");

  // `initializeSocket` pose lui-même les écouteurs de chat : tout chemin de
  // reconnexion en hérite, y compris celui de `sendMessage`, qui recréait un
  // socket muet — on pouvait écrire, plus rien n'arrivait, sans un signe.
  socket = getSocket();
  if (!socket || !socket.connected) {
    socket = initializeSocket(displayName);
  } else {
    setupChatListeners(socket);
  }

  if (!displayName) {
    navigateTo("/login");
    return;
  }

  if (avatarUrl) {
    avatarUrl = avatarUrl.replace(/^url\(["']?/, "").replace(/["']?\)$/, "");
  }

  document.getElementById("ft_transcendence").innerHTML = html`
    <div class="dashboard-container">
      <header class="header">
        <img
          src="/brand/logo2.png"
          alt=""
          class="logo"
          width="50"
          height="50"
        >
        <h1 class="header-title">ft_transcendence</h1>
        <div class="header-actions">
          <button
            type="button"
            id="focus-game"
            class="focus-toggle"
            aria-pressed="false"
          >
            Focus the game
          </button>
          <span class="header-name">${displayName}</span>
          <button
            type="button"
            id="img_profile_pic_button"
            class="avatar-button"
            aria-haspopup="menu"
            aria-expanded="false"
            aria-label="Account menu"
          >
            <img
              src="${avatarUrl}"
              class="profile-icon"
              alt=""
              id="img_profile_pic"
              width="50"
              height="50"
            >
          </button>
        </div>
      </header>

      <div class="content">
        <nav class="sidebar" aria-label="Friends">
          <form id="addFriendForm" class="add-friend">
            <label class="visually-hidden" for="addFriendInput">
              Add a friend by name
            </label>
            <input
              type="text"
              id="addFriendInput"
              class="field-input"
              placeholder="Add a friend by name"
              autocomplete="off"
            >
            <button type="submit" class="btn btn-primary" id="addFriendButton">
              Add
            </button>
          </form>
          <div class="friends-tabs" role="tablist" aria-label="Friend lists">
            <button
              class="tab-button active"
              role="tab"
              id="tab-online"
              aria-controls="online"
              aria-selected="true"
              data-tab="online"
            >
              Friends
            </button>
            <button
              class="tab-button"
              role="tab"
              id="tab-pending"
              aria-controls="pending"
              aria-selected="false"
              tabindex="-1"
              data-tab="pending"
            >
              Pending Requests
            </button>
            <button
              class="tab-button"
              role="tab"
              id="tab-blocked"
              aria-controls="blocked"
              aria-selected="false"
              tabindex="-1"
              data-tab="blocked"
            >
              Blocked Users
            </button>
          </div>
          <div class="friends-content">
            <div
              id="online"
              class="tab-content active"
              role="tabpanel"
              aria-labelledby="tab-online"
              tabindex="0"
            >
              <ul id="online-friends" class="list-group"></ul>
            </div>
            <div
              id="pending"
              class="tab-content"
              role="tabpanel"
              aria-labelledby="tab-pending"
              tabindex="0"
            >
              <ul id="pending-friends" class="list-group"></ul>
            </div>
            <div
              id="blocked"
              class="tab-content"
              role="tabpanel"
              aria-labelledby="tab-blocked"
              tabindex="0"
            >
              <ul id="blocked-friends" class="list-group"></ul>
            </div>
          </div>
          <div id="friendDropdown" class="dropdown-menu" role="menu" hidden>
            <button
              type="button"
              class="dropdown-item"
              role="menuitem"
              id="sendMessagePrivate"
            >
              Send Private Message
            </button>
            <button
              type="button"
              class="dropdown-item"
              role="menuitem"
              id="startGame"
            >
              Start a Game
            </button>
            <button
              type="button"
              class="dropdown-item view-profile"
              role="menuitem"
            >
              View Profile
            </button>
          </div>
          <div
            id="friendDropdown_chat"
            class="dropdown-menu_chat"
            role="menu"
            hidden
          >
            <button
              type="button"
              class="dropdown-item"
              role="menuitem"
              id="addToFriend"
            >
              Add To Friend
            </button>
            <button
              type="button"
              class="dropdown-item"
              role="menuitem"
              id="blockUser"
            >
              Block User
            </button>
            <button
              type="button"
              class="dropdown-item view-profile"
              role="menuitem"
            >
              View Profile
            </button>
          </div>
        </nav>

        <main class="game-container">
          <h2 class="visually-hidden">Game</h2>
          <iframe id="pong" title="Pong game" src="/game.html"></iframe>
        </main>

        <aside class="chat-container" aria-labelledby="chat-title">
          <h2 class="title-chat" id="chat-title">Chat</h2>
          <div
            class="chat-log"
            id="chat-log"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
          >
          </div>
          <div class="input-container">
            <label class="visually-hidden" for="message-input"
            >Message to send to the general chat</label>
            <input
              type="text"
              id="message-input"
              placeholder="Type your message…"
              autocomplete="off"
            >
            <button type="button" id="send-button" aria-label="Send message">
              ${raw(SEND_ICON)}
            </button>
          </div>
        </aside>
      </div>
      <div id="profileDropdown" class="dropdown-menu" role="menu" hidden>
        <button
          type="button"
          class="dropdown-item"
          role="menuitem"
          id="viewmyProfile"
        >
          My Profile
        </button>
        <button type="button" class="dropdown-item" role="menuitem" id="settings">
          Settings
        </button>
        <button type="button" class="dropdown-item" role="menuitem" id="logoutLink">
          Logout
        </button>
      </div>
      <dialog id="chatbox" class="drawer" aria-labelledby="chatboxLabel">
        <form method="dialog" class="drawer-header">
          <button type="submit" class="btn-close" aria-label="Close"></button>
        </form>
        <div class="drawer-body">
          <div id="private-chats-container"></div>
        </div>
      </dialog>

      <footer id="footer-dashboard">
        ft_transcendence — a 3D Pong by phudyka
      </footer>
    </div>
  `;
  // Le jeu est servi par le même hôte : il lit la session lui-même,
  // plus besoin de la lui transmettre par postMessage.

  setupDashboardEvents(navigateTo);
  setupTabSystem();
  fetchAndDisplayFriends();
  loadGeneralChatMessages();
  showChatPlaceholder();
  announceRoute("Dashboard");
}

export function setupChatListeners(socket) {
  if (socket) {
    // Suppression des anciens écouteurs pour éviter les doublons
    socket.off("private message");
    socket.off("chat message");

    // Écoute des messages de chat général
    socket.on("chat message", (msg) => {
      receiveMessage(msg);
    });

    socket.on("private message", (msg) => {
      if (!msg.from || !msg.message) {
        console.error("Invalid message format:", msg);
        return;
      }

      const currentUser = sessionStorage.getItem("display_name");

      // Nouvelle logique pour déterminer le chatPartner
      let chatPartner;
      if (msg.isSelf) {
        chatPartner = activePrivateChat;
      } else {
        chatPartner = msg.from;
      }

      if (!chatPartner) {
        console.error("Cannot determine chat partner:", msg);
        return;
      }

      // Ne basculer que si le tiroir est fermé : sinon on écrase la
      // conversation ouverte et ce qui était en train d'être tapé.
      if (activePrivateChat !== chatPartner && !isDrawerOpen()) {
        setupPrivateChat(chatPartner);
      }

      // Stocker le message
      if (!privateMessages.has(chatPartner)) {
        privateMessages.set(chatPartner, []);
      }
      privateMessages.get(chatPartner).push({
        sender: msg.from,
        content: msg.message,
        isSelf: msg.isSelf,
      });

      // Afficher le message
      if (activePrivateChat === chatPartner) {
        displayPrivateMessage(
          chatPartner,
          msg.isSelf ? "Vous" : msg.from,
          msg.message,
        );
      }

      const shown = activePrivateChat === chatPartner && isDrawerOpen();
      if (
        !msg.isSelf && msg.from !== currentUser &&
        !blockedUsers.has(msg.from) && !shown
      ) {
        showToast(`New message from ${msg.from}`, "info");
      }
    });

    socket.on("friend_request_received", (data) => {
      // Déjà affichée par le rafraîchissement périodique ?
      if (document.querySelector(`[data-request-id="${data.requestId}"]`)) {
        return;
      }

      const pendingFriendsList = document.getElementById("pending-friends");
      if (pendingFriendsList) {
        addPendingRequest(pendingFriendsList, data.requestId, data.from);
        document.querySelector('[data-tab="pending"]')?.click();
      }
    });

    // `friend_request_updated` est déjà écouté dans socketManager.js : le
    // doublon affichait deux toasts et déclenchait deux rafraîchissements.

    socket.on("friend_status_change", () => {
      fetchAndDisplayFriends();
    });
  }
}

function setupDashboardEvents(navigateTo) {
  //Logout
  document.getElementById("logoutLink").addEventListener("click", handleLogout);

  // Les lignes d'amis sont créées par `createFriendListItem`, qui pose son
  // propre écouteur : ce sélecteur `#friends` ne correspondait à rien.

  // Profile picture dropdown
  document.getElementById("img_profile_pic_button").addEventListener(
    "click",
    handleProfilePictureClick,
  );

  // Hide the dropdown menu when clicking outside of it
  document.addEventListener("click", hideDropdowns);
  document.addEventListener("keydown", handleDropdownKeydown);

  // Prevent the dropdown menu from closing when clicking inside it
  document.getElementById("friendDropdown").addEventListener(
    "click",
    (event) => event.stopPropagation(),
  );
  document.getElementById("friendDropdown_chat").addEventListener(
    "click",
    (event) => event.stopPropagation(),
  );
  document.getElementById("profileDropdown").addEventListener(
    "click",
    (event) => event.stopPropagation(),
  );
  const displayName = sessionStorage.getItem("display_name");
  document.getElementById("viewmyProfile").addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      navigateTo(`/profile/${displayName}`);
    },
  );

  // Dropdown actions
  document.getElementById("sendMessagePrivate").addEventListener(
    "click",
    showChatbox,
  );
  document.getElementById("startGame").addEventListener("click", startGame);
  document.getElementById("settings").addEventListener("click", goTosettings);

  // La seule entrée dans le graphe social passait par un pseudo cliqué dans le
  // chat général : il fallait qu'un inconnu parle avant de pouvoir l'ajouter.
  document.getElementById("addFriendForm").addEventListener(
    "submit",
    addFriendByName,
  );

  // Deux colonnes de 150 px prenaient 30 % de la largeur en permanence, devant
  // la scène 3D qui est le sujet de la page.
  document.getElementById("focus-game").addEventListener(
    "click",
    toggleGameFocus,
  );

  // Chat functionnalitis
  document.getElementById("send-button").addEventListener("click", sendMessage);

  // Send message when pressing Enter key
  document.addEventListener("keydown", handleEnterKey);

  //View profile
  document.querySelectorAll(".view-profile").forEach((item) =>
    item.addEventListener("click", viewProfile)
  );

  // Friend actions
  document.getElementById("friendDropdown_chat").querySelector("#addToFriend")
    .addEventListener("click", addFriend);
  document.getElementById("friendDropdown_chat").querySelector("#blockUser")
    .addEventListener("click", blockUser);

  // Rafraîchissement de la liste d'amis. C'était 3 requêtes toutes les 3 s —
  // 60 par minute et par onglet vers une API en tier gratuit, alors que le
  // commentaire annonçait 30 s. Onglet caché : on ne sonde pas.
  window.fetchFriendsInterval = setInterval(() => {
    if (!document.hidden) fetchAndDisplayFriends();
  }, 15000);
}

// Affiche `dropdown` sous son déclencheur, replié dans la fenêtre s'il déborde.
// Le positionnement partait de `event.clientX/Y` : au clavier ces coordonnées
// valent 0 et le menu atterrissait dans le coin de l'écran.
function showDropdownAt(dropdown, trigger, friendName = null) {
  hideDropdowns();
  dropdown.style.position = "fixed";
  dropdown.hidden = false;

  const anchor = trigger.getBoundingClientRect();
  const rect = dropdown.getBoundingClientRect();
  dropdown.style.top = `${
    Math.min(anchor.bottom + 4, window.innerHeight - rect.height)
  }px`;
  dropdown.style.left = `${
    Math.min(anchor.left, window.innerWidth - rect.width)
  }px`;

  if (friendName !== null) dropdown.dataset.friend = friendName;

  openDropdown = dropdown;
  dropdownTrigger = trigger;
  trigger.setAttribute("aria-expanded", "true");
  dropdown.querySelector(".dropdown-item:not(:disabled)")?.focus();
}

// Le menu ouvert et ce qui l'a ouvert, pour rendre le focus à la fermeture.
let openDropdown = null;
let dropdownTrigger = null;

function handleProfilePictureClick(event) {
  event.stopPropagation();
  showDropdownAt(
    document.getElementById("profileDropdown"),
    event.currentTarget,
  );
}

// Échap referme et rend le focus au déclencheur ; sans cela le focus restait
// dans un menu invisible.
function handleDropdownKeydown(event) {
  if (!openDropdown) return;

  if (event.key === "Escape") {
    const trigger = dropdownTrigger;
    hideDropdowns();
    trigger?.focus();
    return;
  }

  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  event.preventDefault();
  const items = [...openDropdown.querySelectorAll(".dropdown-item")]
    .filter((item) => !item.disabled);
  const current = items.indexOf(document.activeElement);
  const step = event.key === "ArrowDown" ? 1 : -1;
  items[(current + step + items.length) % items.length].focus();
}

function handleFriendClick(event) {
  // « Start a Game » restait proposé — et annonçait « Invitation sent » — pour
  // un ami hors ligne, alors que la pastille d'état est sur la même ligne.
  const online = event.currentTarget.dataset.online === "1";
  const startItem = document.getElementById("startGame");
  startItem.disabled = !online;
  startItem.setAttribute("aria-disabled", String(!online));
  startItem.textContent = online ? "Start a Game" : "Start a Game (offline)";

  event.stopPropagation();
  showDropdownAt(
    document.getElementById("friendDropdown"),
    event.currentTarget,
    event.currentTarget.dataset.friend,
  );
}

function hideDropdowns() {
  document.querySelectorAll(".dropdown-menu, .dropdown-menu_chat").forEach(
    (dropdown) => {
      dropdown.hidden = true;
    },
  );
  dropdownTrigger?.setAttribute("aria-expanded", "false");
  openDropdown = null;
  dropdownTrigger = null;
}

function showChatbox(event) {
  event.preventDefault();
  const dropdown = event.target.closest(".dropdown-menu, .dropdown-menu_chat");
  const friendName = dropdown ? dropdown.getAttribute("data-friend") : null;

  if (friendName) {
    // Le conteneur n'affiche qu'une conversation à la fois : on la redessine
    // à chaque ouverture, messages conservés compris.
    setupPrivateChat(friendName);
    document.getElementById("chatbox").showModal();
  } else {
    console.error("Friend name not found");
  }
  hideDropdowns();
}

function setupPrivateChat(friendName) {
  if (!friendName) {
    console.error("Invalid friend name for private chat setup");
    return;
  }

  const privateChatContainer = document.getElementById(
    "private-chats-container",
  );
  privateChatContainer.innerHTML = html`
    <h5 class="drawer-title" id="chatboxLabel" data-friend="${friendName}">
      Private message with ${friendName}
    </h5>
    <div class="chat-container2">
      <div
        class="chat-log2"
        id="chat-log-${friendName}"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
      </div>
    </div>
    <div class="input-container2">
      <label class="visually-hidden" for="message-input-${friendName}"
      >Message to ${friendName}</label>
      <input
        type="text"
        id="message-input-${friendName}"
        placeholder="Type your message…"
        autocomplete="off"
      >
      <button
        type="button"
        id="send-button-${friendName}"
        aria-label="Send message to ${friendName}"
      >
        ${raw(SEND_ICON)}
      </button>
    </div>
  `;

  // Restaurer les messages précédents
  if (privateMessages.has(friendName)) {
    privateMessages.get(friendName).forEach((msg) => {
      displayPrivateMessage(
        friendName,
        msg.isSelf ? "Vous" : msg.sender,
        msg.content,
      );
    });
  }

  document.getElementById(`send-button-${friendName}`)
    .addEventListener("click", () => sendPrivateMessage(friendName));

  activePrivateChat = friendName;
}

function sendPrivateMessage(friendName) {
  const input = document.getElementById(`message-input-${friendName}`);
  if (!input) {
    console.error(`Input element not found for friend: ${friendName}`);
    return;
  }

  const message = input.value.trim();
  const currentUser = sessionStorage.getItem("display_name");
  const socket = getSocket();

  if (message && socket && socket.connected) {
    if (activePrivateChat !== friendName) {
      setupPrivateChat(friendName);
    }

    socket.emit("private message", {
      to: friendName,
      from: currentUser,
      message: message,
    });

    input.value = "";
  } else if (message) {
    displayPrivateMessage(
      friendName,
      "System",
      "Message not sent — you are disconnected from the chat.",
      true,
    );
  }
}

// Fonction de sanitization
function displayPrivateMessage(friendName, sender, message, isSystem = false) {
  const chatLog = document.getElementById(`chat-log-${friendName}`);
  if (chatLog) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message-container");

    if (isSystem) {
      messageElement.classList.add("system-message");
      messageElement.innerHTML = html`
        <span class="system-text">${message}</span>
      `;
    } else {
      const usernameElement = document.createElement("span");
      usernameElement.classList.add("username-link");
      if (sender === "Vous") {
        usernameElement.classList.add("is-me");
        usernameElement.textContent = "[Me] ";
      } else {
        usernameElement.textContent = `[${friendName}]`;
      }

      const messageTextElement = document.createElement("span");
      messageTextElement.classList.add("message-text");
      messageTextElement.textContent = message;

      messageElement.appendChild(usernameElement);
      messageElement.appendChild(document.createTextNode(": "));
      messageElement.appendChild(messageTextElement);
    }

    chatLog.appendChild(messageElement);
    chatLog.scrollTop = chatLog.scrollHeight;
  }
}

function startGame(event) {
  event.preventDefault();
  if (event.currentTarget.disabled) return;
  const friendName = document.getElementById("friendDropdown").getAttribute(
    "data-friend",
  );

  const displayName = sessionStorage.getItem("display_name");
  const invitationData = {
    to: friendName,
    from: displayName,
    type: "gameInvitation",
  };

  const iframe = document.getElementById("pong");
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage(invitationData, window.location.origin);

    showToast(`Invitation sent to ${friendName}`, "success");
    iframe.focus();
  } else {
    showToast("Could not send the invitation. Try again.", "error");
  }
  hideDropdowns();
}

async function addFriendByName(event) {
  event.preventDefault();
  const input = document.getElementById("addFriendInput");
  const button = document.getElementById("addFriendButton");
  const name = input.value.trim();
  if (!name) return;
  if (name === sessionStorage.getItem("display_name")) {
    showToast("That is your own name.", "info");
    return;
  }

  setBusy(button, true, "…");
  try {
    const response = await sendFriendRequest(name);
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "No account with that name.");
    }
    input.value = "";
    showToast(`Friend request sent to ${name}.`, "success");
    sendFriendRequestSocket(name, data.request_id);
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setBusy(button, false);
  }
}

function toggleGameFocus(event) {
  const focused = document.querySelector(".content").classList.toggle(
    "focus-game",
  );
  event.currentTarget.setAttribute("aria-pressed", String(focused));
  event.currentTarget.textContent = focused
    ? "Show friends and chat"
    : "Focus the game";
}

function goTosettings(event) {
  event.preventDefault();
  navigateTo("/settings");
}

function sendMessage(event) {
  event.preventDefault();
  const displayName = sessionStorage.getItem("display_name");
  let socket = getSocket();

  // Si le socket n'existe pas ou n'est pas connecté, essayer de le réinitialiser
  if (!socket || !socket.connected) {
    socket = initializeSocket(displayName);
    if (!socket) {
      showToast("Connection lost. Please refresh the page.", "error");
      return;
    }
  }

  const messageInput = document.getElementById("message-input");
  const message = messageInput.value.trim();

  if (message !== "" && socket.connected) {
    socket.emit("chat message", { name: displayName, message: message });
    messageInput.value = "";
  } else if (!socket.connected) {
    showToast("Connection lost. Trying to reconnect...", "warning");
  }
}

// Une ligne du chat général. Le message reçu en direct et celui relu depuis
// sessionStorage produisaient le même DOM par deux chemins parallèles ; seule
// la classe `bold-username` de l'historique les distinguait.
function messageRow(name, text, { bold = false, at = null } = {}) {
  const row = document.createElement("div");

  // L'horodatage était calculé et enregistré à chaque message, et jamais rendu.
  if (at) {
    const stamp = new Date(at);
    const time = document.createElement("time");
    time.className = "message-time";
    time.dateTime = stamp.toISOString();
    time.textContent = stamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    row.append(time, " ");
  }

  const nameButton = document.createElement("button");
  nameButton.type = "button";
  nameButton.classList.add("username-link");
  if (bold) nameButton.classList.add("bold-username");
  if (name === sessionStorage.getItem("display_name")) {
    nameButton.classList.add("is-me");
  }
  nameButton.dataset.friend = name;
  nameButton.setAttribute("aria-haspopup", "menu");
  nameButton.setAttribute("aria-label", `Actions for ${name}`);
  nameButton.innerText = `[${name}]`;
  nameButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    nameButton.classList.add("bold-username");
    handleUsernameClick(event, name);
  });

  const messageText = document.createElement("span");
  messageText.innerText = ` : ${text}`;

  row.append(nameButton, messageText);
  return row;
}

// Le salon général garde quinze messages en session, mais le DOM, lui,
// grossissait sans borne pour un onglet laissé ouvert.
const CHAT_LOG_MAX_ROWS = 200;

function appendToChatLog(row) {
  const chatLog = document.getElementById("chat-log");
  if (!chatLog) return null;
  clearChatPlaceholder();

  // Ne recoller en bas que si on y était déjà : le défilement était forcé à
  // chaque message, donc remonter lire l'historique était impossible dès que
  // le salon était actif.
  const atBottom =
    chatLog.scrollHeight - chatLog.scrollTop - chatLog.clientHeight < 40;

  chatLog.appendChild(row);
  while (chatLog.childElementCount > CHAT_LOG_MAX_ROWS) {
    chatLog.firstElementChild.remove();
  }
  if (atBottom) chatLog.scrollTop = chatLog.scrollHeight;
  return chatLog;
}

function receiveMessage(msg) {
  // Vérifier si l'expéditeur est bloqué en utilisant le display_name
  if (blockedUsers.has(msg.name)) {
    return;
  }

  saveMessage(msg.name, msg.message);
  appendToChatLog(messageRow(msg.name, msg.message, { at: Date.now() }));
}

function handleEnterKey(event) {
  if (event.key === "Enter") {
    if (isDrawerOpen()) {
      const chatboxLabel = document.getElementById("chatboxLabel");
      if (chatboxLabel) {
        const friendName = chatboxLabel.dataset.friend;
        const messageInput = document.getElementById(
          `message-input-${friendName}`,
        );

        if (messageInput && document.activeElement === messageInput) {
          event.preventDefault(); // Empêcher le saut de ligne
          const sendButton = document.getElementById(
            `send-button-${friendName}`,
          );
          if (sendButton) {
            sendButton.click();
          }
        }
      }
    } else {
      const messageInput = document.getElementById("message-input");
      if (messageInput && document.activeElement === messageInput) {
        event.preventDefault(); // Empêcher le saut de ligne
        sendMessage(event);
      }
    }
  }
}

function addFriend(event) {
  event.preventDefault();
  const dropdown = event.target.closest(".dropdown-menu, .dropdown-menu_chat");
  const friendName = dropdown ? dropdown.getAttribute("data-friend") : null;
  if (!friendName) {
    console.error("Unable to determine friend's name");
    return;
  }

  checkFriendshipStatus(friendName)
    .then(({ isFriend, requestSent }) => {
      if (isFriend) {
        showToast("Already friends", "info");
        return;
      }
      if (requestSent) {
        showToast("Friend request already sent", "info");
        return;
      }

      sendFriendRequest(friendName)
        .then((response) => {
          if (!response.ok) {
            return response.json().then((data) => {
              throw new Error(
                data.message || `Erreur HTTP: ${response.status}`,
              );
            });
          }
          return response.json();
        })
        .then((data) => {
          showToast("Friend request sent successfully", "success");
          sendFriendRequestSocket(friendName, data.request_id);
        })
        .catch((error) => {
          console.error("Error sending friend request:", error);
          showToast(error.message, "error");
        });
    })
    .catch((error) => {
      console.error("Error checking friendship status:", error);
      showToast("Error checking friendship status", "error");
    });
}

function blockUser(event) {
  event.preventDefault();
  const dropdown = event.target.closest(".dropdown-menu_chat");
  const username = dropdown.getAttribute("data-friend");

  if (!username) {
    console.error("Username not found");
    return;
  }

  fetchWithToken("/api/block-user/", {
    method: "POST",
    body: JSON.stringify({ display_name: username }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Ajouter au Set des utilisateurs bloqués
        blockedUsers.add(username);

        // Nettoyer les messages existants de l'utilisateur bloqué
        const chatLog = document.getElementById("chat-log");
        if (chatLog) {
          const messages = chatLog.getElementsByTagName("div");
          Array.from(messages).forEach((message) => {
            const usernameElement = message.querySelector(".username-link");
            if (
              usernameElement && usernameElement.dataset.friend === username
            ) {
              message.remove();
            }
          });
        }

        showToast("User blocked successfully", "success");

        // Fermer le chat privé si ouvert
        if (activePrivateChat === username) {
          activePrivateChat = null;
          document.getElementById("chatbox")?.close();
        }

        fetchAndDisplayFriends();
      } else {
        showToast(data.message || "Failed to block user", "error");
      }
    })
    .catch((error) => {
      console.error("Error blocking user:", error);
      showToast("An error occurred while blocking the user", "error");
    });
}

function viewProfile(event) {
  event.preventDefault();
  const dropdown = event.target.closest(".dropdown-menu, .dropdown-menu_chat");
  const friendName = dropdown ? dropdown.getAttribute("data-friend") : null;
  if (friendName) {
    navigateTo(`/profile/${encodeURIComponent(friendName)}`);
  } else {
    console.error("Unable to determine friend's name");
  }
}

function saveMessage(friendName, message) {
  let messages = JSON.parse(sessionStorage.getItem("general_chat_messages")) ||
    [];

  messages.push({ friendName, message, timestamp: new Date().toISOString() });

  if (messages.length > 15) {
    messages = messages.slice(-15);
  }

  sessionStorage.setItem("general_chat_messages", JSON.stringify(messages));
}

function loadGeneralChatMessages() {
  const chatLog = document.getElementById("chat-log");
  if (!chatLog) {
    console.error("L'élément chat-log n'existe pas dans le DOM");
    return;
  }

  const messagesString = sessionStorage.getItem("general_chat_messages");
  if (!messagesString) {
    return;
  }

  try {
    chatLog.innerHTML = "";
    for (const msg of JSON.parse(messagesString)) {
      chatLog.appendChild(
        messageRow(msg.friendName, msg.message, {
          bold: true,
          at: msg.timestamp,
        }),
      );
    }
    chatLog.scrollTop = chatLog.scrollHeight;
  } catch (error) {
    console.error("Erreur lors du chargement des messages:", error);
  }
}

function handleUsernameClick(event, username) {
  const isOwnUsername = username === sessionStorage.getItem("display_name");
  const dropdown = document.getElementById(
    isOwnUsername ? "profileDropdown" : "friendDropdown_chat",
  );
  showDropdownAt(dropdown, event.currentTarget, username);
}

// Une liste vide, un chat vide et une requête en échec rendaient tous les
// trois exactement rien.
function placeholder(list, text, className = "empty-state") {
  const li = document.createElement("li");
  li.className = className;
  li.textContent = text;
  list.appendChild(li);
}

function showChatPlaceholder() {
  const chatLog = document.getElementById("chat-log");
  if (chatLog && chatLog.childElementCount === 0) {
    const hint = document.createElement("p");
    hint.className = "empty-state";
    hint.id = "chat-placeholder";
    hint.textContent = "No message yet. Say hello.";
    chatLog.appendChild(hint);
  }
}

function clearChatPlaceholder() {
  document.getElementById("chat-placeholder")?.remove();
}

// Empreinte du dernier rendu des listes d'amis, pour ne pas redessiner à vide.
let lastFriendsSignature = null;

export async function fetchAndDisplayFriends() {
  const onlineFriendsList = document.getElementById("online-friends");
  const pendingFriendsList = document.getElementById("pending-friends");
  const blockedFriendsList = document.getElementById("blocked-friends");

  if (onlineFriendsList && pendingFriendsList && blockedFriendsList) {
    try {
      const [friendsResponse, pendingResponse, blockedResponse] = await Promise
        .all([
          fetchWithToken("/api/friends/"),
          fetchWithToken("/api/get-friend-requests/"),
          fetchWithToken("/api/blocked-users/"),
        ]);

      const [friendsData, pendingData, blockedData] = await Promise.all([
        friendsResponse.json(),
        pendingResponse.json(),
        blockedResponse.json(),
      ]);

      // Mettre à jour le Set des utilisateurs bloqués
      blockedUsers.clear();
      if (blockedData.success && blockedData.blocked_users) {
        blockedData.blocked_users.forEach((displayName) => {
          blockedUsers.add(displayName);
        });
      }

      // Reconstruire les trois listes à chaque tour détruisait le focus
      // clavier, la sélection et la position de défilement toutes les
      // quelques secondes. On ne redessine que si le contenu a changé.
      const signature = JSON.stringify([
        friendsData.friends,
        pendingData.friend_requests,
        blockedData.blocked_users,
      ]);
      if (signature === lastFriendsSignature) return;
      lastFriendsSignature = signature;

      // Clear all lists
      onlineFriendsList.innerHTML = "";
      pendingFriendsList.innerHTML = "";
      blockedFriendsList.innerHTML = "";

      // Display ALL friends (not just online ones)
      friendsData.friends.forEach((friend) => {
        if (!blockedUsers.has(friend.display_name)) {
          createFriendListItem(friend, onlineFriendsList);
        }
      });
      if (onlineFriendsList.childElementCount === 0) {
        placeholder(
          onlineFriendsList,
          "No friend yet — add one by name above.",
        );
      }

      // Display pending requests
      if (pendingData.success && pendingData.friend_requests) {
        pendingData.friend_requests
          .filter((request) => !blockedUsers.has(request.from_username))
          .forEach((request) =>
            addPendingRequest(
              pendingFriendsList,
              request.id,
              request.from_username,
            )
          );
      }
      if (pendingFriendsList.childElementCount === 0) {
        placeholder(pendingFriendsList, "No pending request.");
      }

      // Display blocked users
      if (blockedData.success && blockedData.blocked_users) {
        blockedData.blocked_users.forEach((displayName) => {
          const li = document.createElement("li");
          li.className =
            "list-group-item d-flex justify-content-between align-items-center blocked-user";
          li.innerHTML = html`
            <span>${displayName}</span>
            <button
              type="button"
              class="unblock-btn"
              data-display-name="${displayName}"
              aria-label="Unblock ${displayName}"
            >
              Unblock
            </button>
          `;
          blockedFriendsList.appendChild(li);

          li.querySelector(".unblock-btn").addEventListener(
            "click",
            () => unblockUser(displayName),
          );
        });
      }
      if (blockedFriendsList.childElementCount === 0) {
        placeholder(blockedFriendsList, "Nobody blocked.");
      }
    } catch (error) {
      console.error("Could not load the friend lists:", error);
      // Un échec ne se distinguait pas d'une liste vide.
      lastFriendsSignature = null;
      for (
        const list of [
          onlineFriendsList,
          pendingFriendsList,
          blockedFriendsList,
        ]
      ) {
        list.innerHTML = "";
        placeholder(list, "Could not load this list.", "error-state");
      }
    }
  }
}

// Une demande en attente, qu'elle arrive par socket ou par rafraîchissement.
function addPendingRequest(listElement, requestId, fromUsername) {
  const li = document.createElement("li");
  li.className =
    "list-group-item d-flex justify-content-between align-items-center pending-request";
  li.setAttribute("data-request-id", requestId);
  li.innerHTML = html`
    <span>${fromUsername}</span>
    <div class="pending-actions">
      <button
        type="button"
        class="accept-btn"
        data-request-id="${requestId}"
        aria-label="Accept friend request from ${fromUsername}"
      >
        ${raw(CHECK_ICON)}
      </button>
      <button
        type="button"
        class="reject-btn"
        data-request-id="${requestId}"
        aria-label="Decline friend request from ${fromUsername}"
      >
        ${raw(CROSS_ICON)}
      </button>
    </div>
  `;
  listElement.appendChild(li);

  const answer = (respond) => async () => {
    try {
      await respond(requestId);
      li.remove();
      fetchAndDisplayFriends();
      document.querySelector('[data-tab="online"]')?.click();
    } catch (error) {
      console.error("Erreur lors du traitement de la demande d'ami:", error);
    }
  };

  li.querySelector(".accept-btn").addEventListener(
    "click",
    answer(acceptFriendRequest),
  );
  li.querySelector(".reject-btn").addEventListener(
    "click",
    answer(rejectFriendRequest),
  );
}

// Nouvelle fonction helper pour créer les éléments de la liste d'amis
function createFriendListItem(friend, listElement) {
  const li = document.createElement("li");
  li.className = "list-group-item";

  // C'était un `<li>` porteur d'un écouteur de clic : inatteignable au
  // clavier, donc le chat, l'invitation et le blocage l'étaient aussi.
  const row = document.createElement("button");
  row.type = "button";
  row.className =
    "friend-row d-flex justify-content-between align-items-center";
  row.dataset.friend = friend.display_name;
  // L'état en ligne suit la ligne : le menu s'en sert pour ne pas proposer une
  // partie à quelqu'un qui ne peut pas l'accepter.
  row.dataset.online = friend.is_online ? "1" : "";
  row.setAttribute("aria-haspopup", "menu");
  row.setAttribute("aria-expanded", "false");

  const statusDot = document.createElement("span");
  statusDot.className = `status-dot ${friend.is_online ? "online" : "offline"}`;
  // La pastille ne disait sa couleur qu'à l'œil : sans texte, l'état en ligne
  // était invisible au lecteur d'écran et indiscernable pour un daltonien.
  statusDot.setAttribute("role", "img");
  statusDot.setAttribute("aria-label", friend.is_online ? "Online" : "Offline");

  const usernameSpan = document.createElement("span");
  usernameSpan.textContent = friend.display_name;

  row.append(statusDot, usernameSpan);
  row.addEventListener("click", handleFriendClick);
  li.appendChild(row);

  listElement.appendChild(li);
}

// Nouvelle fonction pour débloquer un utilisateur
async function unblockUser(username) {
  try {
    const response = await fetchWithToken("/api/unblock-user/", {
      method: "POST",
      body: JSON.stringify({ display_name: username }),
    });

    const data = await response.json();
    if (data.success) {
      showToast("User unblocked successfully", "success");
      fetchAndDisplayFriends(); // Refresh the lists
    } else {
      showToast(data.message || "Failed to unblock user", "error");
    }
  } catch (error) {
    console.error("Error unblocking user:", error);
    showToast("An error occurred while unblocking the user", "error");
  }
}

// Le routeur remplace tout `#ft_transcendence` par `innerHTML` : les écouteurs
// posés sur des éléments meurent avec leurs nœuds, et `setupDashboardEvents`
// les repose sur les nouveaux. Il ne reste à défaire que ce qui survit au
// remplacement — `document`, l'intervalle, le socket.
export function removeDashboardEventListeners() {
  document.removeEventListener("click", hideDropdowns);
  document.removeEventListener("keydown", handleEnterKey);
  document.removeEventListener("keydown", handleDropdownKeydown);

  clearInterval(window.fetchFriendsInterval);

  const socket = getSocket();
  if (socket) {
    socket.off("chat message");
    socket.off("private message");
    socket.off("force_disconnect");
    socket.disconnect();
  }
  // Les conversations privées ne sont *pas* vidées ici : cette fonction part
  // aussi sur un simple changement de route, et aller voir le profil d'un ami
  // effaçait alors tout l'historique des tiroirs privés. Elles vivent le temps
  // de la session et meurent avec elle, dans `handleLogout`.
  activePrivateChat = null;
}

// Modify the existing logout function
function handleLogout(event) {
  event.preventDefault();
  const socket = getSocket();
  if (socket) {
    socket.disconnect();
  }
  removeDashboardEventListeners();
  sessionStorage.removeItem("general_chat_messages");
  // La session s'arrête ici : c'est le seul endroit où l'historique en mémoire
  // doit disparaître.
  privateMessages.clear();
  blockedUsers.clear();
  logout();
}

function setupTabSystem() {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  const ARROWS = { ArrowRight: 1, ArrowLeft: -1, Home: 0, End: -0 };
  tabButtons.forEach((button, index) => {
    button.addEventListener("keydown", (event) => {
      if (!(event.key in ARROWS)) return;
      event.preventDefault();
      const last = tabButtons.length - 1;
      const next = event.key === "Home"
        ? 0
        : event.key === "End"
        ? last
        : (index + ARROWS[event.key] + tabButtons.length) % tabButtons.length;
      tabButtons[next].click();
      tabButtons[next].focus();
    });

    button.addEventListener("click", (e) => {
      e.preventDefault();

      // Remove active class from all buttons and contents
      tabButtons.forEach((btn) => {
        btn.classList.remove("active");
        btn.setAttribute("aria-selected", "false");
        btn.tabIndex = -1;
      });
      tabContents.forEach((content) => content.classList.remove("active"));

      // Add active class to clicked button
      button.classList.add("active");
      button.setAttribute("aria-selected", "true");
      button.tabIndex = 0;

      // Show corresponding content
      const tabId = button.getAttribute("data-tab");
      const content = document.getElementById(tabId);
      if (content) {
        content.classList.add("active");
      }
    });
  });
}
