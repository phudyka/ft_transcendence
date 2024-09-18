import { navigateTo } from '../app.js';
import { getCsrfToken } from '../utils/token.js';

export function login() {
	console.log('login view');
	document.getElementById('ft_transcendence').innerHTML = `
	<img src="${staticUrl}content/logo_400_400.png" id="logo_pong_login" alt="Logo" width="250" height="250" style="margin-bot:10%;">
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
	<div class="position-fixed top-0 start-50 translate-middle-x p-3" style="z-index: 11">
		<div id="loginToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
		<div class="toast-header bg-danger text-white">
		  <strong class="me-auto">Login Error</strong>
		  <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
		</div>
		<div class="toast-body">
		  Invalid username or password
		</div>
		</div>
	</div>
	<div class="position-fixed top-0 start-50 translate-middle-x p-3" style="z-index: 11">
        <div id="successToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header bg-success text-white">
          <strong class="me-auto">Success</strong>
          <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
          Account created successfully. Please log in.
        </div>
        </div>
    </div>
	<footer class="py-3 my-4">
		<p class="text-center text-body-secondary">© 2024 42Company, Inc</p>
	</footer>
	`;
	attachEventLoginPage(navigateTo);
	checkRegistrationSuccess();
}

function attachEventLoginPage(navigateTo) {
	/* navigate to dashboard page when login is successful */

	document.getElementById('loginForm').addEventListener('submit', handleLogin);

	document.getElementById('create_account').addEventListener('click', function (event) {
		event.preventDefault();
		navigateTo('/register');
	});

	/* navigate to create account page when create account is clicked */
	const createButton = document.getElementById('create_account');
	if (createButton) {
		createButton.addEventListener('click', function (event) {
			event.preventDefault();
			console.log('click to create account button');
			navigateTo('/register');
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

	  document.addEventListener("keydown", function (event) {
		//if enter key is presset and login form is complete then submit the form
		if (event.key === "Enter") {
			document.getElementById('loginForm').dispatchEvent(new Event('submit'));
		}
	});
}

async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const csrfToken = await getCsrfToken();
        console.log("CSRF token obtained:", csrfToken);

        const response = await fetch('/api/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include',
        });

        const data = await response.json();

        if (data.success) {
            console.log('Login successful');
            localStorage.setItem('username', data.username);
			localStorage.setItem('display_name', data.display_name);
            localStorage.setItem('avatar_url', data.avatar_url);
            navigateTo('/dashboard');
        } else {
            console.error('Login failed:', data.message);
            showLoginToastErr(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        showLoginToastErr('An error occurred. Please try again.');
    }
}

function showLoginToastErr() {
	const toastEl = document.getElementById('loginToast');
	const toast = new bootstrap.Toast(toastEl);
	toast.show();
}

function checkRegistrationSuccess() {
    const successMessage = localStorage.getItem('registrationSuccess');
    if (successMessage) {
        showSuccessToast(successMessage);
        localStorage.removeItem('registrationSuccess');
    }
}

function showSuccessToast(message) {
    const toastEl = document.getElementById('successToast');
    const toastBody = toastEl.querySelector('.toast-body');
    toastBody.textContent = message;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

function showLoginToast(message) {
    const toastEl = document.getElementById('loginToast');
    const toastBody = toastEl.querySelector('.toast-body');
    toastBody.textContent = message;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}
