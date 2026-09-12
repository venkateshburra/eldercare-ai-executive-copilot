// src/api/client.js
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://eldercare-ai-executive-copilot.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("eldercare_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: global error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || "An unexpected error occurred";

    if (status === 401) {
      // Avoid redirect loops if already on login page
      if (!window.location.pathname.includes("/login")) {
        localStorage.removeItem("eldercare_token");
        localStorage.removeItem("eldercare_user");
        toast.error("Session expired. Please log in again.");
        window.location.href = "/login";
      }
    } else if (status === 403) {
      toast.error(`Access Denied: ${message}`);
    } else if (status === 429) {
      toast.error("Rate limit exceeded. Please wait a moment.");
    }

    return Promise.reject(error);
  }
);

export default api;
