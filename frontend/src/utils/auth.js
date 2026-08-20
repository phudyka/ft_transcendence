import { fetchWithToken } from "./api.js";

export async function checkAuthentication() {
  if (!sessionStorage.getItem("accessToken")) {
    return false;
  }

  try {
    const response = await fetchWithToken("/api/verify-token/", {
      method: "POST",
    });

    if (response.ok) {
      return true;
    } else {
      sessionStorage.removeItem("accessToken");
      return false;
    }
  } catch (error) {
    console.error("Erreur lors de la vérification du token:", error);
    return false;
  }
}
