function chat(navigateTo, $player_name, friend_name) {
	document.getElementById('ft_transcendence').innerHTML = `
	  <div class="container-fluid chat-container">
		<div class="row">
		<div class="col-md-3 sidebar">
			<h4 id="title_dashboard">Friends</h4>
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
		  <div class="col-md-9 chat-window">
			<div class="messages">
			  <div class="message">
				<strong>Friend 1:</strong> Hello!
			  </div>
			  <div class="message">
				<strong>You:</strong> Hi there!
			  </div>
			</div>
			<div class="message-input">
			  <input type="text" class="form-control" placeholder="Type a message...">
			  <button class="btn btn-primary">Send</button>
			</div>
			<button id="backToDashboard" class="btn btn-primary">Back to Dashboard</button>
		  </div>
		</div>
	  </div>
	`;
	attachEventHandlers5(navigateTo);
}

function attachEventHandlers5(navigateTo) {
	//Navigate to dashboard is backToDashboard is clicked
	document.getElementById('backToDashboard').addEventListener('click', function (event) {
		event.preventDefault();
		console.log('Back to dashboard');
		navigateTo('dashboard');
  });
}
