function dashboard(navigateTo, $player_name) {
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
			<div class="col-md-3 sidebar">
				<ul id="friends" class="list-group">
					<li class="list-group-item" data-friend="Friend1">Friend1</li>
					<li class="list-group-item" data-friend="Friend2">Friend2</li>
					<li class="list-group-item" data-friend="Friend3">Friend3</li>
				</ul>
				<div id="friendDropdown" class="dropdown-menu" style="display: none;">
					<a class="dropdown-item" href="#" id="sendMessage">Send Private Message</a>
					<a class="dropdown-item" href="#" id="startGame">Start a Game</a>
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
					<f/div>
					</div>
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
            const rect = this.getBoundingClientRect();
            
            // Position the dropdown near the clicked friend item
            dropdown.style.top = `${rect.bottom}px`;
            dropdown.style.left = `${rect.left}px`;
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
    });

    // Prevent the dropdown menu from closing when clicking inside it
    document.getElementById('friendDropdown').addEventListener('click', function (event) {
        event.stopPropagation();
    });

    // Event handlers for dropdown menu actions
    document.getElementById('sendMessage').addEventListener('click', function (event) {
        event.preventDefault();
        const friendName = document.getElementById('friendDropdown').getAttribute('data-friend');
        console.log(`Send message to ${friendName}`);
        chat(navigateTo, $player_name, friendName);
    });

    document.getElementById('startGame').addEventListener('click', function (event) {
        event.preventDefault();
        const friendName = document.getElementById('friendDropdown').getAttribute('data-friend');
        console.log(`Start a game with ${friendName}`);
		gameplay(navigateTo, $player_name);
    });

	// Chat functionality
	document.getElementById('send-button').addEventListener('click', function (event) {
		event.preventDefault();
		const messageInput = document.getElementById('message-input');
		const message = formatMessage(messageInput.value);
		const chatLog = document.getElementById('chat-log');
		const messageElement = document.createElement('div');
		messageElement.textContent = message;
		chatLog.appendChild(messageElement);
		messageInput.value = '';
		// adjustInputHeight();
	});

	// Send message when pressing Enter key
	document.addEventListener("keydown", function (event) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			document.getElementById('send-button').click();
		}
	});
}



function formatMessage(message) {
	if (message.startsWith("```")) {
		return `<pre>${message}</pre>`;
	}
	message = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
	return message.replace(/(```[\s\S]*?```)/g, '<pre>$1</pre>');
  }

  // Adjust the height of the input field based on its content
function adjustInputHeight() {
	messageInput.style.height = 'auto';
	messageInput.style.height = `${messageInput.scrollHeight}px`;
}
