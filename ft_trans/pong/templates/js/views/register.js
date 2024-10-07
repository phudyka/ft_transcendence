import { navigateTo } from '../app.js';
import { getCsrfToken } from '../utils/token.js';

export function register() {
    document.getElementById('ft_transcendence').innerHTML = `
    <div class="container register-container">
        <h1 class="register-title" style="margin-top: 5%;">Create Your Account</h1>
        <form id="registerForm">
            <div class="form-group">
                <label for="username" class="form-label">Username</label>
                <input type="text" id="username" placeholder="Enter your username" required class="form-input">
            </div>
            <div class="form-group">
                <label for="email" class="form-label">Email</label>
                <input type="email" id="email" placeholder="Enter your email" required class="form-input">
            </div>
            <div class="form-group password-group">
                <label for="password" class="form-label">Password</label>
                <div class="password-wrapper">
                    <input type="password" id="password" placeholder="Enter your password" required class="form-input">
                    <button type="button" class="toggle-password">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
            <div class="form-group password-group">
                <label for="confirmPassword" class="form-label">Confirm Password</label>
                <div class="password-wrapper">
                    <input type="password" id="confirmPassword" placeholder="Confirm your password" required class="form-input">
                    <button type="button" class="toggle-password">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>

            <div class="form-group">
                <label for="avatar" class="form-label">Choose your Avatar</label>
                <div id="avatar-carousel" class="carousel slide" data-ride="carousel" data-interval="false">
                    <div class="carousel-inner">
                        <div class="carousel-item active">
                            <img src="https://i.ibb.co/C2WLdyY/avatar1.png" class="d-block avatar-image" alt="Avatar 1">
                        </div>
                        <div class="carousel-item">
                            <img src="https://i.ibb.co/0t3JTMz/avatar2.png" class="d-block avatar-image" alt="Avatar 2">
                        </div>
                        <!-- Ajoute ici d'autres avatars -->
                    </div>
                    <a class="carousel-control-prev" href="#avatar-carousel" role="button" data-slide="prev">
                        <span class="carousel-control-prev-icon"></span>
                    </a>
                    <a class="carousel-control-next" href="#avatar-carousel" role="button" data-slide="next">
                        <span class="carousel-control-next-icon"></span>
                    </a>
                </div>
            </div>

            <div class="form-actions">
                <button id="registerButton" type="submit" class="btn-primary">Register</button>
                <button id="registerButton42" type="button" class="btn-secondary">Register with 42</button>
            </div>
        </form>
        <button id="arrowbackregister" class="btn-back">Back</button>
    </div>
    <footer class="footer">
        <p>© 2024 42Company, Inc</p>
    </footer>
    `;
    setupRegisterEvents(navigateTo);
}

function setupRegisterEvents(navigateTo) {
    document.addEventListener('click', function (event) {
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

    document.getElementById('registerForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            alert('Passwords do not match. Please try again.');
            return;
        }

        const selectedAvatar = document.querySelector('.carousel-item.active img').src;

        console.log('Registering user:', username, email, password, selectedAvatar);
        try {
            const csrfToken = await getCsrfToken();
            console.log('CSRF token:', csrfToken);
            const response = await fetch('/api/register/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password,
                    avatar_url: selectedAvatar
                }),
                credentials: 'include',
            });

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await response.json();
                if (data.success) {
                    localStorage.setItem('accessToken', data.access);
                    localStorage.setItem('refreshToken', data.refresh);
                    localStorage.setItem('registrationSuccess', 'Account created successfully. Please log in.');
                    navigateTo('/login');
                } else {
                    alert('Error during registration: ' + data.error);
                }
            } else {
                console.error("Received non-JSON response:", await response.text());
                alert('Received an unexpected response from the server. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during registration: ' + error.message);
        }
    });

    document.getElementById('arrowbackregister').addEventListener('click', function(event) {
        event.preventDefault();
        navigateTo('/login');
    });

    //carrousel
    document.getElementById('carousel-control-next-icon').addEventListener('click', function(event) {
        event.preventDefault();
        $('#carouselExampleControls').carousel('next');
    });

    document.getElementById('carousel-control-prev-icon').addEventListener('click', function(event) {
        event.preventDefault();
        $('#carouselExampleControls').carousel('prev');
    });

    document.getElementById('registerbutton42').addEventListener('click', function(event) {
        event.preventDefault();
        window.location.href = '/api/auth/42/';
    });
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

