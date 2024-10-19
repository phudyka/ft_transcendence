import { navigateTo } from '../app.js';
import { logout } from '../utils/token.js';
import { fetchWithToken } from '../utils/api.js';

export async function profile(username) {
    try {
        console.log(`Tentative de récupération du profil de ${username}`);
        const response = await fetchWithToken(`/api/profile/${username}/`, { method: 'GET' });
        console.log('Statut de la réponse:', response.status);
        console.log('Type de contenu:', response.headers.get('Content-Type'));

        const responseText = await response.text();
        console.log('Réponse brute:', responseText);

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (error) {
            console.error('Erreur lors du parsing JSON:', error);
            throw new Error('La réponse n\'est pas au format JSON valide');
        }

        const userProfile = data.profile;
        console.log('Profil utilisateur:', userProfile);
        if (userProfile.avatar_url) {
            userProfile.avatar_url = userProfile.avatar_url.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
        }
        const totalGames = userProfile.wins + userProfile.losses;

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
            <div class="status-indicator text-center mt-2">
                <span class="status-dot ${userProfile.is_online ? 'online' : 'offline'}"></span>
                <span class="status-text">${userProfile.is_online ? 'En ligne' : 'Hors ligne'}</span>
            </div>
            <button type="button" id="friendButton" class="btn-dark">Ajouter comme ami</button>

            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Statistiques du joueur</h5>
                            <p class="card-text">
                                <strong>Victoires:</strong> ${userProfile.wins}<br>
                                <strong>Défaites:</strong> ${userProfile.losses}<br>
                                <strong>Total des parties:</strong> ${totalGames}<br>
                                <strong>Ratio V/D:</strong> ${userProfile.wins}:${userProfile.losses}<br>
                                ${totalGames > 0 ? `<strong>Taux de victoire:</strong> ${((userProfile.wins / totalGames) * 100).toFixed(2)}%` : ''}
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

            <div class="text-center mt-4">
                <button id="backToDashboard" style="width: 200px;" class="btn btn-primary">Back to Dashboard</button>
            </div>

            <footer class="py-3 my-4">
                <p class="text-center text-body-secondary">© 2024 42Company, Inc</p>
            </footer>
        </div>
        `;

        attachEventHandlers2(navigateTo, username);
        createWinLossChart(userProfile.wins, userProfile.losses);

        // Ajout de l'événement pour le bouton "Retour au tableau de bord"
        document.getElementById('backToDashboard').addEventListener('click', () => {
            navigateTo('/dashboard');
        });

    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('ft_transcendence').innerHTML = `
            <div class="d-flex flex-column align-items-center justify-content-center vh-100">
                <div class="alert alert-danger text-center" role="alert">
                    Erreur lors du chargement du profil. Veuillez réessayer plus tard.
                </div>
                <div class="mt-3">
                    <button id="backToDashboard" style="width: 200px;" class="btn btn-primary">Back to Dashboard</button>
                </div>
            </div>
        `;

        document.getElementById('backToDashboard').addEventListener('click', () => {
            navigateTo('/dashboard');
        });
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

    // Détruire le graphique existant s'il y en a un
    if (window.winLossChart instanceof Chart) {
        window.winLossChart.destroy();
    }

    const totalGames = wins + losses;
    const noGamesPlayed = totalGames === 0;

    window.winLossChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Victoires', 'Défaites'],
            datasets: [{
                data: noGamesPlayed ? [1, 1] : [wins, losses],
                backgroundColor: ['#4CAF50', '#F44336'],
                borderColor: '#121212',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: '#e0e0e0',
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (noGamesPlayed) {
                                return 'Aucune partie jouée';
                            }
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += context.parsed + ' parties';
                            }
                            return label;
                        }
                    }
                }
            },
            cutout: '50%'
        }
    });
}
