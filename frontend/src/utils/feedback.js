// Retour d'information à l'écran : les toasts et l'état occupé des boutons.
//
// `showToast` vivait dans `unmask.js`, à côté d'une bascule de champ mot de
// passe avec laquelle elle n'a rien à voir.

import { html } from "./html.js";

// Le corps était toujours orange : « Friend request sent » et « An error
// occurred » rendaient le même rectangle, au même endroit. Les tokens
// sémantiques existaient déjà et ne servaient nulle part.
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
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="toast"
          aria-label="Close"
        >
        </button>
      </div>
      <div class="toast-body ${BODY_CLASS[type] || BODY_CLASS.info}">
        ${message}
      </div>
    </div>
  `;

  const toastContainer = document.createElement("div");
  toastContainer.className =
    "toast-container position-fixed top-0 start-50 translate-middle-x p-3";
  toastContainer.innerHTML = toastHtml;
  document.body.appendChild(toastContainer);

  const toastElement = toastContainer.querySelector(".toast");
  // Le conteneur n'était jamais retiré : tous posés au même endroit, ils se
  // masquaient l'un l'autre et s'accumulaient dans le DOM.
  toastElement.addEventListener(
    "hidden.bs.toast",
    () => toastContainer.remove(),
  );
  new bootstrap.Toast(toastElement).show();
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
