function login(navigateTo) {
	document.getElementById('ft_transcendence').innerHTML = `
	<img src="content/logo_400_400.png" id="logo_pong_login" alt="Logo" width="320" height="320" style="margin-bot:10%;">
    	<div id="loginAlert" class="alert alert-danger d-none" role="alert">
      	Invalid username or password!
    	</div>
	<div class="container login-container">
	  <form id="loginForm">
		<p>
		  <label for="username" style="margin-top:3%;">username</label>
		  <input type="text" class="value="" placeholder="Enter Username" id="username">
		</p>
		<p>
		  <label for="password">password</label>
		  <div class="password-wrapper">
			<input type="password" value="" placeholder="Enter Password" id="password" class="password">
			<button class="unmask" type="button" title="Mask/Unmask password to check content">
			  <i class="fas fa-lock"></i>
			</button>
		  </div>
		</p>
		<button type="submit" class="btn btn-primary">Login</button>
		<div class="text-center">
			<button type="button" id="create_account" class="btn btn-outline-light">Create account</button>
		</div>
	  </form>
	</div>
	<div class="modal fade" id="errorModal" tabindex="-1" aria-labelledby="errorModalLabel" aria-hidden="true">
	  <div class="modal-dialog">
		<div class="modal-content">
		  <div class="modal-header">
			<h5 class="modal-title" id="errorModalLabel">Login Error</h5>
			<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
		  </div>
		  <div class="modal-body">
			Invalid username or password
		  </div>
		  <div class="modal-footer">
			<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
		  </div>
		</div>
	  </div>
	</div>
	<footer class="py-3 my-4">
		<p class="text-center text-body-secondary">© 2024 42Company, Inc</p>
	</footer>
	`;
	attachEventHandlers(navigateTo);
}

function attachEventHandlers(navigateTo) {
	/* navigate to dashboard page when login is successful */
	document.getElementById('loginForm').addEventListener('submit', function (event) {
	  event.preventDefault();
	  console.log('click to login button');
	  const username = document.getElementById('username').value;
	  const password = document.getElementById('password').value;

	  if (username === '' && password === '') {
		console.log('Login successful');
		navigateTo('dashboard', username);
	  } else {
		const loginAlert = document.getElementById('loginAlert');
		loginAlert.classList.remove('d-none');
	  }
	});

	/* navigate to create account page when create account is clicked */
	const createButton = document.getElementById('create_account');
	if (createButton) {
		createButton.addEventListener('click', function (event) {
			event.preventDefault();
			console.log('click to create account button');
			navigateTo('register');
		});
	}

	/* lock button */
	document.addEventListener('click', function (event) {
		if (event.target.classList.contains('unmask') || event.target.closest('.unmask')) {
		  const button = event.target.closest('.unmask');  // Target the entire button
		  const input = button.previousElementSibling;
		  if (input.type === 'password') {
			input.type = 'text';
			button.querySelector('i').classList.remove('fa-lock');
			button.querySelector('i').classList.add('fa-lock-open');
		  } else {
			input.type = 'password';
			button.querySelector('i').classList.remove('fa-lock-open');
			button.querySelector('i').classList.add('fa-lock');
		  }
		}
	  });
}
