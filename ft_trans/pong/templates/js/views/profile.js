function profile(navigateTo, $player_name, profile_name) {

    const wins = 10;
    const losses = 5;
    const mostWinsAgainst = 'fab';
    const mostLossesAgainst = 'fab';
    const highestAILevel = 5;
    // const last3MultiplayerGames = 'fab, fab, fab';
    // const last3GamesAgainstUser = 'fab, fab, fab';

	document.getElementById('ft_transcendence').innerHTML = `
    <div class="dashboard-container">
    <ul class="nav justify-content-center">
        <a class="navbar-brand" href="#">
            <img src="content/logo2.png" alt="Logo" width="30" height="30" class="d-inline-block align-text-top">
        </a>
        <a class="nav-link disabled">pongonline</a>
        <a class="nav-link disabled">${$player_name}</a>
        <a class="nav-link" href="" id="logoutLink">Logout</a>
    </ul>
    <h3 id="header-dashboard" class="text-center">
        ${profile_name}'s Profile
    </h3>
    <div class="text-center" id="profile-picture">
        <img src="https://i.ibb.co/DVfTxB2/avatar5.png" class="img-thumbnail rounded-circle d-flex justify-content-center" alt="Profile Picture">
    </div>
    <button type="button" id="friendButton" class="btn-dark">Add Friend</button>
    <div class="card" id="login_card">
        <div class="card-body">
            <h5 class="card-title">Statistics</h5>
            <p class="card-text">
                Wins: ${wins}<br>
                Losses: ${losses}<br>
                Most wins against: ${mostWinsAgainst}<br>
                Most losses against:${mostLossesAgainst}<br>
                Highest AI level beaten: ${highestAILevel}<br>
            </p>
        </div>
    </div>
    <li class="breadcrumb-item active" id="arrowbackregister">Back</li>
    <footer class="py-3 my-4">
        <p class="text-center text-body-secondary">© 2024 42Company, Inc</p>
    </footer>
    </div>
	`;

	attachEventHandlers2(navigateTo, $player_name, profile_name);
}

function attachEventHandlers2(navigateTo, $player_name, profile_name) {
    document.getElementById('arrowbackregister').addEventListener('click', function(event) {
        event.preventDefault();
        navigateTo('dashboard', $player_name);
      });


    // Initialize friendship status (replace with your own logic)
    let isFriend = false;
    let requestSent = false;
      
    // Get the button element
    const friendButton = document.getElementById('friendButton');
      
    // Update the button text and style based on the friendship status
    function updateFriendButton() { 
        if (isFriend) {
            friendButton.innerText = 'Already Friends';
            friendButton.classList.remove('btn-dark');
            friendButton.classList.add('btn-dark disabled');
        } else if (requestSent) {
            friendButton.innerText = 'Request Sent';
            friendButton.classList.remove('btn-dark');
            friendButton.classList.add('btn-dark disabled');
        } else {
            friendButton.innerText = 'Add Friend';
            friendButton.classList.remove('btn-dark');
            friendButton.classList.add('btn-dark');
        }
    }
    
    // Add an event listener to the button
    friendButton.addEventListener('click', () => {
        if (isFriend) {
            // Handle unfriending logic here
            isFriend = false;
        } else if (requestSent) {
            // Handle canceling the friend request logic here
            requestSent = false;
        } else {
            // Handle sending a friend request logic here
            requestSent = true;
        }
        updateFriendButton();
    });
    
    // Call the function to initialize the button text and style
    updateFriendButton();
}

