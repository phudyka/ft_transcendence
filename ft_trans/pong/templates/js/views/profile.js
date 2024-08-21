import { navigateTo } from '../app.js';

export function profile(friendName) {
    // Simulons des données (à remplacer par des données réelles de la base de données)
    const stats = {
        wins: 120,
        losses: 80,
        totalGames: 200,
        winRatio: (120 / 200 * 100).toFixed(2),
        avgScore: 7.5,
        totalPlayTime: '50h 30m',
        highestAILevel: 8,
        recentMatches: [
            { opponent: 'Alice', result: 'Win', date: '2024-03-15' },
            { opponent: 'Bob', result: 'Loss', date: '2024-03-14' },
            { opponent: 'AI Level 7', result: 'Win', date: '2024-03-13' },
            { opponent: 'Charlie', result: 'Win', date: '2024-03-12' },
            { opponent: 'AI Level 6', result: 'Win', date: '2024-03-11' },
        ]
    };

    const player_name = localStorage.getItem('player_name');
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

        <h3 id="header-dashboard" class="text-center">
            ${friendName}'s Profile
        </h3>
        <div class="text-center" id="profile-picture">
            <img src="https://i.ibb.co/DVfTxB2/avatar5.png" class="img-thumbnail rounded-circle d-flex justify-content-center" alt="Profile Picture">
        </div>
        <button type="button" id="friendButton" class="btn-dark">Add Friend</button>

        <div class="row mt-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Player Statistics</h5>
                        <p class="card-text">
                            Wins: ${stats.wins}<br>
                            Losses: ${stats.losses}<br>
                            Win Ratio: ${stats.winRatio}%<br>
                            Total Games: ${stats.totalGames}<br>
                            Average Score: ${stats.avgScore}<br>
                            Total Play Time: ${stats.totalPlayTime}<br>
                            Highest AI Level Beaten: ${stats.highestAILevel}
                        </p>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Win/Loss Ratio</h5>
                        <div id="chartContainer" style="height: 200px; width: 100%;">
                            <canvas id="winLossChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card mt-4"  style="margin-bottom: 3%;">
            <div class="card-body">
                <h5 class="card-title">Recent Matches</h5>
                <ul class="list-group">
                    ${stats.recentMatches.map(match => `
                        <li class="list-group-item">
                            ${match.date}: ${match.result} vs ${match.opponent}
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
        <footer class="py-3 my-4">
            <p class="text-center text-body-secondary">© 2024 42Company, Inc</p>
        </footer>
    </div>
    `;

    attachEventHandlers2(navigateTo, friendName);
    createWinLossChart(stats.wins, stats.losses);
}

function attachEventHandlers2(navigateTo, friendName) {

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
