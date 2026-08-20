// Point d'entrée de la SPA : les feuilles de style, puis le routeur.
//
// Bootstrap est parti : le paquet entier était chargé sur chaque route pour un
// tiroir et un toast. `window.bootstrap` avec lui — c'est cette globale, que le
// gabarit Django fournissait autrefois, qui imposait l'`await import()` du
// routeur, un `import` statique étant hoisté au-dessus de son affectation.

import "./css/tokens.css";
import "./css/home.css";
import "./css/dashboard.css";
import "./css/register.css";
import "./css/login.css";
import "./css/settings.css";
import "./css/profile.css";

import "./app.js";
