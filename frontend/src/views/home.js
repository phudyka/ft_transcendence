import { announceRoute, navigateTo } from "../app.js";
import { html } from "../utils/html.js";

// Écran d'accueil.
//
// `/` servait le formulaire de connexion : la scène 3D — le seul argument du
// produit — n'était atteignable qu'après inscription, réveil de l'API et
// chargement du GLB. Un visiteur venu d'un lien de portfolio repartait sans
// avoir rien vu de ce qui distingue ce projet.
//
// Ici le jeu est le premier écran, jouable en solo sans compte : le service
// temps réel admet un invité sur le namespace `/game` (voir `allowGuest` dans
// `src/realtime/app/auth.mjs`), qui n'a droit qu'aux modes tenant dans un seul
// navigateur. Le compte n'est demandé que pour ce qu'il débloque réellement —
// jouer en ligne, les amis, le chat, l'historique.
export function home() {
  document.getElementById("ft_transcendence").innerHTML = html`
    <div class="home-view">
      <header class="home-bar">
        <div class="home-identity">
          <img src="/brand/logo2.png" alt="" width="40" height="40">
          <h1 class="home-title">ft_transcendence</h1>
        </div>
        <p class="home-tagline">
          Pong in 3D. Play the demo right now — no account needed.
        </p>
        <div class="home-actions">
          <button type="button" class="btn btn-outline-light" id="home-login">
            Log in
          </button>
          <button type="button" class="btn btn-primary" id="home-register">
            Create account
          </button>
        </div>
      </header>

      <main class="home-stage">
        <h2 class="visually-hidden">Playable demo</h2>
        <iframe
          id="demo-game"
          title="Pong 3D — solo demo against the AI"
          src="/game.html"
        ></iframe>
      </main>

      <footer class="home-footer">
        <p>
          Online matches, tournaments, friends and chat come with an account.
        </p>
      </footer>
    </div>
  `;

  document.getElementById("home-login").addEventListener(
    "click",
    () => navigateTo("/login"),
  );
  document.getElementById("home-register").addEventListener(
    "click",
    () => navigateTo("/register"),
  );

  announceRoute("Play");
}
