function dashboard(navigateTo, $player_name) {

	$player_name = 'faperac';

	document.getElementById('ft_transcendence').innerHTML = `
	<div class="dashboard-container">
		<ul class="nav justify-content-center">
			<a class="navbar-brand" href"#">
			<img src="content/logo2.png" alt="Logo" width="30" height="30" class="d-inline-block align-text-top">
			<a class="nav-link disabled">pongonline</a>
			<a class="nav-link disabled">${$player_name}</a>
			<a class="nav-link" href="" id="logoutLink">Logout</a>
		</ul>
		<h3 id ="header-dashboard"class="text-center">
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
							<h5 class="card-title">${$player_name}</h5>
							<p class="card-text">Here i put data from the game ; game win ; game lose ; niveau de l'ia la plus eleve gagne; etcc  ${$player_name}</p>
						</div>
					</div>
					<div class="card">
						<div class="card-body">
							<div class="btn-group" id="play_button" "role="group" aria-label="Basic example">
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
	</div>`;

	attachEventHandlers3(navigateTo, $player_name);
  }

function attachEventHandlers3(navigateTo, $player_name) {
	const socket = io('http://localhost:3000');



	// Listen for messages from the server


    // Navigate to login page when logout is clicked
    document.getElementById('logoutLink').addEventListener('click', function (event) {
        event.preventDefault();
        console.log('Logout successful');
        navigateTo('login');
    });

    document.getElementById('game_alone').addEventListener('click', function (event) {
        event.preventDefault();
        console.log('Play game_alone button clicked');
        navigateTo('gameplay', $player_name);
    });

    document.getElementById('game_friend').addEventListener('click', function (event) {
        event.preventDefault();
        console.log('Play game_friend button clicked');
        navigateTo('gameplay_friends', $player_name);
    });

    // friend menu
    document.querySelectorAll('#friends .list-group-item').forEach(item => {
        item.addEventListener('click', function (event) {
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
        });
    });

    // Hide the dropdown menu when clicking outside of it
    document.addEventListener('click', function () {
		const dropdown = document.getElementById('friendDropdown');
		if (dropdown) {
			dropdown.style.display = 'none';
		}

		const dropdown2 = document.getElementById('friendDropdown_chat');
		if (dropdown2) {
			dropdown2.style.display = 'none';
		}
    });


    // Prevent the dropdown menu from closing when clicking inside it
    document.getElementById('friendDropdown').addEventListener('click', function (event) {
        event.stopPropagation();
    });

	document.getElementById('friendDropdown_chat').addEventListener('click', function (event) {
        event.stopPropagation();
    });

    // Event handlers for dropdown menu actions
    document.getElementById('sendMessage').addEventListener('click', function (event) {
        event.preventDefault();
		var chatbox = new bootstrap.Offcanvas(document.getElementById('chatbox'));
		if (!chatbox)
			{console.log('chatbox is null');}
		chatbox.show();
    });

	document.getElementById('friendDropdown_chat').querySelector('#sendMessage').addEventListener('click', function (event) {
		event.preventDefault();
		var chatbox = new bootstrap.Offcanvas(document.getElementById('chatbox'));
		if (!chatbox)
			{console.log('chatbox is null');}
		chatbox.show();
	});


    document.getElementById('startGame').addEventListener('click', function (event) {
        event.preventDefault();
        const friendName = document.getElementById('friendDropdown').getAttribute('data-friend');
        console.log(`Start a game with ${friendName}`);
		gameplay(navigateTo, $player_name);
    });

	// Chat global
	// document.getElementById('send-button').addEventListener('click', function (event) {
	// 	event.preventDefault();
	// 	const messageInput = document.getElementById('message-input');
	// 	if (messageInput.value.trim() !== '') {

	// 		const message = formatMessage(messageInput.value, $player_name);
	// 		const chatLog = document.getElementById('chat-log');
	// 		const messageElement = document.createElement('div');

	// 		// socket.emit('chat_message', {name : $player_name, message : message});

	// 		// Create the username element and set its attributes
	// 		const usernameElement = document.createElement('a');
	// 		usernameElement.href = '#';
	// 		usernameElement.classList.add('username-link');
	// 		usernameElement.dataset.friend = $player_name;
	// 		usernameElement.innerText = `[${$player_name}]`;
	// 		//active the dropdown menu when username is clicked
	// 		usernameElement.addEventListener('click', function (event) {
	// 			event.stopPropagation();
	// 			const dropdown = document.getElementById('friendDropdown_chat');
	// 			const friendName = this.getAttribute('data-friend');
	// 			const rect = this.getBoundingClientRect();

	// 			// Hide all visible dropdowns
	// 			const visibleDropdowns = document.querySelectorAll('.dropdown-menu, .dropdown-menu_chat');
	// 			visibleDropdowns.forEach(dropdown => {
	// 				dropdown.style.display = 'none';
	// 			});

	// 			// Position the dropdown near the clicked friend item
	// 			dropdown.style.top = `${event.clientY}px`; //click position
	// 			dropdown.style.left = `${event.clientX}px`;
	// 			dropdown.style.display = 'block';

	// 			// Store the clicked friend's name
	// 			dropdown.setAttribute('data-friend', friendName);
	// 		});

	// 		// Create the message element and set its text
	// 		const messageTextElement = document.createElement('span');
	// 		messageTextElement.innerText = ` : ${messageInput.value}`;

	// 		// Append the username and message elements to the message element
	// 		messageElement.appendChild(usernameElement);
	// 		messageElement.appendChild(messageTextElement);

	// 		chatLog.appendChild(messageElement);
	// 		messageInput.value = '';
	// 		scrollToBottom();
	// 	}
	// });

	document.getElementById('send-button').addEventListener('click', function (event) {
        event.preventDefault();
        const messageInput = document.getElementById('message-input');
        if (messageInput.value.trim() !== '') {
            const message = formatMessage(messageInput.value, $player_name);
            socket.emit('chat_message', {name : $player_name, message : message});
        }
		messageInput.value = '';
    });

	socket.on('chat_message', (msg) => {
		const chatLog = document.getElementById('chat-log');
		const messageElement = document.createElement('div');

		// Créer l'élément username et définir ses attributs
		const usernameElement = document.createElement('a');
		usernameElement.href = '#';
		usernameElement.classList.add('username-link');
		usernameElement.dataset.friend = msg.name;
		usernameElement.innerText = `[${msg.name}]`;

		// Activer le menu déroulant lorsque le nom d'utilisateur est cliqué
		usernameElement.addEventListener('click', function (event) {
			event.stopPropagation();
			const dropdown = document.getElementById('friendDropdown_chat');
			const friendName = this.getAttribute('data-friend');

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
			dropdown.setAttribute('data-friend', friendName);
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
	});



	//private message with friend
	document.getElementById('send-button2').addEventListener('click', function (event) {
		event.preventDefault();
		const messageInput2 = document.getElementById('message-input2');
		if (messageInput2.value.trim() !== '') {
		  const message = formatMessage(messageInput2.value, $player_name);
		  const chatLog2 = document.getElementById('chat-log2');
		  const messageElement = document.createElement('div');
		  messageElement.innerText = message;
		  chatLog2.appendChild(messageElement);
		  messageInput2.value = '';
		  scrollToBottom2();
		}
	  });

	// Send message when pressing Enter key
	document.addEventListener("keydown", function (event) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			document.getElementById('send-button').click();
		}
	});

	document.addEventListener("keydown", function (event) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			document.getElementById('send-button2').click();
		}
	});


	//test

    // socket.on('chat_message', (msg) => {
    //     const chatLog = document.getElementById('chat-log');
    //     const messageElement = document.createElement('div');
    //     messageElement.innerHTML = `<strong>${msg.name}</strong>: ${msg.message}`;
    //     chatLog.appendChild(messageElement);
    //     chatLog.scrollTop = chatLog.scrollHeight;
    // });

	// test end

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

	//navigateTo profile page when view profile is clicked
	document.getElementById('friendDropdown').querySelector('#viewProfile').addEventListener('click', function (event) {
		event.preventDefault();
		const friendName = document.getElementById('friendDropdown').getAttribute('data-friend');
		console.log(`View profile of ${friendName}`);
		navigateTo('profile', $player_name, friendName);
	});

	document.getElementById('friendDropdown_chat').querySelector('#viewProfile').addEventListener('click', function (event) {
		event.preventDefault();
		const friendName = document.getElementById('friendDropdown').getAttribute('data-friend');
		console.log(`View profile of ${friendName}`);
		navigateTo('profile', $player_name, friendName);
	});

}

function scrollToBottom() {
    const chatLog = document.getElementById('chat-log');
    chatLog.scrollTop = chatLog.scrollHeight;
}

function scrollToBottom2() {
	const chatLog2 = document.getElementById('chat-log2');
	chatLog2.scrollTop = chatLog2.scrollHeight;
  }

function formatUsername(username) {
    return `<a href="#" class="username-link" data-friend="${username}">${username}</a>`;
}

function formatMessage(message, playerName) {
	/* for no html injection */
	if (message.startsWith("```")) {
		return `<pre>${message}</pre>`;
	}

	/* syntax : [player_name] : message */
	message = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
	message = message.replace(/(```[\s\S]*?```)/g, '<pre>$1</pre>');

	return `${message}`;
  }

  // Adjust the height of the input field based on its content
function adjustInputHeight() {
	messageInput.style.height = 'auto';
	messageInput.style.height = `${messageInput.scrollHeight}px`;
}


