import { LOCK_ICON, LOCK_OPEN_ICON } from "./icons.js";

// Bascule du champ mot de passe, partagée par login et register : les deux
// écrans en avaient une copie mot pour mot, et celle de login référençait
// LOCK_OPEN_ICON sans l'importer — ReferenceError au premier clic.
export function handleUnmaskPassword(event) {
  const button = event.currentTarget;
  const input = button.previousElementSibling;
  const shown = input.type === "password";
  input.type = shown ? "text" : "password";
  // Le bouton ne disait pas son état : un lecteur d'écran ne savait pas si le
  // mot de passe était affiché ou masqué.
  button.setAttribute("aria-pressed", String(shown));
  button.setAttribute("aria-label", shown ? "Hide password" : "Show password");
  button.innerHTML = shown ? LOCK_OPEN_ICON : LOCK_ICON;
}
