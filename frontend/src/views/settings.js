import { announceRoute, navigateTo } from "../app.js";
import { html } from "../utils/html.js";
import { setBusy, showToast } from "../utils/feedback.js";
import { fetchWithToken } from "../utils/api.js";
import { disconnectSocket } from "../utils/socketManager.js";

export function settings() {
  const displayName = sessionStorage.getItem("display_name");
  let avatarUrl = sessionStorage.getItem("avatar_url");
  if (avatarUrl) {
    avatarUrl = avatarUrl.replace(/^url\(["']?/, "").replace(/["']?\)$/, "");
  }

  if (!displayName) {
    navigateTo("/login");
    return;
  }

  document.getElementById("ft_transcendence").innerHTML = html`
    <div class="dashboard-container settings-view">
      <header class="view-header">
        <button
          type="button"
          id="pongonlineLink"
          class="brand-button"
          aria-label="Back to dashboard"
        >
          <img
            src="/brand/logo2.png"
            alt=""
            width="70"
            height="70"
          >
        </button>
        <span class="view-header-name">${displayName}</span>
        <img
          src="${avatarUrl}"
          class="rounded-circle view-header-avatar"
          alt=""
          width="50"
          height="50"
        >
      </header>

      <main class="container mt-4 settings-form-container">
        <h1 id="header-dashboard" class="text-center settings-title">
          User Settings
        </h1>
        <form id="settingsForm">
          <div class="mb-3">
            <label for="displayName" class="form-label">Display Name</label>
            <input
              type="text"
              class="field-input"
              id="displayName"
              name="displayName"
              autocomplete="nickname"
            >
          </div>
          <div class="mb-3">
            <label for="email" class="form-label">Email</label>
            <input
              type="email"
              class="field-input"
              id="email"
              name="email"
              autocomplete="email"
            >
          </div>
          <div class="mb-3">
            <label for="avatar" class="form-label">Avatar</label>
            <div class="d-flex align-items-center">
              <img
                id="currentAvatar"
                src="${avatarUrl}"
                alt="Your current avatar"
                class="rounded-circle me-3 avatar-img"
                width="100"
                height="100"
              >
              <input
                type="file"
                class="field-input"
                id="avatar"
                name="avatar"
                accept="image/jpeg, image/png, image/gif"
                aria-describedby="avatar-hints"
              >
            </div>
            <ul class="field-hints" id="avatar-hints">
              <li>Accepted formats: JPG, PNG, GIF</li>
              <li>Maximum size: 2 MB</li>
              <li>Dimensions: between 100×100 and 1000×1000 pixels</li>
            </ul>
          </div>
          <button type="submit" class="btn btn-primary" id="saveSettings">
            Save changes
          </button>
        </form>
        <button type="button" id="backToDashboard" class="btn btn-secondary">
          Back to Dashboard
        </button>
      </main>

      <footer class="footer py-3 my-4">
        <p class="text-center">ft_transcendence — a 3D Pong by phudyka</p>
      </footer>
    </div>
  `;

  attachEventSettingsPage();
  announceRoute("Settings");
}

function attachEventSettingsPage() {
  const pongonlineLink = document.getElementById("pongonlineLink");
  const backToDashboard = document.getElementById("backToDashboard");
  const settingsForm = document.getElementById("settingsForm");
  const avatarInput = document.getElementById("avatar");

  pongonlineLink.addEventListener("click", (event) => {
    event.preventDefault();
    navigateTo("/dashboard");
  });

  backToDashboard.addEventListener("click", () => navigateTo("/dashboard"));

  settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData();

    const displayNameField = document.getElementById("displayName");
    const emailField = document.getElementById("email");
    const displayName = displayNameField.value;

    formData.append("display_name", displayName);
    // Un champ qu'on n'a pas pu précharger ne part pas : sinon il remplace
    // l'adresse enregistrée par une chaîne vide.
    if (emailField.dataset.loaded === "true") {
      formData.append("email", emailField.value);
    }

    const currentDisplayName = sessionStorage.getItem("display_name");
    if (currentDisplayName !== displayName) {
      disconnectSocket();
    }

    const avatarInput = document.getElementById("avatar");
    if (avatarInput && avatarInput.files[0]) {
      formData.append("avatar", avatarInput.files[0]);
    }

    const submitButton = document.getElementById("saveSettings");
    setBusy(submitButton, true, "Saving…");

    try {
      // FormData porte son propre Content-Type (avec la frontière
      // multipart) : on ne passe pas par fetchWithToken, qui force du JSON.
      const response = await fetch("/api/update-user-settings/", {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${sessionStorage.getItem("accessToken")}`,
          "X-CSRFToken": getCookie("csrftoken"),
        },
      });

      if (response.ok) {
        const data = await response.json();
        showToast("Your profile settings have been updated.", "success");

        if (data.avatar_url) {
          sessionStorage.setItem("avatar_url", data.avatar_url);
        }

        if (data.display_name) {
          sessionStorage.setItem("display_name", data.display_name);
        }

        // L'en-tête gardait l'ancien nom et l'ancien avatar jusqu'au prochain
        // changement de route.
        document.querySelector(".view-header-name").textContent = sessionStorage
          .getItem("display_name");
        const avatar = sessionStorage.getItem("avatar_url")
          ?.replace(/^url\(["']?/, "").replace(/["']?\)$/, "");
        if (avatar) {
          document.querySelector(".view-header-avatar").src = avatar;
          document.getElementById("currentAvatar").src = avatar;
        }
      } else {
        const errorData = await response.json();
        showToast(
          errorData.message || "Could not save your settings.",
          "error",
        );
      }
    } catch (error) {
      console.error("Could not update the settings:", error);
      showToast("Could not reach the server. Please try again.", "error");
    } finally {
      setBusy(submitButton, false);
    }
  });

  avatarInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      // Vérification de la taille du fichier
      if (file.size > 2 * 1024 * 1024) {
        showToast("File is too large. Maximum size is 2 MB.", "error");
        avatarInput.value = "";
        return;
      }

      // Vérification du type de fichier
      const acceptedTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!acceptedTypes.includes(file.type)) {
        showToast(
          "File type not accepted. Please choose a JPG, PNG or GIF image.",
          "error",
        );
        avatarInput.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          if (
            img.width < 100 || img.height < 100 || img.width > 1000 ||
            img.height > 1000
          ) {
            showToast(
              "Image dimensions must be between 100x100 and 1000x1000 pixels.",
              "error",
            );
            avatarInput.value = "";
          } else {
            document.getElementById("currentAvatar").src = e.target.result;
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  prefillSettings();
}

async function prefillSettings() {
  const displayNameField = document.getElementById("displayName");
  const emailField = document.getElementById("email");
  displayNameField.value = sessionStorage.getItem("display_name") ?? "";

  // L'adresse n'est pas en session : sans cet appel, le champ reste vide et
  // repart vide à l'enregistrement.
  try {
    const response = await fetchWithToken(
      `/api/user/${encodeURIComponent(displayNameField.value)}/`,
    );
    const data = await response.json();
    if (data.success && data.user) {
      emailField.value = data.user.email ?? "";
      displayNameField.value = data.user.display_name ?? displayNameField.value;
      emailField.dataset.loaded = "true";
    }
  } catch (error) {
    console.error("Could not prefill the settings form:", error);
  }
}

// Un seul cookie est lu, `csrftoken`, et jamais en boucle : la version longue
// découpait `document.cookie` à la main en quatorze lignes.
export function getCookie(name) {
  const hit = document.cookie.match(`(?:^|; )${name}=([^;]*)`);
  return hit ? decodeURIComponent(hit[1]) : null;
}
