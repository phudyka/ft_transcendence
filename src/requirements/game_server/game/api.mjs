
async function getUserByDisplayName(displayName, token) {
  const response = await fetch(`https://localhost/api/user/${displayName}/`, {
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

export async function updateUserStats(displayName, token, hasWon) {
  try {
    const userData = await getUserByDisplayName(displayName, token);
    let currentWins = userData.user.wins;
    let currentLosses = userData.user.losses;

    console.log('user data :', userData);

    // Incrémente les victoires ou les défaites selon le résultat du match
    if (hasWon) {
      currentWins += 1;
    } else {
      currentLosses += 1;
    }

    // Construction de la requête PUT pour mettre à jour les statistiques de l'utilisateur
    const response = await fetch(`https://localhost/users/display_name/${displayName}/update_stats/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
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

  } catch (error) {
    console.error('Erreur :', error.message);
  }
}
