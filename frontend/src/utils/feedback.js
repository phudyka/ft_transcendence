// Retour d'information à l'écran : les toasts et l'état occupé des boutons.
//
// `showToast` vivait dans `unmask.js`, à côté d'une bascule de champ mot de
// passe avec laquelle elle n'a rien à voir.

import { html } from "./html.js";

// Le corps était toujours orange : « Friend request sent » et « An error
// occurred » rendaient le même rectangle, au même endroit. Les tokens
// sémantiques existaient déjà et ne servaient nulle part.
const TOAST_MS = 5000;

const BODY_CLASS = {
  success: "toast-body-success",
  error: "toast-body-error",
  warning: "toast-body-warning",
  info: "toast-body-accent",
};

export function showToast(message, type = "success") {
  // « Friend request sent » coupait la parole au lecteur d'écran au même titre
  // qu'une erreur. Seul ce qui a échoué interrompt ; le reste attend son tour.
  const urgent = type === "error" || type === "warning";
  const toastHtml = html`
    <div
      class="toast"
      role="${urgent ? "alert" : "status"}"
      aria-live="${urgent ? "assertive" : "polite"}"
      aria-atomic="true"
    >
      <div class="toast-header">
        <strong class="me-auto">${type.charAt(0).toUpperCase() +
          type.slice(1)}</strong>
        <button type="button" class="btn-close" aria-label="Close"></button>
      </div>
      <div class="toast-body ${BODY_CLASS[type] || BODY_CLASS.info}">
        ${message}
      </div>
    </div>
  `;

  const container = document.createElement("div");
  container.className = "toast-container";
  container.innerHTML = toastHtml;
  document.body.appendChild(container);

  // `bootstrap.Toast` posait le fondu et retirait le toast au bout de 5 s. La
  // durée est la même ; le conteneur part avec lui, sans quoi ils s'empilent
  // au même endroit et s'accumulent dans le DOM.
  const dismiss = () => container.remove();
  container.querySelector(".btn-close").addEventListener("click", dismiss);
  setTimeout(dismiss, TOAST_MS);
}

// Aucun bouton de soumission ne disait qu'il travaillait, alors que le premier
// login réveille une API endormie et peut prendre une minute.
export function setBusy(button, busy, busyLabel) {
  if (!button) return;
  if (busy) {
    button.dataset.idleLabel = button.textContent;
    if (busyLabel) button.textContent = busyLabel;
  } else if (button.dataset.idleLabel) {
    button.textContent = button.dataset.idleLabel;
    delete button.dataset.idleLabel;
  }
  button.disabled = busy;
  button.setAttribute("aria-busy", String(busy));
}
