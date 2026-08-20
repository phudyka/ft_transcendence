// Enregistrement d'une partie terminée.
//
// Le client lisait auparavant wins/losses par GET /api/user/<nom>/, ajoutait un,
// et renvoyait le total à PUT /api/users/display_name/<nom>/update_stats/ :
// trois requêtes, un compteur que n'importe quel compte pouvait écrire pour
// n'importe quel autre, et deux parties finies en même temps qui s'écrasaient.
// Le serveur incrémente désormais lui-même, sur le compte du jeton présenté.

// Un invité n'a pas de compte : inutile d'envoyer une requête qui ne peut
// qu'être refusée. L'identité vient du jeton, pas d'un nom passé en argument —
// `updateUserStats(displayName, …)` n'enveloppait plus que cette ligne.
export function saveMatchResult(token, hasWon, opponent) {
  if (!token) return Promise.resolve(null);
  return postResult(token, hasWon, opponent).catch(() => {});
}

async function postResult(token, hasWon, opponent) {
  try {
    const response = await fetch(`/api/save-match-result/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        result: hasWon ? "win" : "loss",
        opponent: opponent,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error saving match result:", error);
    throw error;
  }
}
