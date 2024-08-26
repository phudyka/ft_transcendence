import { navigateTo } from '../app.js';

let $player_name;

export function dashboard(player_name) {
	$player_name = player_name;
	$player_name = 'Player';

	document.getElementById('ft_transcendence').innerHTML = `
	<div class="dashboard-container">


        <ul class="nav justify-content-between align-items-center">
                <a class="navbar-brand" href="#">
                    <img src="${staticUrl}content/logo2.png" id="pongonlineLink" alt="Logo" width="30" height="30">
                </a>
            <li class="nav-item">
                <a class="nav-link disabled">${player_name}</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" id="logoutLink">Logout</a>
            </li>
        </ul>


		<h3 id="header-dashboard" class="text-center">
			${$player_name}'s Dashboard
		</h3>
		<div class="text-center" id=profile-picture>
			<img src="https://i.ibb.co/FDg3t8m/avatar7.png" class="img-thumbnail rounded-circle d-flex justify-content-center" alt="Profile Picture">
		</div>
		<div class="container-fluid">
			<div class="row">
				<div class="col-md-3 sidebar" style="margin-left: inherit;">
					<ul id="friends" class="list-group">
						<li class="list-group-item" data-friend="Friend1">Friend1</li>
						<li class="list-group-item" data-friend="Friend2">Friend2</li>
						<li class="list-group-item" data-friend="Friend3">Friend3</li>
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
							<h5 class="offcanvas-title" id="chatboxLabel">Private Message</h5>
							<button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
						</div>
						<div class="offcanvas-body">
							<div class="chat-container2">
								<div class="chat-log2" id="chat-log2">
								</div>
								<div class="input-container2">
									<textarea id="message-input2" placeholder="Type your message..." rows="1"></textarea>
									<button id="send-button2">Send</button>
								</div>
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
	fetchAndDisplayFriends();
}

const socket = io('http://localhost:3000');

function setupDashboardEvents(navigateTo, player_name) {
	//Logout
	document.getElementById('logoutLink').addEventListener('click', function (event) {
		event.preventDefault();
		console.log('Logout successful');
		navigateTo('/login');
	});

	//Game solo
	document.getElementById('game_alone').addEventListener('click', function (event) {
		event.preventDefault();
		console.log('Play game_alone button clicked');
		navigateTo('/gameplay');
	});

	//Game with friend
	document.getElementById('game_friend').addEventListener('click', function (event) {
		event.preventDefault();
		console.log('Play game_friend button clicked');
		navigateTo('/gameplay_friends');
	});

	// Friend menu
	document.querySelectorAll('#friends .list-group-item').forEach(item => {
		item.addEventListener('click', handleFriendClick);
	});

	// Hide the dropdown menu when clicking outside of it
	document.addEventListener('click', hideDropdowns);

	// Prevent the dropdown menu from closing when clicking inside it
	document.getElementById('friendDropdown').addEventListener('click', (event) => event.stopPropagation());
	document.getElementById('friendDropdown_chat').addEventListener('click', (event) => event.stopPropagation());

	// Dropdown actions
	document.getElementById('sendMessage').addEventListener('click', showChatbox);
	document.getElementById('friendDropdown_chat').querySelector('#sendMessage').addEventListener('click', showChatbox);
	document.getElementById('startGame').addEventListener('click', startGame);

	// Chat functionnalitis
	document.getElementById('send-button').addEventListener('click', sendMessage);
	socket.on('chat_message', receiveMessage);

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

	setInterval(fetchAndDisplayFriends, 60000);
}

function scrollToBottom2() {
	const chatLog2 = document.getElementById('chat-log2');
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
}

function showChatbox(event) {
	event.preventDefault();
	var chatbox = new bootstrap.Offcanvas(document.getElementById('chatbox'));
	chatbox.show();
}

function startGame(event) {
	event.preventDefault();
	const friendName = document.getElementById('friendDropdown').getAttribute('data-friend');
	console.log(`Start a game with ${friendName}`);
	navigateTo('/gameplay');
}

function sendMessage(event) {
	event.preventDefault();
	const messageInput = document.getElementById('message-input');
	if (messageInput.value.trim() !== '') {
		const message = formatMessage(messageInput.value);
		socket.emit('chat_message', {name : $player_name, message : message});
	}
	messageInput.value = '';
}

function receiveMessage(msg) {
	const chatLog = document.getElementById('chat-log');
	const messageElement = document.createElement('div');

	// Créer l'élément username et définir ses attributs
	const usernameElement = document.createElement('span'); // Changé de 'a' à 'span'
	usernameElement.classList.add('username-link');
	usernameElement.dataset.friend = msg.name;
	usernameElement.innerText = `[${msg.name}]`;

	// Activer le menu déroulant lorsque le nom d'utilisateur est cliqué
	usernameElement.addEventListener('click', function (event) {
		event.preventDefault(); // Ajouté pour empêcher le comportement par défaut
		event.stopPropagation();
		const dropdown = document.getElementById('friendDropdown_chat');
		const friendName = this.dataset.friend; // Utilisez dataset au lieu de getAttribute
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
		dropdown.dataset.friend = friendName; // Utilisez dataset au lieu de setAttribute
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
}

function sendPrivateMessage(event) {
	event.preventDefault();
	const messageInput2 = document.getElementById('message-input2');
	if (messageInput2.value.trim() !== '') {
		const message = formatMessage(messageInput2.value);
		const chatLog2 = document.getElementById('chat-log2');
		const messageElement = document.createElement('div');

		// Créer l'élément username
		const usernameElement = document.createElement('span');
		usernameElement.classList.add('username-link');
		usernameElement.dataset.friend = $player_name;
		usernameElement.innerText = `[${$player_name}]`;

		// Créer l'élément message
		const messageTextElement = document.createElement('span');
		messageTextElement.innerText = `: ${message}`;

		usernameElement.classList.add('username-link', 'bold-username');
		// Ajouter les éléments username et message à l'élément message
		messageElement.appendChild(usernameElement);
		messageElement.appendChild(messageTextElement);

		chatLog2.appendChild(messageElement);
		messageInput2.value = '';
		scrollToBottom2();
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

socket.on('connect_error', (error) => {
	console.error('Connection error:', error);
	// Gérez l'erreur de manière appropriée
});

function fetchAndDisplayFriends() {
    callAPI('http://localhost:8000/api/friends/')
        .then(data => {
            const friendsList = document.getElementById('friends');
            friendsList.innerHTML = '';

            data.forEach(friend => {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.setAttribute('data-friend', friend.username);
                li.textContent = friend.username;
                li.addEventListener('click', handleFriendClick);
                friendsList.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des amis:', error);
        });
}