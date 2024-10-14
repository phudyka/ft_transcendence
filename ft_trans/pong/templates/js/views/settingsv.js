import { navigateTo } from '../app.js';

const player_name = sessionStorage.getItem('player_name');

export function settings() {
    const username = sessionStorage.getItem('username');
    let avatarUrl = sessionStorage.getItem('avatar_url');
    if (avatarUrl) {
        avatarUrl = avatarUrl.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
    }


    if (!username) {
        navigateTo('/login');
        return;
    }
    console.log('settings view');

    document.getElementById('ft_transcendence').innerHTML = `
    <div class="dashboard-container">
        <ul class="nav justify-content-between align-items-center">
            <a class="navbar-brand" href="#">
                <img src="${staticUrl}content/logo2.png" id="pongonlineLink" alt="Logo" width="70" height="70">
            </a>
            <li class="nav-item">
                <span class="nav-item" style="font-size: 2.5em; font-weight: bold;">${username}</span>
            </li>
            <li class="nav-item">
                <img src="${avatarUrl}" class="img-thumbnail rounded-circle d-flex justify-content-center" alt="Photo de profil" style="width: 50px; height: 50px;padding: 0px;">
            </li>
        </ul>

        <h3 id="header-dashboard" class="text-center settings-title">User Settings</h3>

        <div class="container mt-4 settings-form-container">
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
                        <img id="currentAvatar" src="${avatarUrl}" alt="Avatar actuel" class="img-thumbnail rounded-circle me-3 avatar-img" style="width: 100px; height: 100px;padding: 0px; border: 1px solid #ff5722;">
                        <input type="file" class="form-control" id="avatar" name="avatar" accept="image/jpeg,image/png,image/gif">
                    </div>
                    <small class="form-text text-muted">
                        <ul>
                            <li><i style="color: #ff5722;">Accepted formats: JPG, PNG, GIF</i></li>
                            <li><i style="color: #ff5722;">Maximum size: 5 MB</i></li>
                            <li><i style="color: #ff5722;">Dimensions: between 100x100 and 1000x1000 pixels</i></li>
                        </ul>
                    </small>
                </div>
                <button type="submit" class="btn btn-primary">Save changes</button>
            </form>
            <button id="backToDashboard" class="btn btn-secondary">Back to Dashboard</button>
        </div>

        <footer class="footer py-3 my-4">
            <p class="text-center">© 2024 42 Company, Inc</p>
        </footer>

        <div class="toast-container position-fixed top-0 start-50 translate-middle-x p-3" style="z-index: 11;">
            <div id="saveSettingsToast" class="toast">
                <div class="toast-header">
                    <strong class="me-auto">Settings Saved!</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    Your profile settings have been successfully updated.
                </div>
            </div>
            <div id="savePasswordToast" class="toast">
                <div class="toast-header">
                    <strong class="me-auto">Password Saved!</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    Your password has been successfully updated.
                </div>
            </div>
        </div>
    </div>
`;

attachEventSettingsPage(navigateTo, player_name);
}

function attachEventSettingsPage(navigateTo, player_name) {
    const pongonlineLink = document.getElementById('pongonlineLink');
    const backToDashboard = document.getElementById('backToDashboard');
    const settingsForm = document.getElementById('settingsForm');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const avatarInput = document.getElementById('avatar');

    pongonlineLink.addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo('/dashboard');
    });

    backToDashboard.addEventListener('click', () => navigateTo('/dashboard'));

    settingsForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(settingsForm);

        try {
            const csrftoken = getCookie('csrftoken');
            const response = await fetch('/api/update-user-settings/', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`,
                    'X-CSRFToken': csrftoken,
                },
            });

            if (response.ok) {
                showUpdateProfileToast();
            } else {
                const errorData = await response.json();
                alert(`Erreur : ${errorData.message}`);
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour des paramètres :', error);
            alert('Une erreur est survenue lors de la mise à jour des paramètres.');
        }
    });

    avatarInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            // Vérification de la taille du fichier
            if (file.size > 5 * 1024 * 1024) {
                alert('Le fichier est trop volumineux. La taille maximale est de 5 MB.');
                avatarInput.value = '';
                return;
            }

            // Vérification du type de fichier
            const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!acceptedTypes.includes(file.type)) {
                alert('Type de fichier non accepté. Veuillez choisir une image JPG, PNG ou GIF.');
                avatarInput.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    if (img.width < 100 || img.height < 100 || img.width > 1000 || img.height > 1000) {
                        alert('Les dimensions de l\'image doivent être comprises entre 100x100 et 1000x1000 pixels.');
                        avatarInput.value = '';
                    } else {
                        document.getElementById('currentAvatar').src = e.target.result;
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Pre-fill form fields
    document.getElementById('displayName').value = player_name;
    document.getElementById('email').value = 'newmail@example.com';
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

export function getCookie(name) {
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
