import { navigateTo } from '../app.js';
import { logout } from '../utils/token.js';
import { fetchWithToken } from '../utils/api.js';
import { sendFriendRequest, fetchFriendList } from '../utils/friendManager.js';
import { getCookie } from './settingsv.js';

async function checkFriendshipStatus(username) {
    try {
        const response = await fetchWithToken(`/api/check-friend-request/${username}/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Résultat de checkFriendshipStatus:', data);
        return {
            isFriend: data.is_friend,
            requestSent: data.request_sent
        };
    } catch (error) {
        console.error('Erreur lors de la vérification du statut d\'amitié:', error);
        return { isFriend: false, requestSent: false };
    }
}

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

        // Ajout de l'historique des matchs (simulé pour l'instant)
        const matchHistory = [
            { result: 'Victoire', date: '2024-03-15' },
            { result: 'Défaite', date: '2024-03-14' },
            { result: 'Victoire', date: '2024-03-13' }
        ];

        document.getElementById('ft_transcendence').innerHTML = `
        <div class="dashboard-container">
            <ul class="nav justify-content-between align-items-center">
                <a class="navbar-brand" href="#">
                    <img src="${staticUrl}content/logo2.png" id="pongonlineLink" alt="Logo" width="30" height="30">
                </a>
            </ul>

            <h3 id="header-dashboard" class="text-center">
                Profil de ${userProfile.display_name}
            </h3>
            <div class="text-center" id="profile-picture">
                <img src="${userProfile.avatar_url}" class="img-thumbnail rounded-circle d-flex justify-content-center" alt="Photo de profil">
            </div>
            <div class="status-indicator text-center mt-2">
                <span class="status-dot ${userProfile.is_online ? 'online' : 'offline'}"></span>
                <span class="status-text">${userProfile.is_online ? 'Online' : 'Offline'}</span>
            </div>
            <button type="button" id="friendButton" class="btn-dark">Ajouter comme ami</button>

            <div class="row mt-4">
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Statistiques du joueur</h5>
                            <p class="card-text">
                                <strong>Victoires:</strong> ${userProfile.wins}<br>
                                <strong>Défaites:</strong> ${userProfile.losses}<br>
                                <strong>Total des parties:</strong> ${totalGames}<br>
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Ratio Victoires/Défaites</h5>
                            <div id="chartContainer" style="height: 200px; width: 100%;">
                                <canvas id="winLossChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Historique des matchs récents</h5>
                            <ul class="list-group list-group-flush">
                                ${matchHistory.map(match => `
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        ${match.result}
                                        <span class="badge bg-primary rounded-pill">${match.date}</span>
                                    </li>
                                `).join('')}
                            </ul>
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

        const { isFriend, requestSent } = await checkFriendshipStatus(username);

        attachEventHandlers2(navigateTo, username, isFriend, requestSent);

        createWinLossChart(userProfile.wins, userProfile.losses);

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

function attachEventHandlers2(navigateTo, friendName, isFriend, requestSent) {
    document.getElementById('pongonlineLink').addEventListener('click', function(event) {
        event.preventDefault();
        navigateTo('/dashboard');
    });

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
        if (!isFriend && !requestSent) {
            sendFriendRequest(friendName)
                .then(() => {
                    requestSent = true;
                    updateFriendButton();
                })
                .catch(error => console.error('Erreur lors de l\'envoi de la demande d\'ami:', error));
        }
    });

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
                        color: '#222222CC',
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
