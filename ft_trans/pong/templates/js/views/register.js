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
                <div class="choose-avatar">
                    <div class="avatars-container">
                        <span class="left"></span>
                        <div class="avatars">
                            <div class="avatar-item" style="background-image: url('https://i.ibb.co/C2WLdyY/avatar1.png');">
                                <span id="text-avatar">Choose</span>
                            </div>
                            <div class="avatar-item" style="background-image: url('https://i.ibb.co/0t3JTMz/avatar2.png');">
                                <span id="text-avatar">Choose</span>
                            </div>
                            <div class="avatar-item" style="background-image: url('https://i.ibb.co/K08BjJx/avatar3.png');">
                                <span id="text-avatar">Choose</span>
                            </div>
                            <div class="avatar-item" style="background-image: url('https://i.ibb.co/6XW1X2L/avatar4.png');">
                                <span id="text-avatar">Choose</span>
                            </div>
                            <div class="avatar-item" style="background-image: url('https://i.ibb.co/DVfTxB2/avatar5.png');">
                                <span id="text-avatar">Choose</span>
                            </div>
                            <div class="avatar-item" style="background-image: url('https://i.ibb.co/Bzvqgg3/avatar6.png');">
                                <span id="text-avatar">Choose</span>
                            </div>
                            <div class="avatar-item" style="background-image: url('https://i.ibb.co/FDg3t8m/avatar7.png');">
                                <span id="text-avatar">Choose</span>
                            </div>
                        </div>
                        <span class="right"></span>
                    </div>
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

        const selectedAvatar = document.querySelector('.avatar-item.current').style.backgroundImage;

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

    const prev = document.querySelector('.left');
    const next = document.querySelector('.right');
    const container = document.querySelector('.avatars');
    const avatars = document.querySelectorAll('.avatars-container .avatar-item');
    let currentIndex = Math.floor(avatars.length/2);
    const val = (avatars.length - 1 - Math.floor(avatars.length/2)) * 195;
    let translateVal = 0;

    for (let i = 0; i < avatars.length; i++) {
        if (i === Math.floor(avatars.length/2)) {
            avatars[i].classList.add('current');
        }
        avatars[i].addEventListener('click', () => {
            // Logique de sélection d'avatar
            avatars.forEach(av => av.classList.remove('current'));
            avatars[i].classList.add('current');
        });
    }

    let defaultVal = 0;
    if (avatars.length % 2 === 0) {
        defaultVal = 90;
        translateVal -= 90;
        container.style.transform = `translateX(${translateVal}px)`;
    }

    prev.addEventListener('click', () => {
        if (currentIndex - 1 < 0) {
            avatars[currentIndex].classList.remove('current');
            avatars[avatars.length - 1].classList.add('current');
            currentIndex = avatars.length - 1;
            translateVal = -val - defaultVal;
            container.style.transform = `translateX(${translateVal}px)`;
        } else {
            avatars[currentIndex].classList.remove('current');
            avatars[currentIndex - 1].classList.add('current');
            currentIndex -= 1;
            translateVal += 195;
            container.style.transform = `translateX(${translateVal}px)`;
        }
    });

    next.addEventListener('click', () => {
        if (currentIndex + 1 >= avatars.length) {
            avatars[currentIndex].classList.remove('current');
            avatars[0].classList.add('current');
            currentIndex = 0;
            translateVal = val + defaultVal;
            container.style.transform = `translateX(${translateVal}px)`;
        } else {
            avatars[currentIndex].classList.remove('current');
            avatars[currentIndex + 1].classList.add('current');
            currentIndex += 1;
            translateVal -= 195;
            container.style.transform = `translateX(${translateVal}px)`;
        }
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
