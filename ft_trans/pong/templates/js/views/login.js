import { navigateTo } from '../app.js';
import { getCsrfToken } from '../utils/token.js';

export function login() {
    console.log('login view');
    document.getElementById('ft_transcendence').innerHTML = `
    <div class="container login-container">
    <img src="${staticUrl}content/logo_400_400.png" id="logo_pong_login" alt="Logo" width="200" height="200">
    <form id="loginForm">
        <p>
            <label for="username">Username</label>
            <input type="text" placeholder="Enter Username" id="username">
        </p>
        <p>
            <label for="password">Password</label>
            <div class="password-wrapper">
                <input type="password" placeholder="Enter Password" id="password" class="password">
                <button class="unmask" type="button" title="Mask/Unmask password to check content">
                    <i class="fas fa-lock"></i>
                </button>
            </div>
        </p>
        <button type="submit" class="btn btn-primary">Login</button>
        <button type="submit" class="btn btn-primary">Login with 42</button>
        <div>
        <button type="submit" class="btn btn-primary" style="margin-top: 5px;">Login with 42</button>
        <div class="text-center">
            <button type="button" id="create_account" class="btn btn-outline-light">Create account</button>
        </div>
    </form>
</div>
<footer>
    <p>© 2024 42Company, Inc</p>
</footer>
    `;
    attachEventLoginPage(navigateTo);
    checkRegistrationSuccess();
}

function attachEventLoginPage(navigateTo) {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('create_account').addEventListener('click', function(event) {
        event.preventDefault();
        navigateTo('/register');
    });

    const createButton = document.getElementById('create_account');
    if (createButton) {
        createButton.addEventListener('click', function(event) {
            event.preventDefault();
            console.log('click to create account button');
            navigateTo('/register');
        });
    }

    document.getElementById('login_with_42').addEventListener('click', function(event) {
        event.preventDefault();
        console.log('"Login with 42" button clicked');
        window.location.href = '/api/auth/42/';
    });

    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('unmask') || event.target.closest('.unmask')) {
            const button = event.target.closest('.unmask');
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

    document.addEventListener("keydown", function(event) {
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
        console.log("CSRF token obtenu :", csrfToken);
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
            console.log('Connexion réussie');
            localStorage.setItem('csrfToken', csrfToken);
            localStorage.setItem('accessToken', data.access);
            localStorage.setItem('refreshToken', data.refresh);
            localStorage.setItem('username', data.username);
            localStorage.setItem('display_name', data.display_name);
            localStorage.setItem('avatar_url', data.avatar_url);
            navigateTo('/dashboard');
        } else {
            console.error('Échec de la connexion :', data.message);
            showLoginToastErr(data.message);
        }
    } catch (error) {
        console.error('Erreur :', error);
        showLoginToastErr('Une erreur est survenue. Veuillez réessayer.');
    }
}

function showLoginToastErr(message) {
    const toastEl = document.getElementById('loginToast');
    const toast = new bootstrap.Toast(toastEl);
    const toastBody = toastEl.querySelector('.toast-body');
    toastBody.textContent = message;
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
