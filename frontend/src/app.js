import { home } from "./views/home.js";
import { login } from "./views/login.js";
import { register } from "./views/register.js";
import { dashboard } from "./views/dashboard.js";
import { profile } from "./views/profile.js";
import { settings } from "./views/settings.js";
import { notFound } from "./views/notfound.js";
import { removeDashboardEventListeners } from "./views/dashboard.js";

// Routes qui exigent une session. `"/profile/*"` figurait dans cette liste,
// comparée par `includes()` : jamais égal à un chemin réel, donc sans effet.
// Les profils sont couverts par la branche `startsWith("/profile/")`.
const PROTECTED_ROUTES = ["/dashboard", "/settings", "/profile"];

// Un changement de route remplace tout le document par `innerHTML` : sans ces
// deux gestes, le focus retombe sur `<body>`, le titre de l'onglet ne bouge
// jamais, et rien n'annonce qu'on a changé de page.
export function announceRoute(title) {
  document.title = `${title} — ft_transcendence`;
  const heading = document.querySelector("#ft_transcendence h1");
  if (!heading) return;
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
}

// Déclaration de router comme une variable globale au module
let router;

function initRouter() {
  router = function () {
    const path = window.location.pathname;

    // Vérifier si l'utilisateur tente d'accéder à une route protégée sans être connecté
    if (PROTECTED_ROUTES.includes(path) && !isUserLoggedIn()) {
      navigateTo("/login");
      return;
    }

    // Un profil demandé sans session tombait sur un 404 (`/profile/alice`) ou
    // sur `GET /api/user/null/` (`/profile`) : deux impasses là où il fallait
    // simplement demander à se connecter.
    if (path.startsWith("/profile/")) {
      if (!isUserLoggedIn()) {
        navigateTo("/login");
        return;
      }
      const friendName = decodeURIComponent(path.split("/").pop());
      profile(friendName);
    } else if (path === "/profile") {
      // Gérer le cas où l'URL est simplement /profile
      const username = sessionStorage.getItem("username");
      profile(username);
    } else {
      switch (path) {
        // La scène est le produit : elle est le premier écran, jouable en
        // solo sans compte. Le formulaire de connexion vit sur `/login`.
        case "/":
          if (isUserLoggedIn()) {
            navigateTo("/dashboard");
          } else {
            home();
          }
          break;
        case "/login":
          if (isUserLoggedIn()) {
            navigateTo("/dashboard");
          } else {
            login();
          }
          break;
        case "/dashboard":
          dashboard();
          break;
        case "/register":
          if (isUserLoggedIn()) {
            navigateTo("/dashboard");
          } else {
            register();
          }
          break;
        case "/settings":
          settings();
          break;
        default:
          notFound();
      }
    }
  };

  window.addEventListener("popstate", router);

  // Gestionnaire pour les clics sur les liens
  document.body.addEventListener("click", (e) => {
    if (e.target.matches("[data-link]")) {
      e.preventDefault();
      navigateTo(e.target.getAttribute("href"));
    }
  });

  // Initial route call
  router();
}

export function navigateTo(pathname) {
  if (PROTECTED_ROUTES.includes(pathname) && !isUserLoggedIn()) {
    removeDashboardEventListeners();
    pathname = "/login";
  }

  const fullPath = window.location.origin + pathname;
  window.history.pushState({}, pathname, fullPath);
  router();
}

// `main.js` charge ce module derrière un `await import()` : son évaluation se
// termine après DOMContentLoaded, donc l'écouteur seul ne partirait jamais.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initRouter);
} else {
  initRouter();
}

function isUserLoggedIn() {
  return sessionStorage.getItem("username") !== null;
}
