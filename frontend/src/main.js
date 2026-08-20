// Point d'entrée de la SPA.
//
// Les vues sont écrites en template strings et s'appuient sur une globale que
// le template Django fournissait auparavant : `bootstrap`. On la réinstalle ici
// plutôt que de réécrire une trentaine de vues.

import "bootstrap/dist/css/bootstrap.min.css";
import "./css/tokens.css";
import "./css/home.css";
import "./css/dashboard.css";
import "./css/register.css";
import "./css/login.css";
import "./css/settings.css";
import "./css/profile.css";

// Le paquet importait Bootstrap en entier : les vues n'utilisent que deux
// composants, le reste était du code mort embarqué à chaque chargement de page.
// Chart.js a disparu avec lui — le seul graphique du site est un donut à deux
// parts, que `conic-gradient` dessine sans une ligne de JavaScript.
import { Offcanvas, Toast } from "bootstrap";

window.bootstrap = { Offcanvas, Toast };

// Import dynamique volontaire : un `import` statique serait hoisté au-dessus des
// affectations ci-dessus et le routeur démarrerait sans ses globales.
await import("./app.js");
