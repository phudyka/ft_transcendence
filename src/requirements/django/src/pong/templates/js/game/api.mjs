async function getUserByDisplayName(displayName, token) {
  const response = await fetch(`http://localhost:8080/api/user/${displayName}/`, {
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

export async function updateUserStats(displayName, token, hasWon) {
  try {
    const userData = await getUserByDisplayName(displayName, token);
    let currentWins = userData.user.wins;
    let currentLosses = userData.user.losses;
    const csrfToken = getCookie('csrftoken');

    console.log('user data :', userData);

    // Incrémente les victoires ou les défaites selon le résultat du match
    if (hasWon) {
      currentWins += 1;
    } else {
      currentLosses += 1;
    }

    // Construction de la requête PUT pour mettre à jour les statistiques de l'utilisateur
    const response = await fetch(`http://localhost:8080/api/users/display_name/${displayName}/update_stats/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({
        wins: currentWins,
        losses: currentLosses,
        is_online: true
      })
    });


    // Vérifie si la requête a réussi
    if (response.ok) {
      const updatedUserData = await response.json();
      console.log('Statistiques mises à jour avec succès :', updatedUserData);
    } else {
      console.error('Erreur lors de la mise à jour des statistiques :', response.statusText);
    }

    await saveMatchResult(token, hasWon);

  } catch (error) {
    console.error('Erreur lors de la mise à jour des statistiques :', error.message);
    throw error;
  }
}

export async function saveMatchResult(token, result) {
  try {
    const response = await fetch('http://localhost:8080/api/save-match-result/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ result: result ? 'win' : 'loss' })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Match result saved:', data);
    return data;
  } catch (error) {
    console.error('Error saving match result:', error);
    throw error;
  }
}
