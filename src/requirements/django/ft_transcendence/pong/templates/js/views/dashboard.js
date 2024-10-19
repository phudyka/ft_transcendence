import { navigateTo } from '../app.js';
import { logout, setGlobalSocket } from '../utils/token.js';
import { getSocket } from '../utils/socketManager.js';
import { initializeSocket } from '../utils/socketManager.js';

let socket;
const privateChatLogs = new Map();
const username = localStorage.getItem('username');

export function generateRandomUsername() {
    const adjectives = ['Happy', 'Clever', 'Brave', 'Calm', 'Eager', 'Jolly', 'Kind', 'Lively', 'Proud', 'Wise'];
    const nouns = ['Lion', 'Eagle', 'Dolphin', 'Tiger', 'Panda', 'Fox', 'Wolf', 'Bear', 'Owl', 'Hawk'];

    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 100);

    return `${randomAdjective}${randomNoun}${randomNumber}`;
}

export function dashboard(player_name) {
    const username = localStorage.getItem('username');
    const displayName = localStorage.getItem('display_name');
    let avatarUrl = localStorage.getItem('avatar_url');

    if (!username) {
        navigateTo('/login');
        return;
    }

    initializeSocket(username);

    if (avatarUrl) {
        avatarUrl = avatarUrl.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
    }

    document.getElementById('ft_transcendence').innerHTML = `
    <div class="dashboard-container">
        <div class="header">
            <a class="navbar-brand" href="#">
                <img src="${staticUrl}content/logo2.png" id="pongonlineLink" alt="Logo" class="logo">
            </a>
            <span class="nav-item" style="font-size: 3.5em; font-weight: bold;">${username}</span>
            <div class="profile-container">
                <img src="${avatarUrl}" class="profile-icon" alt="Profile Picture" id="img_profile_pic">
            </div>
        </div>

        <div class="content">
            <div class="sidebar">
                <h2 class="title-friends">Amis</h2>
                <ul id="friends" class="list-group">
                    <li class="list-group-item" data-friend="momo">
                        <span class="status-dot online"></span>momo
                    </li>
                    <li class="list-group-item" data-friend="Friend2">
                        <span class="status-dot offline"></span>Friend2
                    </li>
                    <li class="list-group-item" data-friend="Friend3">
                        <span class="status-dot online"></span>Friend3
                    </li>
                </ul>
                <div id="friendDropdown" class="dropdown-menu" style="display: none;">
                    <a class="dropdown-item" href="#" id="sendMessage">Send Private Message</a>
                    <a class="dropdown-item" href="#" id="startGame">Start a Game</a>
                    <a class="dropdown-item" href="#" id="viewProfile">View Profile</a>
                </div>
                <div id="friendDropdown_chat" class="dropdown-menu_chat" style="display: none;">
                    <a class="dropdown-item" href="#" id="sendMessage">Send Private Message</a>
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
            <div id="addFriendToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="me-auto">Friend Request</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    Friend request sent successfully!
                </div>
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

        <footer>© 2024 42Company, Inc</footer>
    </div>`;

    const iframe = document.getElementById('pong');
    iframe.onload = function () {
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('accessToken');
    const csrfToken = localStorage.getItem('csrfToken');
    console.log(localStorage);
    const avatar = localStorage.getItem('avatar_url');
    iframe.contentWindow.postMessage({ username: username, token: token, csrfToken: csrfToken, avatar: avatar }, 'http://localhost:4000');
    };

	setupDashboardEvents(navigateTo, username);
	setupChatListeners();
	// checkForFriendRequests();
    // fetchAndDisplayFriends();
}

function setupChatListeners() {
    const socket = getSocket();
    if (socket) {
        socket.off('chat message');
        socket.off('private message');

        socket.on('chat message', (msg) => {
            console.log('Message reçu du serveur:', msg);
            receiveMessage(msg);
        });

        document.addEventListener('privateMessage', (event) => {
            receivePrivateMessage(event.detail);
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
	document.getElementById('friendDropdown_chat').querySelector('#sendMessage').addEventListener('click', showChatbox);
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

// toast when add friend
	document.getElementById('friendDropdown_chat').querySelector('#addToFriend').addEventListener('click', function (event) {
		event.preventDefault();
		var toast = new bootstrap.Toast(document.getElementById('addFriendToast'));
		toast.show();
	});

	// toast when block user
	document.getElementById('friendDropdown_chat').querySelector('#blockUser').addEventListener('click', function (event) {
		event.preventDefault();
		var toast = new bootstrap.Toast(document.getElementById('blockUserToast'));
		toast.show();
	});

	// setInterval(fetchAndDisplayFriends, 60000);
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

    const visibleDropdowns = document.querySelectorAll('.dropdown-menu, .dropdown-menu_chat');
    visibleDropdowns.forEach(dropdown => {
        dropdown.style.display = 'none';
    });

    dropdown.style.top = `${event.clientY}px`;
    dropdown.style.left = `${event.clientX}px`;
    dropdown.style.display = 'block';
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
    const username = localStorage.getItem('username');
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    const socket = getSocket();

    if (message !== '') {
        if (socket && socket.connected) {
            const messageData = {
                name: username,
                message: message
            };
            socket.emit('chat message', messageData);
            console.log('Message envoyé:', messageData);
            messageInput.value = '';
        } else {
            console.error('La connexion au serveur de chat n\'est pas établie');
            initializeSocket(username);
        }
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

    usernameElement.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        const currentUsername = localStorage.getItem('username');
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
        if (message && socket && socket.connected) {
            socket.emit('private message', {
                content: message,
                to: friendName
            });
            const chatLog = document.getElementById(`chat-log-${friendName}`);
            if (chatLog) {
                const messageElement = document.createElement('div');
                messageElement.innerHTML = `<strong>You:</strong> ${message}`;
                chatLog.appendChild(messageElement);
                chatLog.scrollTop = chatLog.scrollHeight;
            }
            input.value = '';
        }
    } else {
        console.error(`Input element for ${friendName} not found`);
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
	const friendName = document.getElementById('friendDropdown').getAttribute('data-friend');
	console.log(`Add ${friendName} to friends`);
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
	let messages = JSON.parse(localStorage.getItem(`chat_${friendName}`)) || [];
	messages.push({ sender: 'Player', message: message });
	localStorage.setItem(`chat_${friendName}`, JSON.stringify(messages));
}

function loadMessages(friendName) {
	const chatLog = document.getElementById(`chat-log-${friendName}`);
	const messages = JSON.parse(localStorage.getItem(`chat_${friendName}`)) || [];

	chatLog.innerHTML = ''; // Effacer les messages précédents

	messages.forEach(msg => {
		const messageElement = document.createElement('div');
		messageElement.innerHTML = `<span class="username-link bold-username">[${msg.sender}]:</span> ${msg.message}`;
		chatLog.appendChild(messageElement);
	});

	chatLog.scrollTop = chatLog.scrollHeight;
}

function checkForFriendRequests() {
    fetch('/api/get-friend-requests/', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.friend_requests.length > 0) {
            data.friend_requests.forEach(request => {
                showFriendRequestToast(request.from_username, request.id);
            });
        }
    })
    .catch(error => console.error('Erreur lors de la récupération des demandes d\'ami:', error));
}

function showFriendRequestToast(fromUsername, requestId) {
    const toastHtml = `
        <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <strong class="me-auto">Demande d'ami</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${fromUsername} souhaite vous ajouter comme ami.
                <div class="mt-2 pt-2 border-top">
                    <button type="button" class="btn btn-primary btn-sm" onclick="acceptFriendRequest(${requestId})">Accepter</button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="rejectFriendRequest(${requestId})">Refuser</button>
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
    toast.show();
}

function acceptFriendRequest(requestId) {
    fetch('/api/accept-friend-request/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ request_id: requestId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Demande d\'ami acceptée');
            // Mettre à jour l'interface utilisateur si nécessaire
        }
    })
    .catch(error => console.error('Erreur lors de l\'acceptation de la demande d\'ami:', error));
}

function rejectFriendRequest(requestId) {
    fetch('/api/reject-friend-request/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ request_id: requestId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Demande d\'ami rejetée');
            // Mettre à jour l'interface utilisateur si nécessaire
        }
    })
    .catch(error => console.error('Erreur lors du rejet de la demande d\'ami:', error));
}

// Ajoutez cette fonction à votre code existant pour envoyer une demande d'ami
function sendFriendRequest(toUsername) {
    fetch('/api/send-friend-request/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ to_username: toUsername })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Demande d\'ami envoyée');
            // Mettre à jour l'interface utilisateur si nécessaire
        }
    })
    .catch(error => console.error('Erreur lors de l\'envoi de la demande d\'ami:', error));
}

function fetchAndDisplayFriends() {
    fetch('http://localhost:8000/api/friends/', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur réseau');
        }
        return response.json();
    })
    .then(data => {
        const friendsList = document.getElementById('friends');
        friendsList.innerHTML = '';

        data.forEach(friend => {
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

// setInterval(fetchAndDisplayFriends, 600000);
// setInterval(checkForFriendRequests, 600000);
