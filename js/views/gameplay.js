function gameplay(navigateTo, $player_name) {
	document.getElementById('ft_transcendence').innerHTML = `
	<ul class="nav navbar-expand-lg justify-content-center">
		<a class="nav-link disabled">pongonline</a>
		<a class="nav-link disabled">${$player_name}</a>
		<a class="nav-link" href="" id="logoutLink">Logout</a>
	</ul>
	<div class="container game-container">
		<div class="game-area">
		  <!-- Your game logic here (canvas, etc.) -->
		</div>
	  </div>
	  <footer class="py-3 my-4">
	  	<p class="text-center text-body-secondary">© 2024 42Company, Inc</p>
  		</footer>
	`;

	attachEventHandlers2(navigateTo, $player_name);
  }

  function attachEventHandlers2(navigateTo, $player_name) {
	//Navigate to dashboard is exit is clicked
	document.querySelector('.btn-danger').addEventListener('click', function (event) {
		event.preventDefault();
		console.log('Exit button clicked');
		navigateTo('dashboard', $player_name);
	});
  }

