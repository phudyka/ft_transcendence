import { announceRoute, navigateTo } from "../app.js";
import { getCsrfToken } from "../utils/token.js";
import { removeDashboardEventListeners } from "./dashboard.js";
import { html, raw } from "../utils/html.js";
import { LOCK_ICON } from "../utils/icons.js";
import { handleUnmaskPassword } from "../utils/unmask.js";
import { setBusy } from "../utils/feedback.js";

// L'API dort sur son tier gratuit : le premier appel la réveille et peut
// prendre près d'une minute. Au-delà, ce n'est plus un réveil, c'est une panne
// — et sans ce délai le `fetch` restait ouvert indéfiniment, bouton grisé.
const WAKE_UP_MS = 60_000;

export function login() {
  if (check42AuthParams()) {
    return;
  }

  removeDashboardEventListeners(); // Add this line
  document.getElementById("ft_transcendence").innerHTML = html`
    <main class="container login-container">
      <img
        src="/brand/logo_400_400.png"
        id="logo_pong_login"
        alt=""
        width="150"
        height="150"
      >
      <h1 class="login-title">ft_transcendence</h1>
      <p class="login-tagline">
        Pong in 3D — solo against the AI, two or four online, or a tournament.
      </p>
      <form id="loginForm">
        <div class="field-group">
          <label for="username">Account name</label>
          <input
            type="text"
            class="field-input"
            placeholder="Enter Account name"
            id="username"
            name="username"
            autocomplete="username"
            required
          >
        </div>
        <div class="field-group">
          <label for="password">Password</label>
          <div class="password-wrapper">
            <input
              type="password"
              class="field-input password"
              placeholder="Enter Password"
              id="password"
              name="password"
              autocomplete="current-password"
              required
            >
            <button
              class="unmask"
              type="button"
              aria-label="Show password"
              aria-pressed="false"
            >
              ${raw(LOCK_ICON)}
            </button>
          </div>
        </div>
        <p id="loginError" class="field-error" role="alert" hidden></p>
        <button type="submit" class="btn btn-primary" id="login_button">
          Login
        </button>
        <button type="button" class="btn btn-primary" id="login_with_42">
          Login with 42
        </button>
        <button type="button" id="create_account" class="btn btn-outline-light">
          Create account
        </button>
        <button type="button" id="back_to_demo" class="btn btn-secondary">
          Back to the demo
        </button>
      </form>
    </main>
    <footer>
      <p>© 2024 42Company, Inc</p>
    </footer>
  `;

  // `innerHTML` est synchrone : le DOM est déjà à jour ici, le setTimeout(0)
  // qui entourait cet appel ne servait à rien.
  attachEventLoginPage();
  announceRoute("Log in");
}

function attachEventLoginPage() {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  const createButton = document.getElementById("create_account");
  if (createButton) {
    createButton.addEventListener("click", function (event) {
      event.preventDefault();
      navigateTo("/register");
    });
  }

  // Remplacer l'ancien gestionnaire d'événements pour unmask
  const unmaskButtons = document.querySelectorAll(".unmask");
  unmaskButtons.forEach((button) => {
    button.addEventListener("click", handleUnmaskPassword);
  });

  document.getElementById("login_with_42").addEventListener(
    "click",
    handle42Login,
  );

  document.getElementById("back_to_demo").addEventListener("click", (event) => {
    event.preventDefault();
    navigateTo("/");
  });
}

async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const submitButton = document.getElementById("login_button");
  // L'échec ne vivait que dans un toast masqué au bout de cinq secondes —
  // c'est-à-dire moins longtemps que l'attente qui l'a provoqué. Il reste
  // maintenant à côté du formulaire, comme sur l'écran d'inscription.
  const errorLine = document.getElementById("loginError");
  const fail = (message) => {
    errorLine.textContent = message;
    errorLine.hidden = false;
  };
  errorLine.hidden = true;
  setBusy(submitButton, true, "Signing in… (waking the server)");
  try {
    const csrfToken = await getCsrfToken();
    const response = await fetch("/api/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify({ username, password }),
      credentials: "include",
      signal: AbortSignal.timeout(WAKE_UP_MS),
    });
    const data = await response.json();
    if (data.success) {
      sessionStorage.setItem("accessToken", data.access);
      sessionStorage.setItem("refreshToken", data.refresh);
      sessionStorage.setItem("username", data.username);
      sessionStorage.setItem("display_name", data.display_name);
      sessionStorage.setItem("avatar_url", data.avatar_url);
      navigateTo("/dashboard");
      // Mettez à jour le statut en ligne
      await fetch("/api/update-online-status/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${data.access}`,
        },
      });
    } else {
      fail(data.message || "Wrong account name or password.");
    }
  } catch (error) {
    console.error("Login failed:", error);
    fail(
      error.name === "TimeoutError"
        ? "The server did not answer within a minute. It is hosted on a free tier and may still be starting — try again."
        : "Could not reach the server. Check your connection and try again.",
    );
  } finally {
    setBusy(submitButton, false);
  }
}

function handle42Login(event) {
  event.preventDefault();
  window.location.href = "/api/auth/42/login/";
}

function check42AuthParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const authSuccess = urlParams.get("auth_success");

  if (authSuccess === "true") {
    // Stocker toutes les informations de l'utilisateur
    const access = urlParams.get("access");
    const refresh = urlParams.get("refresh");
    const username = urlParams.get("username");
    const display_name = urlParams.get("display_name");
    const avatar_url = urlParams.get("avatar_url");

    if (access && refresh && username) {
      // Stocker les informations dans la session
      sessionStorage.setItem("accessToken", access);
      sessionStorage.setItem("refreshToken", refresh);
      sessionStorage.setItem("username", username);
      sessionStorage.setItem("display_name", display_name);
      sessionStorage.setItem("avatar_url", avatar_url);

      // Nettoyer l'URL
      history.replaceState(null, "", "/login");

      // Rediriger vers le dashboard
      navigateTo("/dashboard");
      return true;
    }
  }
  return false;
}

export function removeLoginEventListeners() {
  document.getElementById("loginForm")
    ?.removeEventListener("submit", handleLogin);
}
