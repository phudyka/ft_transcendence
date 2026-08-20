import { announceRoute, navigateTo } from "../app.js";
import { getCsrfToken } from "../utils/token.js";
import { handleUnmaskPassword } from "../utils/unmask.js";
import { setBusy, showToast } from "../utils/feedback.js";

// Même délai que la connexion : au-delà d'une minute, ce n'est plus un réveil.
const WAKE_UP_MS = 60_000;
import { LOCK_ICON } from "../utils/icons.js";
import { html, raw } from "../utils/html.js";

// Les sept avatars étaient chargés depuis i.ibb.co, un hébergeur d'images
// gratuit : une panne de leur côté et l'inscription ne propose plus rien.
// Ils vivent maintenant dans frontend/public/avatars/.
// Listés en clair plutôt que construits : check-assets.mjs ne résout pas
// les gabarits, et sans cela les sept fichiers ne sont gardés par rien.
const AVATARS = [
  "/avatars/avatar1.png",
  "/avatars/avatar2.png",
  "/avatars/avatar3.png",
  "/avatars/avatar4.png",
  "/avatars/avatar5.png",
  "/avatars/avatar6.png",
  "/avatars/avatar7.png",
];

export function register() {
  document.getElementById("ft_transcendence").innerHTML = html`
    <main class="container register-container">
      <h1 class="register-title">Create Your Account</h1>
      <form id="registerForm">
        <div class="form-group">
          <label for="username" class="form-label">Account name</label>
          <input
            type="text"
            id="username"
            name="username"
            placeholder="Enter your account name"
            required
            autocomplete="username"
            class="field-input"
          >
        </div>
        <div class="form-group">
          <label for="email" class="form-label">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter your email"
            required
            autocomplete="email"
            class="field-input"
          >
        </div>
        <div class="form-group password-group">
          <label for="password" class="form-label">Password</label>
          <div class="password-wrapper">
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              required
              autocomplete="new-password"
              aria-describedby="password-hints"
              class="field-input"
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
          <ul class="field-hints" id="password-hints">
            <li>At least 8 characters</li>
            <li>Not only digits, and not a common password</li>
          </ul>
        </div>
        <div class="form-group password-group">
          <label for="confirmPassword" class="form-label">Confirm Password</label>
          <div class="password-wrapper">
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm your password"
              required
              autocomplete="new-password"
              class="field-input"
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
        <fieldset class="form-group choose-avatar">
          <legend class="form-label">Choose your Avatar</legend>
          <div class="avatars">
            ${raw(
              AVATARS.map((url, i) =>
                html`
                  <label class="avatar-item">
                    <input
                      type="radio"
                      name="avatar"
                      value="${url}"
                      ${raw(i === 3 ? "checked" : "")}
                    >
                    <img src="${url}" alt="Avatar ${i +
                      1}" width="100" height="100">
                  </label>
                `
              ).join(""),
            )}
          </div>
        </fieldset>

        <div class="form-actions">
          <p id="registerError" class="field-error" role="alert" hidden></p>
          <button id="registerbutton" type="submit" class="btn btn-primary">
            Register
          </button>
          <button
            id="registerbutton42"
            type="button"
            class="btn btn-primary btn-42"
          >
            Register with 42
          </button>
          <button id="arrowbackregister" type="button" class="btn btn-back">
            Back
          </button>
        </div>
      </form>
    </main>
    <footer class="footer">
      <p>© 2024 42Company, Inc</p>
    </footer>
  `;

  // `innerHTML` est synchrone : le setTimeout(0) qui entourait cet appel ne
  // servait à rien.
  setupRegisterEvents();
  announceRoute("Create your account");
}

function setupRegisterEvents() {
  document.getElementById("registerForm").addEventListener(
    "submit",
    async function (event) {
      event.preventDefault();
      const username = document.getElementById("username").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      const errorLine = document.getElementById("registerError");
      const confirmField = document.getElementById("confirmPassword");
      const fail = (message) => {
        errorLine.textContent = message;
        errorLine.hidden = false;
        confirmField.setAttribute("aria-invalid", "true");
      };
      errorLine.hidden = true;
      confirmField.removeAttribute("aria-invalid");

      if (password !== confirmPassword) {
        fail("The two passwords do not match.");
        confirmField.focus();
        return;
      }

      // Un groupe de boutons radio : la sélection, le clavier (flèches), le
      // focus et l'annonce au lecteur d'écran sont natifs. Le carrousel qu'ils
      // remplacent était 55 lignes de translations en pixels, inatteignables
      // au clavier.
      const selectedAvatar =
        document.querySelector('input[name="avatar"]:checked').value;

      const submitButton = document.getElementById("registerbutton");
      setBusy(submitButton, true, "Creating your account…");

      try {
        const csrfToken = await getCsrfToken();
        const response = await fetch("/api/register/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify({
            username: username,
            email: email,
            password: password,
            avatar_url: selectedAvatar,
          }),
          credentials: "include",
          signal: AbortSignal.timeout(WAKE_UP_MS),
        });

        const data = await response.json();
        if (data.success) {
          // La session était ouverte à moitié : les deux jetons étaient posés,
          // mais pas `username` — sur lequel `isUserLoggedIn()` se prononce.
          // L'utilisateur était donc renvoyé retaper ce qu'il venait de saisir,
          // face à une API qui peut mettre une minute à répondre. Le serveur
          // renvoie maintenant l'identité ; le formulaire sert de repli.
          sessionStorage.setItem("accessToken", data.access);
          sessionStorage.setItem("refreshToken", data.refresh);
          sessionStorage.setItem("username", data.username ?? username);
          sessionStorage.setItem(
            "display_name",
            data.display_name ?? username,
          );
          sessionStorage.setItem(
            "avatar_url",
            data.avatar_url ?? selectedAvatar,
          );
          showToast(`Welcome, ${data.display_name ?? username}.`, "success");
          navigateTo("/dashboard");
        } else {
          fail(data.error || "Could not create the account.");
        }
      } catch (error) {
        console.error("Registration failed:", error);
        fail(
          error.name === "TimeoutError"
            ? "The server did not answer within a minute. It is hosted on a free tier and may still be starting — try again."
            : "Could not reach the server. Check your connection and try again.",
        );
      } finally {
        setBusy(submitButton, false);
      }
    },
  );

  // « Back » ramène à la démo, d'où vient le visiteur ; la connexion est un
  // choix à côté, pas l'écran de repli.
  document.getElementById("arrowbackregister").addEventListener(
    "click",
    function (event) {
      event.preventDefault();
      navigateTo("/");
    },
  );

  document.getElementById("registerbutton42").addEventListener(
    "click",
    function (event) {
      event.preventDefault();
      window.location.href = "/api/auth/42/login/";
    },
  );

  for (const button of document.querySelectorAll(".unmask")) {
    button.addEventListener("click", handleUnmaskPassword);
  }
}
