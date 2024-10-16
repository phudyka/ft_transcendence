import { navigateTo } from '../app.js';
import { logout, setGlobalSocket } from '../utils/token.js';
import { getSocket, initializeSocket } from '../utils/socketManager.js';
import { fetchFriendList, sendFriendRequest, fetchFriendRequests, acceptFriendRequest, rejectFriendRequest } from '../utils/friendManager.js';
import { getCookie } from './settingsv.js';
import { removeLoginEventListeners } from './login.js';
import { checkAuthentication } from '../utils/auth.js';

let socket;
const privateChatLogs = new Map();
const username = sessionStorage.getItem('username');

export async function dashboard(player_name) {
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
        navigateTo('/login');
        return;
    }

    removeLoginEventListeners();

    const username = sessionStorage.getItem('username');
    const displayName = sessionStorage.getItem('display_name');
    let avatarUrl = sessionStorage.getItem('avatar_url');
    const socket = initializeSocket(username);
    setupChatListeners(socket);

    if (!username) {
        navigateTo('/login');
        return;
    }

    if (avatarUrl) {
        avatarUrl = avatarUrl.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
    }

    document.getElementById('ft_transcendence').innerHTML = `
    <div class="dashboard-container">
        <div class="header">
            <a class="navbar-brand" href="#">
                <img src="${staticUrl}content/logo2.png" id="pongonlineLink" alt="Logo" class="logo">
            </a>
            <span class="nav-item" style="font-size: 2.5em; font-weight: bold; color: #ff7043;">${displayName}</span>
            <div class="profile-container">
                <img src="${avatarUrl}" class="profile-icon" alt="Profile Picture" id="img_profile_pic" style="
    cursor: pointer;
">
            </div>
        </div>

        <div class="content">
            <div class="sidebar">
                <h2 class="title-friends">Friends</h2>
                <ul id="friends" class="list-group">
                </ul>
                <div id="friendDropdown" class="dropdown-menu" style="display: none;">
                    <a class="dropdown-item" href="#" id="sendMessage">Send Private Message</a>
                    <a class="dropdown-item" href="#" id="startGame">Start a Game</a>
                    <a class="dropdown-item" href="#" id="viewProfile">View Profile</a>
                </div>
                <div id="friendDropdown_chat" class="dropdown-menu_chat" style="display: none;">
                    <a class="dropdown-item" href="#" id="addToFriend">Add To Friend</a>
                    <a class="dropdown-item" href="#" id="blockUser">Block User</a>
                    <a class="dropdown-item" href="#" id="viewProfile">View Profile</a>
                </div>
            </div>

                <div class="game-container">
                    <iframe id="pong" title="Pong" src="http://localhost:4000"></iframe>
                </div>

            <div class="chat-container">
                <h2 class="title-chat">Chat</h2>
                <div class="chat-log" id="chat-log"></div>
                <div class="input-container">
                    <input id="message-input" placeholder="Tapez votre message..." rows="1"></input>
                    <button id="send-button">►</button>
                </div>
            </div>
        </div>
        <div id="profileDropdown" class="dropdown-menu" style="display: none;">
            <a class="dropdown-item" href="#" id="settings">Settings</a>
            <a class="dropdown-item" href="#" id="logoutLink">Logout</a>
        </div>
        <div class="offcanvas offcanvas-end" data-bs-scroll="true" tabindex="-1" id="chatbox" aria-labelledby="chatboxLabel">
            <div class="offcanvas-header">
                <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
            <div class="offcanvas-body">
                <div id="private-chats-container"></div>
            </div>
        </div>

        <div class="toast-container position-fixed bottom-0 end-0 p-3">
            <div id="blockUserToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="me-auto">Block User</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    User blocked successfully!
                </div>
            </div>
        </div>

        <footer id="footer-dashboard">© 2024 42Company, Inc</footer>
    </div>`;
    const iframe = document.getElementById('pong');
    iframe.onload = function () {
        const displayName = sessionStorage.getItem('display_name');
        const token = sessionStorage.getItem('accessToken');
        const csrfToken = getCookie('csrftoken');
        console.log(sessionStorage);
        const avatar = sessionStorage.getItem('avatar_url');
        iframe.contentWindow.postMessage({ username: displayName, token: token, csrfToken: csrfToken, avatar: avatar }, 'http://localhost:4000');
    };

	setupDashboardEvents(navigateTo, displayName);
	// setupChatListeners();
	checkForFriendRequests();
    fetchAndDisplayFriends();
}

function setupChatListeners(socket) {
    if (socket) {
        socket.off('chat message');
        socket.off('private message');
        socket.off('force_disconnect');

        socket.on('chat message', (msg) => {
            console.log('Message reçu du serveur:', msg);
            receiveMessage(msg);
        });

        socket.on('private message', (msg) => {
            console.log('Message privé reçu:', msg);
            receivePrivateMessage(msg);
        });

        socket.on('force_disconnect', () => {
            console.log('Déconnexion forcée par le serveur');
            navigateTo('/login');
        });
    }
}

function receivePrivateMessage(msg) {
    console.log('Message privé reçu:', msg);
    const chatLog = document.getElementById(`chat-log-${msg.from}`);
    if (chatLog) {
        const messageElement = document.createElement('div');
        messageElement.innerHTML = `<strong>${msg.from}:</strong> ${msg.content}`;
        chatLog.appendChild(messageElement);
        chatLog.scrollTop = chatLog.scrollHeight;
    } else {
        console.log(`Chat log pour ${msg.from} non trouvé. Message: ${msg.content}`);
    }
}

function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function openPrivateChat(friendName) {
	let chatLog = privateChatLogs.get(friendName);
	if (!chatLog) {
		chatLog = document.createElement('div');
		chatLog.id = `chat-log-${friendName}`;
		chatLog.className = 'chat-log';
		privateChatLogs.set(friendName, chatLog);
	}

	const chatContainer = document.getElementById('private-chats-container');
	chatContainer.innerHTML = '';
	chatContainer.appendChild(chatLog);

	const inputContainer = document.createElement('div');
	inputContainer.className = 'input-container';
	inputContainer.innerHTML = `
		<input type="text" id="message-input-${friendName}" placeholder="Type your message...">
		<button onclick="Message('${friendName}')">Send</button>
	`;
	chatContainer.appendChild(inputContainer);

	document.getElementById(`send-button-${friendName}`).addEventListener('click', () => sendPrivateMessage(friendName));
}

function setupDashboardEvents(navigateTo, username) {
	//Logout
	document.getElementById('logoutLink').addEventListener('click', function (event) {
		event.preventDefault();
		const socket = getSocket();
		if (socket) {
			socket.disconnect();
		}
		logout();
	});

	// Friend menu
	document.querySelectorAll('#friends .list-group-item').forEach(item => {
		item.addEventListener('click', handleFriendClick);
	});

	// Profile picture dropdown
	document.getElementById('img_profile_pic').addEventListener('click', handleProfilePictureClick);

	// Hide the dropdown menu when clicking outside of it
	document.addEventListener('click', hideDropdowns);

	// Prevent the dropdown menu from closing when clicking inside it
	document.getElementById('friendDropdown').addEventListener('click', (event) => event.stopPropagation());
	document.getElementById('friendDropdown_chat').addEventListener('click', (event) => event.stopPropagation());
	document.getElementById('profileDropdown').addEventListener('click', (event) => event.stopPropagation());

	// Dropdown actions
	document.getElementById('sendMessage').addEventListener('click', showChatbox);
	// document.getElementById('startGame').addEventListener('click', startGame);
	document.getElementById('settings').addEventListener('click', goTosettings);

	// Chat functionnalitis
	document.getElementById('send-button').addEventListener('click', sendMessage);

	//Private message with friend
	document.addEventListener('click', function(event) {
		if (event.target && event.target.id.startsWith('send-button-')) {
			const friendName = event.target.id.replace('send-button-', '');
			sendPrivateMessage(friendName);
		}
	});

	// Send message when pressing Enter key
	document.addEventListener("keydown", handleEnterKey);

	//View profile
	document.getElementById('friendDropdown').querySelector('#viewProfile').addEventListener('click', viewProfile);
	document.getElementById('friendDropdown_chat').querySelector('#viewProfile').addEventListener('click', viewProfile);

	// Friend actions
	document.getElementById('friendDropdown_chat').querySelector('#addToFriend').addEventListener('click', addFriend);
	document.getElementById('friendDropdown_chat').querySelector('#blockUser').addEventListener('click', blockUser);

	// Profile picture

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

	// toast when block user
	document.getElementById('friendDropdown_chat').querySelector('#blockUser').addEventListener('click', function (event) {
		event.preventDefault();
		var toast = new bootstrap.Toast(document.getElementById('blockUserToast'));
		toast.show();
	});

	// setInterval(fetchAndDisplayFriends, 60000);
    setInterval(fetchAndDisplayFriends, 20000);
    setInterval(checkForFriendRequests, 20000);
}

function scrollToBottom2(friendName) {
	const chatLog2 = document.getElementById(`chat-log-${friendName}`);
	chatLog2.scrollTop = chatLog2.scrollHeight;
}

function formatMessage(message) {
	/* for no html injection */
	if (message.startsWith("```")) {
		return `<pre>${message}</pre>`;
	}

	/* syntax : [player_name] : message */
	message = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
	message = message.replace(/(```[\s\S]*?```)/g, '<pre>$1</pre>');

	return `${message}`;
  }

function handleProfilePictureClick(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('profileDropdown');

    // Masquer tous les dropdowns visibles
    const visibleDropdowns = document.querySelectorAll('.dropdown-menu, .dropdown-menu_chat');
    visibleDropdowns.forEach(dropdown => {
        dropdown.style.display = 'none';
    });

    // Afficher le dropdown pour le calculer ses dimensions
    dropdown.style.display = 'block';

    // Obtenir les dimensions de la fenêtre et du dropdown
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const dropdownRect = dropdown.getBoundingClientRect();

    // Calculer la position optimale
    let top = event.clientY;
    let left = event.clientX;

    // Ajuster la position verticale si nécessaire
    if (top + dropdownRect.height > windowHeight) {
        top = windowHeight - dropdownRect.height;
    }

    // Ajuster la position horizontale si nécessaire
    if (left + dropdownRect.width > windowWidth) {
        left = windowWidth - dropdownRect.width;
    }

    // Appliquer la nouvelle position
    dropdown.style.top = `${top}px`;
    dropdown.style.left = `${left}px`;
}

function handleFriendClick(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('friendDropdown');
    const friendName = this.getAttribute('data-friend');

    // Hide all visible dropdowns
    const visibleDropdowns = document.querySelectorAll('.dropdown-menu, .dropdown-menu_chat');
    visibleDropdowns.forEach(dropdown => {
        dropdown.style.display = 'none';
    });

    // Position the dropdown near the clicked friend item
    dropdown.style.top = `${event.clientY}px`;
    dropdown.style.left = `${event.clientX}px`;
    dropdown.style.display = 'block';

    // Store the clicked friend's name
    dropdown.setAttribute('data-friend', friendName);
}

function hideDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown-menu, .dropdown-menu_chat');
    dropdowns.forEach(dropdown => {
        dropdown.style.display = 'none';
    });
}

function showChatbox(event) {
    event.preventDefault();
    const dropdown = event.target.closest('.dropdown-menu, .dropdown-menu_chat');
    if (dropdown) {
        const friendName = dropdown.getAttribute('data-friend');
        if (friendName) {
            var chatbox = new bootstrap.Offcanvas(document.getElementById('chatbox'));
            chatbox.show();
            setupPrivateChat(friendName);

            document.getElementById('chat-log2').innerHTML = ' ';
        } else {
            console.error('Friend name not found');
        }
    } else {
        console.error('Dropdown not found');
    }
}

function setupPrivateChat(friendName) {
    const privateChatContainer = document.getElementById('private-chats-container');
    privateChatContainer.innerHTML = `
        <h5 class="offcanvas-title" id="chatboxLabel">Message privé : ${friendName}</h5>
        <div class="chat-container2">
            <div class="chat-log2" id="chat-log-${friendName}"></div>
        </div>
        <div class="input-container2">
            <input type="text" id="message-input-${friendName}" placeholder="Tapez votre message...">
            <button id="send-button-${friendName}">►</button>
        </div>
    `;
    loadMessages(friendName);
    document.getElementById(`send-button-${friendName}`).onclick = () => sendPrivateMessage(friendName);
}

// function startGame(event) {
// 	event.preventDefault();
// 	const friendName = document.getElementById('friendDropdown').getAttribute('data-friend');
// 	console.log(`Start a game with ${friendName}`);
// }

function goTosettings(event) {
	event.preventDefault();
	console.log('Go to settings');
	navigateTo('/settings');
}

function sendMessage(event) {
    event.preventDefault();
    const username = sessionStorage.getItem('username');
    const displayName = sessionStorage.getItem('display_name');
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    const socket = getSocket(username);

    if (message !== '' && socket && socket.connected) {
        socket.emit('chat message', { name: displayName || username, message: message });
        messageInput.value = '';
    }
}

function receiveMessage(msg) {
    console.log('Fonction receiveMessage appelée avec:', msg);
    const chatLog = document.getElementById('chat-log');
    if (!chatLog) {
        console.error("L'élément chat-log n'existe pas dans le DOM");
        return;
    }
    const messageElement = document.createElement('div');

    const usernameElement = document.createElement('span');
    usernameElement.classList.add('username-link');
    usernameElement.dataset.friend = msg.name;
    usernameElement.innerText = `[${msg.name}]`;
    usernameElement.style = "cursor: pointer;";

    usernameElement.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        const currentUsername = sessionStorage.getItem('username');
        const isOwnUsername = msg.name === currentUsername;
        const dropdown = isOwnUsername ? document.getElementById('profileDropdown') : document.getElementById('friendDropdown_chat');
        const friendName = this.dataset.friend;
        usernameElement.classList.add('username-link', 'bold-username');

        // Masquer tous les menus déroulants visibles
        const visibleDropdowns = document.querySelectorAll('.dropdown-menu, .dropdown-menu_chat');
        visibleDropdowns.forEach(dropdown => {
            dropdown.style.display = 'none';
        });

        if (dropdown) {
            dropdown.style.position = 'fixed';
            dropdown.style.display = 'block';

            // Vérifier si le dropdown dépasse la fenêtre
            const rect = dropdown.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            if (event.clientY + rect.height > windowHeight) {
                dropdown.style.top = `${event.clientY - rect.height}px`;
            } else {
                dropdown.style.top = `${event.clientY}px`;
            }

            if (event.clientX + rect.width > windowWidth) {
                dropdown.style.left = `${event.clientX - rect.width}px`;
            } else {
                dropdown.style.left = `${event.clientX}px`;
            }

            dropdown.dataset.friend = friendName;
        }
        console.log('Message reçu:', msg);
    });

    const messageTextElement = document.createElement('span');
    messageTextElement.innerText = ` : ${msg.message}`;

    messageElement.appendChild(usernameElement);
    messageElement.appendChild(messageTextElement);

    chatLog.appendChild(messageElement);

    chatLog.scrollTop = chatLog.scrollHeight;
}

function sendPrivateMessage(friendName) {
    const input = document.getElementById(`message-input-${friendName}`);
    if (input) {
        const message = input.value.trim();
        const socket = getSocket();
        if (message && socket && socket.connected) {
            socket.emit('private message', { to: friendName, message: message });
            // Afficher le message envoyé dans le chat local
            const chatLog = document.getElementById(`chat-log-${friendName}`);
            if (chatLog) {
                const messageElement = document.createElement('div');
                messageElement.innerHTML = `<strong>You:</strong> ${message}`;
                chatLog.appendChild(messageElement);
                chatLog.scrollTop = chatLog.scrollHeight;
            }
            input.value = '';
        }
    }
}

function handleEnterKey(event) {
	if (event.key === "Enter") {
		const messageInput = document.getElementById('message-input');
		if (messageInput && document.activeElement === messageInput) {
		  sendMessage(event);
		}
	  }
}

function addFriend(event) {
    event.preventDefault();
    const dropdown = event.target.closest('.dropdown-menu, .dropdown-menu_chat');
    const friendName = dropdown ? dropdown.getAttribute('data-friend') : null;
    if (!friendName) {
        console.error("Impossible de déterminer le nom de l'ami");
        return;
    }
    console.log(`Add ${friendName} to friends`);
    sendFriendRequest(friendName)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Demande d\'ami envoyée avec succès', data);
            showFriendRequestSentToast(friendName);
        })
        .catch(error => {
            console.error('Erreur lors de l\'envoi de la demande d\'ami:', error);
        });
}

function showFriendRequestSentToast(friendName) {
    const toastHtml = `
        <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <strong class="me-auto">Friend Request Sent</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                Friend request sent to ${friendName} successfully!
            </div>
        </div>
    `;

    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed top-0 start-50 translate-middle-x p-3';
    toastContainer.innerHTML = toastHtml;
    document.body.appendChild(toastContainer);

    const toastElement = toastContainer.querySelector('.toast');
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}

function blockUser(event) {
	event.preventDefault();
	const friendName = document.getElementById('friendDropdown').getAttribute('data-friend');
	console.log(`Block ${friendName}`);
}

function viewProfile(event) {
	event.preventDefault();
	const friendName = document.getElementById('friendDropdown').getAttribute('data-friend');
	console.log(`View profile of ${friendName}`);
	navigateTo(`/profile/${friendName}`);
}

function saveMessage(friendName, message) {
	let messages = JSON.parse(sessionStorage.getItem(`chat_${friendName}`)) || [];
	messages.push({ sender: 'Player', message: message });
	sessionStorage.setItem(`chat_${friendName}`, JSON.stringify(messages));
}

function loadMessages(friendName) {
	const chatLog = document.getElementById(`chat-log-${friendName}`);
	const messages = JSON.parse(sessionStorage.getItem(`chat_${friendName}`)) || [];

	chatLog.innerHTML = ''; // Effacer les messages précédents

	messages.forEach(msg => {
		const messageElement = document.createElement('div');
		messageElement.innerHTML = `<span class="username-link bold-username">[${msg.sender}]:</span> ${msg.message}`;
		chatLog.appendChild(messageElement);
	});

	chatLog.scrollTop = chatLog.scrollHeight;
}

function checkForFriendRequests() {
    fetchFriendRequests()
        .then(friendRequests => {
            console.log('Données des demandes d\'ami:', friendRequests);
            friendRequests.forEach(request => {
                showFriendRequestToast(request.from_username, request.id);
            });
        })
        .catch(error => console.error('Erreur lors de la récupération des demandes d\'ami:', error));
}

function showFriendRequestToast(fromUsername, requestId) {
    const toastHtml = `
        <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <strong class="me-auto" style="color: #ff5722; background-color: white;">Friend Request</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body" style="color: black; background-color: white;">
                ${fromUsername} wants to add you as a friend.
                <div class="mt-2 pt-2 border-top">
                    <button type="button" class="btn btn-primary btn-sm accept-friend-request" data-request-id="${requestId}">Accept</button>
                    <button type="button" class="btn btn-primary btn-sm reject-friend-request" data-request-id="${requestId}">Reject</button>
                </div>
            </div>
        </div>
    `;

    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed top-0 start-50 translate-middle-x p-3';
    toastContainer.innerHTML = toastHtml;
    document.body.appendChild(toastContainer);

    const toastElement = toastContainer.querySelector('.toast');
    const toast = new bootstrap.Toast(toastElement);

    // Ajoutez les écouteurs d'événements pour les boutons
    toastElement.querySelector('.accept-friend-request').addEventListener('click', function() {
        acceptFriendRequest(this.dataset.requestId)
            .then(() => {
                toast.hide();
                fetchAndDisplayFriends();
            })
            .catch(error => console.error('Erreur lors de l\'acceptation de la demande d\'ami:', error));
    });

    toastElement.querySelector('.reject-friend-request').addEventListener('click', function() {
        rejectFriendRequest(this.dataset.requestId)
            .then(() => {
                toast.hide();
            })
            .catch(error => console.error('Erreur lors du rejet de la demande d\'ami:', error));
    });
    toast.show();
}



function fetchAndDisplayFriends() {
    fetch('/api/friends/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Données reçues par fetchAndDisplayFriends:', data); // Ajout du console.log ici
        const friendsList = document.getElementById('friends');
        friendsList.innerHTML = '';

        data.friends.forEach(friend => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.setAttribute('data-friend', friend.username);

            const statusDot = document.createElement('span');
            statusDot.className = `status-dot ${friend.is_online ? 'online' : 'offline'}`;

            const usernameSpan = document.createElement('span');
            usernameSpan.textContent = friend.display_name || friend.username;

            li.appendChild(statusDot);
            li.appendChild(usernameSpan);
            li.addEventListener('click', handleFriendClick);
            friendsList.appendChild(li);
        });
    })
    .catch(error => {
        console.error('Erreur lors de la récupération des amis:', error);
    });
}

// Décommentez ces lignes pour activer la mise à jour automatique
// setInterval(fetchAndDisplayFriends, 20000);
// setInterval(checkForFriendRequests, 20000);

export function removeDashboardEventListeners() {
    // Supprimez ici tous les écouteurs d'événements spécifiques au tableau de bord
    document.removeEventListener("keydown", handleEnterKeyForChat);
    // ... autres suppressions d'écouteurs ...
}

function handleEnterKeyForChat(event) {
    if (event.key === "Enter") {
        const messageInput = document.getElementById('message-input');
        if (messageInput && document.activeElement === messageInput) {
            sendMessage(event);
        }
    }
}

// Ajoutez cette fonction pour réinitialiser la socket si nécessaire
function reinitializeSocket() {
    const username = sessionStorage.getItem('username');
    if (username && !socket) {
        socket = initializeSocket(username);
        setupChatListeners(socket);
    }
}

// Appelez reinitializeSocket au chargement de la page
window.addEventListener('load', reinitializeSocket);

function showFriendDropdown(event, friendName) {
    const dropdown = document.getElementById('friendDropdown');
    dropdown.setAttribute('data-friend', friendName);
    dropdown.style.display = 'block';
    // Positionner le dropdown près du curseur
    dropdown.style.left = `${event.clientX}px`;
    dropdown.style.top = `${event.clientY}px`;
}
