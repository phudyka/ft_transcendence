import { navigateTo } from '../app.js';
import { logout } from '../utils/token.js';
import { fetchWithToken } from '../utils/api.js';

export async function profile(username) {
    try {
        const response = await fetchWithToken(`/api/profile/${username}/`);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération du profil');
            console.log(userProfile);
        }
        const data = await response.json();
        const userProfile = data.profile;
        console.log(userProfile);

        document.getElementById('ft_transcendence').innerHTML = `
        <div class="dashboard-container">
            <ul class="nav justify-content-between align-items-center">
                <a class="navbar-brand" href="#">
                    <img src="${staticUrl}content/logo2.png" id="pongonlineLink" alt="Logo" width="30" height="30">
                </a>
                <li class="nav-item" id="DisplayName">
                    <a class="nav-link disabled">${localStorage.getItem('player_name')}</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" id="logoutLink">Logout</a>
                </li>
            </ul>

            <h3 id="header-dashboard" class="text-center">
                Profil de ${userProfile.display_name}
            </h3>
            <div class="text-center" id="profile-picture">
                <img src="${userProfile.avatar_url}" class="img-thumbnail rounded-circle d-flex justify-content-center" alt="Photo de profil">
            </div>
            <button type="button" id="friendButton" class="btn-dark">Ajouter comme ami</button>

            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Statistiques du joueur</h5>
                            <p class="card-text">
                                Victoires: ${userProfile.wins}<br>
                                Défaites: ${userProfile.losses}<br>
                                Ratio de victoires: ${((userProfile.wins / (userProfile.wins + userProfile.losses)) * 100).toFixed(2)}%<br>
                                Total des parties: ${userProfile.wins + userProfile.losses}<br>
                                Statut: ${userProfile.is_online ? 'En ligne' : 'Hors ligne'}
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Ratio Victoires/Défaites</h5>
                            <div id="chartContainer" style="height: 200px; width: 100%;">
                                <canvas id="winLossChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <footer class="py-3 my-4">
                <p class="text-center text-body-secondary">© 2024 42Company, Inc</p>
            </footer>
        </div>
        `;

        attachEventHandlers2(navigateTo, username);
        createWinLossChart(userProfile.wins, userProfile.losses);
    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('ft_transcendence').innerHTML = `
            <div class="alert alert-danger" role="alert">
                Erreur lors du chargement du profil. Veuillez réessayer plus tard.
            </div>
        `;
    }
}

function attachEventHandlers2(navigateTo, friendName) {

    const DisplayName = document.getElementById('DisplayName');
    const logoutLink = document.getElementById('logoutLink');

    logoutLink.addEventListener('click', () => {
        event.preventDefault();
        logout();
    });

    document.getElementById('pongonlineLink').addEventListener('click', function(event) {
        event.preventDefault();
        navigateTo('/dashboard');
    });

    // Friend button logic (as before)
    let isFriend = false;
    let requestSent = false;
    const friendButton = document.getElementById('friendButton');

    function updateFriendButton() {
        if (isFriend) {
            friendButton.innerText = 'Already Friends';
            friendButton.classList.add('btn-dark', 'disabled');
        } else if (requestSent) {
            friendButton.innerText = 'Request Sent';
            friendButton.classList.add('btn-dark', 'disabled');
        } else {
            friendButton.innerText = 'Add Friend';
            friendButton.classList.remove('disabled');
        }
    }

    friendButton.addEventListener('click', () => {
        if (isFriend) {
            isFriend = false;
        } else if (requestSent) {
            requestSent = false;
        } else {
            requestSent = true;
        }
        updateFriendButton();
    });

    DisplayName.addEventListener('click', () => navigateTo('/dashboard'));

    updateFriendButton();
}

function createWinLossChart(wins, losses) {
    const ctx = document.getElementById('winLossChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Wins', 'Losses'],
            datasets: [{
                data: [wins, losses],
                backgroundColor: ['#4CAF50', '#F44336']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}
