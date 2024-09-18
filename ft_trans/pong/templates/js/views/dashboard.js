import { navigateTo } from '../app.js';
import { logout, setGlobalSocket } from '../utils/token.js';

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
    const avatarUrl = localStorage.getItem('avatar_url');

	if (!username) {
        navigateTo('/login');
        return;
    }

	document.getElementById('ft_transcendence').innerHTML = `
    <div class="dashboard-container">
        <div class="header">
            <a class="navbar-brand" href="#">
                <img src="${staticUrl}content/logo2.png" id="pongonlineLink" alt="Logo" class="logo">
            </a>
            <div class="profile-container">
                <img src="https://i.ibb.co/FDg3t8m/avatar7.png" class="profile-icon img-thumbnail rounded-circle" alt="Profile Picture" id=img_profile_pic>
            </div>
        </div>

        <div class="content">
            <div class="sidebar">
                <ul id="friends" class="list-group">
                    <li class="list-group-item" data-friend="Friend1">${generateRandomUsername()}</li>
                    <li class="list-group-item" data-friend="Friend2">${generateRandomUsername()}</li>
                </ul>
            </div>

            <div class="game-container">
                <iframe id="pong" title="Pong" src="http://localhost:4000"></iframe>
            </div>

            <div class="chat-container">
                <div class="chat-log" id="chat-log"></div>
                <div class="input-container">
                    <textarea id="message-input" placeholder="Type your message..."></textarea>
                    <button id="send-button">Send</button>
                </div>
            </div>
        </div>

        <footer>© 2024 42Company, Inc</footer>
    </div>`;

	setupDashboardEvents(navigateTo, username);
	initializeSocket();
	checkForFriendRequests();
}

setInterval(checkForFriendRequests, 600000);

function initializeSocket() {
    if (socket && socket.connected) {
        console.log('Connexion Socket.IO existante réutilisée');
        return;
    }

    const username = localStorage.getItem('username');
    if (!username) {
        console.error('Nom d\'utilisateur non trouvé');
        return;
    }

    socket = io('http://localhost:3000', {
        transports: ['websocket'],
        query: {
            username: username,
        }
    });

	setGlobalSocket(socket);

    socket.on('connect', () => {
        console.log('Connecté au serveur de chat');
		const username = localStorage.getItem('username');
        if (username) {
            socket.emit('register', username);
        }
    });

    socket.on('connection_limit_reached', () => {
        console.log('Limite de connexion atteinte');
        alert('Vous êtes déjà connecté dans un autre onglet ou fenêtre.');
        socket.disconnect();
    });

    socket.on('chat message', (msg) => {
        console.log('Message reçu du serveur:', msg);
        receiveMessage(msg);
    });

    socket.on('connect_error', (error) => {
        console.error('Erreur de connexion:', error);
    });
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

function receivePrivateMessage(from, message) {
    const chatLog = privateChatLogs.get(from);
    if (chatLog) {
        chatLog.innerHTML += `<div><strong>${from}:</strong> ${message}</div>`;
    } else {
        console.log(`Received message from ${from}: ${message}`);
    }
}

function setupDashboardEvents(navigateTo, player_name) {
	//Logout
	document.getElementById('logoutLink').addEventListener('click', function (event) {
		event.preventDefault();
		logout();
	});

	//Game solo
	document.getElementById('game_alone').addEventListener('click', function (event) {
		event.preventDefault();
		console.log('Play game_alone button clicked');

		window.location.href = 'http://localhost:4000';
		//Voir avec iFrame pour ouvrir le jeu sans quitter la page actuelle
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
	document.getElementById('startGame').addEventListener('click', startGame);
	document.getElementById('settings').addEventListener('click', goTosettings);

	// Chat functionnalitis
	document.getElementById('send-button').addEventListener('click', sendMessage);

	//Private message with friend
	document.getElementById('send-button2').addEventListener('click', sendPrivateMessage);

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

function handleProfilePictureClick() {
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

function handleFriendClick() {
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
	const dropdown = document.getElementById('friendDropdown');
	if (dropdown) {
		dropdown.style.display = 'none';
	}

	const dropdown2 = document.getElementById('friendDropdown_chat');
	if (dropdown2) {
		dropdown2.style.display = 'none';
	}

	const dropdown3 = document.getElementById('profileDropdown');
	if (dropdown3) {
		dropdown3.style.display = 'none';
	}
}

function showChatbox(event) {
	event.preventDefault();
	const friendName = event.target.closest('.dropdown-menu').getAttribute('data-friend');
	var chatbox = new bootstrap.Offcanvas(document.getElementById('chatbox'));
	chatbox.show();
	setupPrivateChat(friendName);

	document.getElementById('chat-log2').innerHTML = ' ';
}

function setupPrivateChat(friendName) {
	const privateChatContainer = document.getElementById('private-chats-container');
	privateChatContainer.innerHTML = `
		<h5 class="offcanvas-title" id="chatboxLabel">Private Message: ${friendName}</h5>
		<div class="chat-container2">
			<div class="chat-log2" id="chat-log-${friendName}"></div>
		</div>
	`;
	loadMessages(friendName);
	// Update send button click event
	document.getElementById('send-button2').onclick = () => sendPrivateMessage(friendName);
}

function startGame(event) {
	event.preventDefault();
	const friendName = document.getElementById('friendDropdown').getAttribute('data-friend');
	console.log(`Start a game with ${friendName}`);
	navigateTo('/gameplay');
}

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
	if (message !== '' && socket && socket.connected) {
		const messageData = {
			name: username,
			message: message
		};
		socket.emit('chat message', messageData);
		console.log('Message envoyé:', messageData);
		messageInput.value = '';
	} else if (!socket || !socket.connected) {
		console.error('La connexion au serveur de chat n\'est pas établie');
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

    // Créer l'élément username et définir ses attributs
    const usernameElement = document.createElement('span');
    usernameElement.classList.add('username-link');
    usernameElement.dataset.friend = msg.name;
    usernameElement.innerText = `[${msg.name}]`;

    // Activer le menu déroulant lorsque le nom d'utilisateur est cliqué
    usernameElement.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        const isOwnUsername = msg.name === username;
		if (isOwnUsername) {
			console.log('You click on you\'re name');
		}
        const dropdown = isOwnUsername ? document.getElementById('profileDropdown') : document.getElementById('friendDropdown_chat');
        const friendName = this.dataset.friend;
        usernameElement.classList.add('username-link', 'bold-username');

        // Masquer tous les menus déroulants visibles
        const visibleDropdowns = document.querySelectorAll('.dropdown-menu, .dropdown-menu_chat');
        visibleDropdowns.forEach(dropdown => {
            dropdown.style.display = 'none';
        });

        // Positionner le menu déroulant près de l'élément ami cliqué
        dropdown.style.top = `${event.clientY}px`;
        dropdown.style.left = `${event.clientX}px`;
        dropdown.style.display = 'block';

        // Stocker le nom de l'ami cliqué
        dropdown.dataset.friend = friendName;
        console.log('Message reçu:', msg);
    });

    // Créer l'élément message et définir son texte
    const messageTextElement = document.createElement('span');
    messageTextElement.innerText = `: ${msg.message}`;

    // Ajouter les éléments username et message à l'élément message
    messageElement.appendChild(usernameElement);
    messageElement.appendChild(messageTextElement);

    chatLog.appendChild(messageElement);

    // Faire défiler jusqu'en bas du chat log
    chatLog.scrollTop = chatLog.scrollHeight;

    // Console.log pour afficher le message reçu
    console.log('Message reçu dans le chat-log:', msg);
}

function sendPrivateMessage(friendName) {
    const input = document.getElementById(`message-input-${friendName}`);
    if (input) {
        const message = input.value.trim();
        if (message && socket && socket.connected) {
            socket.emit('private message', { to: friendName, message: message });
            const chatLog = privateChatLogs.get(friendName);
            if (chatLog) {
                chatLog.innerHTML += `<div><strong>You:</strong> ${message}</div>`;
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

// socket.on('connect_error', (error) => {
// 	console.error('Connection error:', error);
// 	// Gérez l'erreur de manière appropriée
// });

// function fetchAndDisplayFriends() {
//	 function callAPI(url, options) {
//		 return fetch(url, options)
//			 .then(response => {
//				 if (!response.ok) {
//					 throw new Error('Erreur réseau');
//				 }
//				 return response;
//			 })
//			 .catch(error => {
//				 console.error('Erreur lors de l\'appel API:', error);
//				 throw error;
//			 });
//	 }

//	 callAPI('http://localhost:8000/api/friends/', {
//		 method: 'GET',
//		 headers: {
//			 'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
//			 'Content-Type': 'application/json'
//		 }
//	 })
//	 .then(response => response.json())
//	 .then(data => {
//		 const friendsList = document.getElementById('friends');
//		 friendsList.innerHTML = '';

//		 if (Array.isArray(data)) {
//			 data.forEach(friend => {
//				 const li = document.createElement('li');
//				 li.className = 'list-group-item d-flex justify-content-between align-items-center';
//				 li.setAttribute('data-friend', friend.username);

//				 const statusDot = document.createElement('span');
//				 statusDot.className = `status-dot ${friend.is_online ? 'online' : 'offline'}`;

//				 const usernameSpan = document.createElement('span');
//				 usernameSpan.textContent = friend.username;

//				 li.appendChild(statusDot);
//				 li.appendChild(usernameSpan);
//				 li.addEventListener('click', handleFriendClick);
//				 friendsList.appendChild(li);
//			 });
//		 } else {
//			 console.error('Les données reçues ne sont pas un tableau:', data);
//		 }
//	 })
//	 .catch(error => {
//		 console.error('Erreur lors de la récupération des amis:', error);
//	 });
// }

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

// Function to show the friend request toast
function showFriendRequestToast(friendName, requestId) {
    const toastElement = document.querySelector('.toast');
    const toast = new bootstrap.Toast(toastElement, { autohide: false });

    document.getElementById('friend-name').textContent = friendName;

    const acceptButton = document.getElementById('accept-friend');
    const refuseButton = document.getElementById('refuse-friend');

    acceptButton.onclick = () => {
        acceptFriendRequest(requestId);
        toast.hide();
    };

    refuseButton.onclick = () => {
        refuseFriendRequest(requestId);
        toast.hide();
    };

    toast.show();
}

// Function to handle accepting a friend request
async function acceptFriendRequest(requestId) {
    try {
        const response = await fetch('/api/friend-requests/accept', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify({ requestId })
        });

        if (response.ok) {
            console.log(`Friend request ${requestId} accepted`);
            // You might want to update the UI here, e.g., add the friend to the friends list
        } else {
            console.error('Failed to accept friend request');
        }
    } catch (error) {
        console.error('Error accepting friend request:', error);
    }
}

// Function to handle declining a friend request
async function refuseFriendRequest(requestId) {
    try {
        const response = await fetch('/api/friend-requests/decline', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify({ requestId })
        });

        if (response.ok) {
            console.log(`Friend request ${requestId} declined`);
        } else {
            console.error('Failed to decline friend request');
        }
    } catch (error) {
        console.error('Error declining friend request:', error);
    }
}

// Function to check for new friend requests
async function checkForFriendRequests() {
    try {
        const response = await fetch('/api/friend-requests', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new TypeError("La réponse n'est pas du JSON valide");
        }

        const requests = await response.json();
        requests.forEach(request => {
            showFriendRequestToast(request.fromUserName, request.id);
        });
    } catch (error) {
        console.error('Error checking for friend requests:', error);
        // Gérer l'erreur de manière appropriée (par exemple, afficher un message à l'utilisateur)
    }
}


