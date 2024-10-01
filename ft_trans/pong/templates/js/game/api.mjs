
async function getUserByDisplayName(displayName, token) {
  const response = await fetch(`http://localhost:8000/api/user/${displayName}/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.ok) {
    return await response.json();
  } else {
    throw new Error('Erreur lors de la récupération des informations utilisateur');
  }
}

async function getCsrfToken() {
  const response = await fetch('http://localhost:8000/api/set-csrf-token/', {
    method: 'GET',
    credentials: 'include' 
  });

  if (response.ok) {
    const data = await response.json();
    return data.csrfToken;
  } else {
    throw new Error('Erreur lors de la récupération du token CSRF');
  }
}

export async function updateUserStats(displayName, token, hasWon) {
  try {
    const csrfToken = await getCsrfToken();

    console.log(token);

    const userData = await getUserByDisplayName(displayName, token);
    let currentWins = userData.user.wins;
    let currentLosses = userData.user.losses;
    console.log('user data :', userData);

    if (hasWon) {
      currentWins += 1;
    } else {
      currentLosses += 1;
    }

    console.log(csrfToken);

  } catch (error) {
    console.error('Erreur :', error.message);
  }
}
