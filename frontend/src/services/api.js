import axios from "axios";

// VITE_API_URL should be the base host e.g. http://localhost:8000
// We always append /api so routes like /auth/register resolve correctly.
const getBaseHost = () => {
  if (import.meta.env.VITE_API_URL) {
    let host = import.meta.env.VITE_API_URL;
    if (host.includes("localhost")) {
      host = host.replace("localhost", "127.0.0.1");
    }
    return host;
  }
  return `http://${window.location.hostname}:8000`;
};
const BASE_HOST = getBaseHost();
const API_URL = `${BASE_HOST}/api`;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to add auth token if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
