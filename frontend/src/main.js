// Point d'entrée de la SPA.
//
// Les vues sont écrites en template strings et s'appuient sur trois globales
// que le template Django fournissait auparavant : `staticUrl`, `bootstrap` et
// `Chart`. On les réinstalle ici plutôt que de réécrire une trentaine de vues.

import 'bootstrap/dist/css/bootstrap.min.css';
import './css/dashboard.css';
import './css/register.css';
import './css/login.css';
import './css/settings.css';
import './css/profile.css';

import * as bootstrap from 'bootstrap';
import Chart from 'chart.js/auto';

// Les images vivent dans public/content/ et sont servies à la racine.
window.staticUrl = '/';
window.bootstrap = bootstrap;
window.Chart = Chart;

// Import dynamique volontaire : un `import` statique serait hoisté au-dessus des
// affectations ci-dessus et le routeur démarrerait sans ses globales.
await import('./js/app.js');
