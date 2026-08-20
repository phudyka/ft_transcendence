import { navigateTo } from "../app.js";
import { fetchWithToken } from "./api.js";
import { removeDashboardEventListeners } from "../views/dashboard.js";

export async function getCsrfToken() {
  const response = await fetch("/api/set-csrf-token/", {
    method: "GET",
    credentials: "include",
  });
  if (response.ok) {
    const data = await response.json();
    return data.csrfToken;
  }
  throw new Error("Failed to get CSRF token");
}

export async function logout() {
  removeDashboardEventListeners();

  if (sessionStorage.getItem("accessToken")) {
    try {
      await fetchWithToken("/api/update-online-status/", {
        method: "POST",
        body: JSON.stringify({ is_online: false }),
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut en ligne:", error);
    }
  }

  sessionStorage.clear();
  navigateTo("/login");
}

export async function refreshAccessToken() {
  const refreshToken = sessionStorage.getItem("refreshToken");
  if (!refreshToken) {
    logout();
    return false;
  }

  try {
    const response = await fetch("/api/token/refresh/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    const data = await response.json();
    if (data.access) {
      sessionStorage.setItem("accessToken", data.access);
      return true;
    } else {
      logout();
      return false;
    }
  } catch (error) {
    console.error("Erreur lors du rafraîchissement du token :", error);
    logout();
    return false;
  }
}

// Sans le garde, le minuteur appelait `logout()` toutes les 50 minutes sur un
// onglet déconnecté, ce qui renvoyait vers /login depuis n'importe quelle page.
setInterval(() => {
  if (sessionStorage.getItem("refreshToken")) refreshAccessToken();
}, 50 * 60 * 1000);
