import axios from "axios";
import { getOidc } from "../oidc";

const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const apiBaseURL = isLocalhost
  ? "/api"
  : import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export const client = axios.create({
  baseURL: apiBaseURL,
});

client.interceptors.request.use(
  async (config) => {
    const oidc = await getOidc();

    if (oidc.isUserLoggedIn) {
      const accessToken = await oidc.getAccessToken();
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle auth errors etc
    return Promise.reject(error);
  }
);
