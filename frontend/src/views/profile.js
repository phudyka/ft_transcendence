import { announceRoute, navigateTo } from "../app.js";
import { fetchWithToken } from "../utils/api.js";
import { sendFriendRequest } from "../utils/friendManager.js";
import { removeDashboardEventListeners } from "./dashboard.js";
import { html, raw } from "../utils/html.js";
import { setBusy, showToast } from "../utils/feedback.js";

export async function checkFriendshipStatus(username) {
  try {
    const response = await fetchWithToken(
      `/api/check-friend-request/${username}/`,
    );
    if (!response.ok) {
      throw new Error(`Erreur HTTP! statut: ${response.status}`);
    }
    const data = await response.json();
    return {
      isFriend: data.is_friend,
      requestSent: data.request_sent,
    };
  } catch (error) {
    console.error("Erreur lors de la vérification du statut d'amitié:", error);
    return { isFriend: false, requestSent: false };
  }
}

async function getRecentMatches(username) {
  try {
    const response = await fetchWithToken(
      `/api/get-recent-matches/${username}/`,
    );
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Réponse d'erreur:", errorText);
    }
    const data = await response.json();
    return data.matches;
  } catch (error) {
    console.error("Error fetching recent matches:", error);
    return [];
  }
}

export async function profile(displayName) {
  removeDashboardEventListeners();
  try {
    const response = await fetchWithToken(`/api/user/${displayName}/`);

    // Vérifier le type de contenu de la réponse
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error ||
            "Une erreur est survenue lors de la récupération du profil",
        );
      }

      const userProfile = data.user;
      const currentUser = sessionStorage.getItem("username");
      if (userProfile.avatar_url && userProfile.avatar_url.startsWith("url(")) {
        userProfile.avatar_url = userProfile.avatar_url.replace(
          /^url\(["']?/,
          "",
        ).replace(/["']?\)$/, "");
      }
      const totalGames = userProfile.wins + userProfile.losses;

      const recentMatches = await getRecentMatches(userProfile.username);

      const matchHistory = recentMatches.length > 0
        ? recentMatches.map((match) => ({
          result: match.result.charAt(0).toUpperCase() + match.result.slice(1),
          date: match.date,
          opponent: match.opponent,
        }))
        : [];

      const winRate = totalGames > 0
        ? ((userProfile.wins / totalGames) * 100).toFixed(1)
        : 0;

      let currentStreak = 0;
      let streakType = "None";
      if (recentMatches.length > 0) {
        const firstResult = recentMatches[0].result;
        streakType = firstResult.charAt(0).toUpperCase() + firstResult.slice(1);

        for (const match of recentMatches) {
          if (match.result === firstResult) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      const aiGames = recentMatches.filter((match) => match.opponent === "AI");
      const aiWins = aiGames.filter((match) => match.result === "win").length;
      const aiLosses = aiGames.filter((match) =>
        match.result === "loss"
      ).length;
      const aiWinRate = aiGames.length > 0
        ? ((aiWins / aiGames.length) * 100).toFixed(1)
        : 0;

      // « Current Streak: 0 None » quand le compte n'a joué aucun match.
      const streakWord = streakType.toLowerCase() === "loss" ? "loss" : "win";
      const streak = currentStreak > 0
        ? `${currentStreak} ${streakWord}${
          currentStreak > 1 ? (streakWord === "loss" ? "es" : "s") : ""
        }`
        : "No games yet";

      const isCurrentUser = userProfile.username === currentUser;
      const displayOnlineStatus = isCurrentUser ? true : userProfile.is_online;

      document.getElementById("ft_transcendence").innerHTML = html`
        <main class="dashboard-container profile-view">
          <h1 id="header-dashboard" class="text-center">
            ${userProfile.display_name}'s Profile
          </h1>
          <div class="text-center" id="profile-picture">
            <img
              src="${userProfile.avatar_url}"
              class="rounded-circle"
              alt="${userProfile.display_name}'s avatar"
              width="150"
              height="150"
            >
          </div>
          <div class="status-indicator text-center mt-2">
            <span class="status-dot ${displayOnlineStatus
              ? "online"
              : "offline"}" aria-hidden="true"></span>
            <span class="status-text">${displayOnlineStatus
              ? "Online"
              : "Offline"}</span>
          </div>
          <button type="button" id="friendButton" class="btn btn-primary" disabled>
            Checking…
          </button>

          <div class="row mt-4">
            <div class="col-md-4">
              <div class="card">
                <div class="card-body">
                  <h2 class="card-title">Player Statistics</h2>
                  <p class="card-text">
                    <strong>Wins:</strong> ${userProfile.wins}<br>
                    <strong>Losses:</strong> ${userProfile.losses}<br>
                    <strong>Total games:</strong> ${totalGames}<br>
                    <strong>Win Rate:</strong> ${winRate}%<br>
                    <strong>Current Streak:</strong> ${streak}<br>
                    <strong>VS AI Win Rate:</strong> ${aiWinRate}%<br>
                    <strong>VS AI Record:</strong> ${aiWins}W - ${aiLosses}L<br>
                  </p>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card">
                <div class="card-body">
                  <h2 class="card-title">Win/Loss Ratio</h2>
                  <div id="chartContainer">
                    ${raw(
                      totalGames === 0
                        ? html`
                          <p class="no-games">No games played</p>
                        `
                        : html`
                          <div
                            class="ratio-donut"
                            role="img"
                            aria-label="${userProfile
                              .wins} wins and ${userProfile.losses} losses"
                            style="--win-share: ${userProfile.wins /
                              totalGames}"
                          >
                          </div>
                          <ul class="ratio-legend">
                            <li><span class="swatch win"></span>Wins: ${userProfile
                              .wins}</li>
                            <li><span class="swatch loss"></span>Losses: ${userProfile
                              .losses}</li>
                          </ul>
                        `,
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card">
                <div class="card-body">
                  <h2 class="card-title">Recent Match History</h2>
                  <ul class="list-group list-group-flush">
                    ${raw(
                      matchHistory.length === 0
                        ? html`
                          <li class="empty-state">No match played yet</li>
                        `
                        : "",
                    )} ${raw(
                      matchHistory.map((match) =>
                        html`
                          <li
                            class="list-group-item d-flex justify-content-between align-items-center ${match
                                .result.toLowerCase() === "win"
                              ? "win"
                              : "loss"}"
                          >
                            <span class="match-result ${match.result
                              .toLowerCase()}">${match.result}</span>
                            <span class="badge rounded-pill">vs ${match
                              .opponent}</span>
                          </li>
                        `
                      ).join(""),
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div class="text-center mt-4">
            <button
              type="button"
              id="backToDashboard"
              class="btn btn-primary back-button"
            >
              Back to Dashboard
            </button>
          </div>

          <footer class="py-3 my-4">
            <p class="text-center text-body-secondary">© 2024 42Company, Inc</p>
          </footer>
        </main>
      `;

      const { isFriend, requestSent } = await checkFriendshipStatus(
        userProfile.username,
      );

      attachEventHandlers2(userProfile.username, isFriend, requestSent);

      document.getElementById("backToDashboard").addEventListener(
        "click",
        () => {
          navigateTo("/dashboard");
        },
      );

      announceRoute(`${userProfile.display_name} — profile`);
    } else {
      const text = await response.text();
      console.error("Received non-JSON response:", text);
      throw new Error("Received non-JSON response");
    }
  } catch (error) {
    console.error("Could not load the profile:", error);
    // Une seule phrase couvrait deux causes opposées — profil inexistant ou
    // serveur endormi — et n'offrait aucune reprise. Le statut HTTP tranche,
    // et le bouton « Try again » rejoue l'appel sans repasser par le tableau
    // de bord.
    const missing = String(error.message).includes("404");
    document.getElementById("ft_transcendence").innerHTML = html`
      <main
        class="profile-view profile-error d-flex flex-column align-items-center justify-content-center"
      >
        <h1 class="visually-hidden">Profile unavailable</h1>
        <div class="alert text-center" role="alert">
          ${missing
      ? "No account with that name."
      : "Could not load this profile. The server is hosted on a free tier and may still be starting."}
        </div>
        <div class="mt-3 profile-error-actions">
          ${raw(
      missing ? "" : html`
          <button type="button" id="retryProfile" class="btn btn-primary">
            Try again
          </button>
        `,
    )}
          <button
            type="button"
            id="backToDashboard"
            class="btn btn-secondary back-button"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    `;

    document.getElementById("retryProfile")?.addEventListener(
      "click",
      () => profile(displayName),
    );

    document.getElementById("backToDashboard").addEventListener("click", () => {
      navigateTo("/dashboard");
    });

    announceRoute("Profile unavailable");
  }
}

function attachEventHandlers2(friendName, isFriend, requestSent) {
  const friendButton = document.getElementById("friendButton");
  const currentUser = sessionStorage.getItem("username");

  function updateFriendButton() {
    const label = friendName === currentUser
      ? "This is you"
      : isFriend
      ? "Already friends"
      : requestSent
      ? "Request sent"
      : "Add friend";
    friendButton.textContent = label;
    friendButton.disabled = label !== "Add friend";
  }

  friendButton.addEventListener("click", async () => {
    if (friendButton.disabled) return;
    setBusy(friendButton, true, "Sending…");
    try {
      const response = await sendFriendRequest(friendName);
      if (!response.ok) throw new Error(String(response.status));
      requestSent = true;
      showToast("Friend request sent.", "success");
    } catch (error) {
      console.error("Could not send the friend request:", error);
      showToast("Could not send the friend request.", "error");
    } finally {
      setBusy(friendButton, false);
      updateFriendButton();
    }
  });

  updateFriendButton();
}
