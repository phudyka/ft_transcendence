// Icônes en SVG inline.
//
// Le projet chargeait Font Awesome 5 complet depuis un CDN — feuille de style
// et jeux de webfonts — pour un seul cadenas. Ces deux tracés le remplacent
// sans requête réseau, et `CLAUDE.md` peut de nouveau dire « no CDN ».
//
// Les glyphes sont décoratifs : le nom accessible vient de l'`aria-label` du
// bouton qui les contient.

const SVG = (path) =>
  `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" width="16" height="16">` +
  `<path fill="currentColor" d="${path}"/></svg>`;

export const LOCK_ICON = SVG(
  "M4.5 6.5V4.75a3.5 3.5 0 1 1 7 0V6.5h.75A1.25 1.25 0 0 1 13.5 7.75v5.5A1.25 1.25 0 0 1 12.25 14.5h-8.5A1.25 1.25 0 0 1 2.5 13.25v-5.5A1.25 1.25 0 0 1 3.75 6.5zm1.5 0h4V4.75a2 2 0 1 0-4 0z",
);

export const LOCK_OPEN_ICON = SVG(
  "M11.5 6.5V4.75a2 2 0 1 0-4 0V6h-1.5V4.75a3.5 3.5 0 1 1 7 0V6.5h-.75q.13 0 .25.03V6.5zm.75 0A1.25 1.25 0 0 1 13.5 7.75v5.5A1.25 1.25 0 0 1 12.25 14.5h-8.5A1.25 1.25 0 0 1 2.5 13.25v-5.5A1.25 1.25 0 0 1 3.75 6.5z",
);

export const CHECK_ICON = SVG(
  "M6.2 11.3 3.4 8.5 2 9.9l4.2 4.2L14.5 5.8 13.1 4.4z",
);

export const CROSS_ICON = SVG(
  "M12.7 4.7 11.3 3.3 8 6.6 4.7 3.3 3.3 4.7 6.6 8l-3.3 3.3 1.4 1.4L8 9.4l3.3 3.3 1.4-1.4L9.4 8z",
);

export const SEND_ICON = SVG("M1.7 14.3 15 8 1.7 1.7l1.5 5.1 7 1.2-7 1.2z");
