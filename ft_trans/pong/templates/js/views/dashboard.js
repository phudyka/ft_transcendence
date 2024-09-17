import { navigateTo } from '../app.js';
import { logout } from '../utils/token.js';

let $player_name = generateRandomUsername();
let player_name = $player_name;
let socket;
const privateChatLogs = new Map();

export function generateRandomUsername() {
    const adjectives = ['Happy', 'Clever', 'Brave', 'Calm', 'Eager', 'Jolly', 'Kind', 'Lively', 'Proud', 'Wise'];
    const nouns = ['Lion', 'Eagle', 'Dolphin', 'Tiger', 'Panda', 'Fox', 'Wolf', 'Bear', 'Owl', 'Hawk'];

    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 100);

    return `${randomAdjective}${randomNoun}${randomNumber}`;
}

export function dashboard(player_name) {
	player_name = generateRandomUsername();
	$player_name = player_name;
	console.log(player_name);

	document.getElementById('ft_transcendence').innerHTML = `
	<div class="dashboard-container">

		<ul class="nav justify-content-between align-items-center">
				<a class="navbar-brand" href="#">
					<img src="${staticUrl}content/logo2.png" id="pongonlineLink" alt="Logo" width="30" height="30">
				</a>
			<li class="nav-item flex-grow-1 text-center">
				<a class="nav-link disabled"><strong>${player_name}</strong></a>
			</li>
			<li class="nav-item">
				<a class="nav-link" href="#" id="logoutLink">Logout</a>
			</li>
		</ul>
		<h3 id="header-dashboard" class="text-center">
			${$player_name}'s Dashboard
		</h3>
		<div class="text-center" id=profile-picture>
			<img src="https://i.ibb.co/FDg3t8m/avatar7.png" class="img-thumbnail rounded-circle d-flex justify-content-center" alt="Profile Picture" id=img_profile_pic>
		</div>
		<div id="profileDropdown" class="dropdown-menu" style="display: none;">
			<a class="dropdown-item" href="#" id="settings">Settings</a>
			<a class="dropdown-item" href="#" id="logoutLink">Logout</a>
		</div>
		<center>
			<iframe
				id="pong"
				title="Pong"
				width="1200"
				height="700"
				src="http://localhost:4000">
			</iframe>
		</center>
		<div class="container-fluid">
			<div class="row">
				<div class="col-md-3 sidebar" style="margin-left: inherit;">
					<ul id="friends" class="list-group">
						<li class="list-group-item" data-friend="Friend1">${generateRandomUsername()}</li>
						<li class="list-group-item" data-friend="Friend2">${generateRandomUsername()}</li>
						<li class="list-group-item" data-friend="Friend3">${generateRandomUsername()}</li>
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

				<div class="offcanvas offcanvas-end" data-bs-scroll="true" tabindex="-1" id="chatbox" aria-labelledby="chatboxLabel">
					<div class="offcanvas-header">
						<button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
					</div>
					<div class="offcanvas-body">
						<div id="private-chats-container"></div>
						<div class="input-container2">
							<textarea id="message-input2" placeholder="Type your message..." rows="1"></textarea>
							<button id="send-button2">Send</button>
						</div>
					</div>
				</div>

				</div>
				<div class="col-md-9 main-content">
					<div class="card">
						<div class="card-body">
							<div class="btn-group" id="play_button" "role=" group" aria-label="Basic example">
								<button type="button" id="game_alone" class="btn btn-primary">Play</button>
								<button type="button" id="game_friend" class="btn btn-primary">Play with friend</button>
								<button type="button" id="game_tournament" class="btn btn-primary">Play tournament</button>
							</div>
						</div>
					</div>
					<div class="card">
						<div class="chat-container">
							<div class="chat-log" id="chat-log">
							</div>
							<div class="input-container">
								<textarea id="message-input" placeholder="Type your message..." rows="1"></textarea>
								<button id="send-button">Send</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="toast align-items-center text-bg-primary border-0" role="alert" aria-live="assertive" aria-atomic="true" data-bs-autohide="false">
		  <div class="toast-header">
			<strong class="me-auto">Friend Request</strong>
		  </div>
		  <div class="toast-body">
			<p><span id="friend-name"></span> wants to add you as a friend.</p>
			<div class="mt-2 pt-2 border-top">
			  <button type="button" class="btn btn-success btn-sm" id="accept-friend">Accept</button>
			  <button type="button" class="btn btn-danger btn-sm" id="refuse-friend">Decline</button>
			</div>
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
		<footer class="py-3 my-4">
			<p class="text-center text-body-secondary">© 2024 42Company, Inc</p>
		</footer>
	</div>
	`;

	setupDashboardEvents(navigateTo, $player_name);
	initializeSocket();
	// fetchAndDisplayFriends();
}

function initializeSocket() {
	if (socket && socket.connected) {
        console.log('Connexion Socket.IO existante réutilisée');
        return;
    }
    // Générer un ID unique pour cette session de navigateur
    const browserSessionId = localStorage.getItem('browserSessionId') || generateUniqueId();
    localStorage.setItem('browserSessionId', browserSessionId);

    socket = io('http://localhost:3000', {
        transports: ['websocket'],
        query: {
            username: $player_name,
            browserSessionId: browserSessionId
        }
    });

    socket.on('connect', () => {
        console.log('Connecté au serveur de chat');
        socket.emit('register', $player_name);
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
		<button onclick="sendPrivateMessage('${friendName}')">Send</button>
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

	//Game with friend
	document.getElementById('game_friend').addEventListener('click', function (event) {
		event.preventDefault();
		console.log('Play game_friend button clicked');
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
	const messageInput = document.getElementById('message-input');
	const message = messageInput.value.trim();
	if (message !== '' && socket && socket.connected) {
		const messageData = {
			name: $player_name,
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
        const isOwnUsername = msg.name === $player_name;
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
	if (event.key === 'Enter' && !event.shiftKey) {
		event.preventDefault();
		sendMessage(event);
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

        if (response.ok) {
            const requests = await response.json();
            requests.forEach(request => {
                showFriendRequestToast(request.fromUserName, request.id);
            });
        }
    } catch (error) {
        console.error('Error checking for friend requests:', error);
    }
}

// Call this function when the dashboard loads
checkForFriendRequests();

// You might want to set up a polling mechanism to check for new requests periodically
setInterval(checkForFriendRequests, 600000); // Check every 10 minute

