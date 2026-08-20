import { getCookie } from "../views/settings.js";

export async function fetchWithToken(url, options = {}) {
  const token = sessionStorage.getItem("accessToken");
  const csrfToken = getCookie("csrftoken");
  const headers = {
    ...options.headers,
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-CSRFToken": csrfToken,
  };

  const method = options.method || "GET";
  const response = await fetch(url, { ...options, method, headers });
  return response;
}
