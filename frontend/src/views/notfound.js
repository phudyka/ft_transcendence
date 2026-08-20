import { announceRoute, navigateTo } from "../app.js";
import { html } from "../utils/html.js";

export function notFound() {
  // Le bandeau posait du blanc sur #ff8c00 : 2,3:1, sous le minimum WCAG même
  // pour du grand texte. La nuit sur le même orange monte à 8:1.
  //
  // La sortie dépend de la session : renvoyer un utilisateur connecté vers un
  // formulaire de connexion dont il n'a pas besoin était la seule option
  // proposée. La hauteur est en `dvh` — `vh-100` de Bootstrap ignore la barre
  // d'adresse rétractable des navigateurs mobiles.
  const loggedIn = sessionStorage.getItem("username") !== null;
  const backLabel = loggedIn ? "Back to Dashboard" : "Back to the demo";
  const backPath = loggedIn ? "/dashboard" : "/";

  document.getElementById("ft_transcendence").innerHTML = html`
    <main
      class="notfound-view d-flex flex-column align-items-center justify-content-center"
    >
      <div class="alert text-center">
        <h1 class="alert-heading">404: Page Not Found</h1>
        <p>The page you are looking for does not exist.</p>
      </div>
      <button type="button" id="backToLogin" class="btn btn-primary mt-3">
        ${backLabel}
      </button>
    </main>
  `;

  document.getElementById("backToLogin").addEventListener("click", () => {
    navigateTo(backPath);
  });

  announceRoute("Page not found");
}
