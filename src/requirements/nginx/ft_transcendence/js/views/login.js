function login(navigateTo) {
	document.getElementById('ft_transcendence').innerHTML = `
	<h1>ft_pong_online</h1>
    	<div id="loginAlert" class="alert alert-danger d-none" role="alert">
      	Invalid username or password!
    	</div>
	<div class="container login-container">
	  <form id="loginForm">
		<p>
		  <label for="username">username</label>
		  <input type="text" value="" placeholder="Enter Username" id="username">
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
		<button type="submit" class="btn btn-primary btn-block">Login</button>
		<div class="text-center">
		  <a href="" data-link="/views/register">create account</a>
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
  
	/* navigate to dashboard page when login is successful */
	document.getElementById('loginForm').addEventListener('submit', function (event) {
	  event.preventDefault();
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
	document.getElementById('create').addEventListener('click', function (event) {
	  event.preventDefault();
	  navigateTo('/views/register');
	});


	

  }