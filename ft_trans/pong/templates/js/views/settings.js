import { navigateTo } from '../app.js';
import { logout } from '../utils/token.js';

const player_name = localStorage.getItem('player_name') || 'Player';

export function settings() {
    const username = localStorage.getItem('username');

    if (!username) {
        navigateTo('/login');
        return;
    }
    console.log('settings view');

    document.getElementById('ft_transcendence').innerHTML = `
        <div class="dashboard-container">
            <ul class="nav justify-content-between align-items-center">
                <a class="navbar-brand" href="#">
                    <img src="${staticUrl}content/logo2.png" id="pongonlineLink" alt="Logo" width="30" height="30">
                </a>
                <li class="nav-item">
                    <a class="nav-link disabled">${player_name}</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" id="logoutLink">Logout</a>
                </li>
            </ul>
            <h3 id="header-dashboard" class="text-center">User Settings</h3>
            <div class="container mt-4">
                <form id="settingsForm">
                    <div class="mb-3">
                        <label for="displayName" class="form-label">Display Name</label>
                        <input type="text" class="form-control" id="displayName" name="displayName">
                    </div>
                    <div class="mb-3">
                        <label for="email" class="form-label">Email</label>
                        <input type="email" class="form-control" id="email" name="email">
                    </div>
                    <div class="mb-3">
                        <label for="avatar" class="form-label">Avatar</label>
                        <div class="d-flex align-items-center">
                            <img id="currentAvatar" src="https://i.ibb.co/FDg3t8m/avatar7.png" alt="Current Avatar" class="img-thumbnail rounded-circle me-3" style="width: 100px; height: 100px;">
                            <input type="file" class="form-control" id="avatar" name="avatar" accept="image/*">
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="emailNotifications" name="emailNotifications">
                        <label class="form-check-label" for="emailNotifications">
                        Email Notifications
                        </label>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Save Settings</button>
                </form>

                <h4 class="mt-5">Change Password</h4>
                <form id="changePasswordForm">
                    <div class="mb-3">
                        <label for="newPassword" class="form-label">New Password</label>
                        <input type="password" class="form-control" id="newPassword" name="newPassword">
                    </div>
                    <div class="mb-3">
                        <label for="confirmPasswordsetttings" class="form-label">Confirm New Password</label>
                        <input type="password" class="form-control" id="confirmPasswordsetttings" name="confirmPasswordsetttings">
                    </div>
                    <button type="submit" class="btn btn-primary" style="margin-bottom: 3%;margin-top:10%;">Change Password</button>
                </form>
                <button id="backToDashboard" class="btn btn-primary" style="margin-bottom: 3%;">Back to Dashboard</button>
            </div>
        </div>
        <footer class="py-3 my-4" style="margin-top: 5%;">
            <p class="text-center text-body-secondary">© 2024 42 Company, Inc</p>
        </footer>
        <div class="position-fixed top-0 start-50 translate-middle-x p-3" style="z-index: 11">
		<div id="saveSettingsToast" class="toast" aria-live="assertive" aria-atomic="true">
		<div class="toast-header">
		  <strong class="me-auto">Settings Saved!</strong>
		  <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
		</div>
		<div class="toast-body">
        Your profile settings have been successfully updated.
		</div>
		</div>
	</div>
    <div class="position-fixed top-0 start-50 translate-middle-x p-3" style="z-index: 11">
    <div id="savePasswordToast" class="toast" aria-live="assertive" aria-atomic="true">
    <div class="toast-header">
      <strong class="me-auto">Password Saved!</strong>
      <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body">
    Your password have been successfully updated.
    </div>
    </div>
</div>
    `;

    attachEventSettingsPage(navigateTo, player_name);
}

function attachEventSettingsPage(navigateTo, player_name) {
    const pongonlineLink = document.getElementById('pongonlineLink');
    const logoutLink = document.getElementById('logoutLink');
    const backToDashboard = document.getElementById('backToDashboard');
    const settingsForm = document.getElementById('settingsForm');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const avatarInput = document.getElementById('avatar');

    pongonlineLink.addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo('/dashboard');
    });

    logoutLink.addEventListener('click', (event) => {
        logout();
    });

    backToDashboard.addEventListener('click', () => navigateTo('/dashboard'));

    settingsForm.addEventListener('submit', (event) => {
        event.preventDefault();
        showUpdateProfileToast();
        // Here you would typically send the form data to your backend
        console.log('Settings saved', Object.fromEntries(formData));
        alert('Settings saved successfully!');
    });

    changePasswordForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPasswordsetttings').value;

        if (newPassword !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        // Here you would typically send the new password to your backend
        console.log('Password changed');
        showsavePasswordToast();
    });

    avatarInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('currentAvatar').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Pre-fill form fields
    document.getElementById('displayName').value = player_name;
    document.getElementById('email').value = 'newmail@example.com';
    document.getElementById('emailNotifications').checked = true;
}

function showUpdateProfileToast() {
	const toastEl = document.getElementById('saveSettingsToast');
	const toast = new bootstrap.Toast(toastEl);
	toast.show();
}

function showsavePasswordToast() {
	const toastEl = document.getElementById('savePasswordToast');
	const toast = new bootstrap.Toast(toastEl);
	toast.show();
}
