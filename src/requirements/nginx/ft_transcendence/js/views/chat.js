function chat() {
	document.getElementById('ft_transcendence').innerHTML = `
	  <div class="container-fluid chat-container">
		<div class="row">
		  <div class="col-md-3 friends-list">
			<h4>Friends</h4>
			<ul class="list-group">
			  <li class="list-group-item">Friend 1</li>
			  <li class="list-group-item">Friend 2</li>
			  <li class="list-group-item">Friend 3</li>
			</ul>
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
		  </div>
		</div>
	  </div>
	`;
  }
