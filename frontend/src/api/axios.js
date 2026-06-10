import axios from "axios";

/**
 * Build backend URL dynamically.
 */
const getBaseURL = () => {
  const company = localStorage.getItem("company") || "";
  const cleanedCompany = company.trim().toLowerCase();

  const API_URL = import.meta.env.VITE_API_URL;

  if (!cleanedCompany) {
    return API_URL;
  }

  return API_URL;
};

/**
 * Main Axios instance used throughout the application.
 */
const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Attach access token to every request.
 */
api.interceptors.request.use(
  (config) => {
    config.headers = config.headers || {};

    const accessToken = localStorage.getItem("access");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    if (
      typeof FormData !== "undefined" &&
      config.data instanceof FormData
    ) {
      if (typeof config.headers.delete === "function") {
        config.headers.delete("Content-Type");
      } else {
        delete config.headers["Content-Type"];
      }
    }

    // Recalculate baseURL in case company changes after login
    config.baseURL = getBaseURL();

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Prevent multiple simultaneous refresh requests.
 */
let isRefreshing = false;
let failedQueue = [];

/**
 * Process all queued requests after refresh succeeds or fails.
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Automatically refresh access token when it expires.
 */
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem("access")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${getBaseURL()}/api/auth/token/refresh/`,
          {},
          {
            withCredentials: true,
          }
        );

        const newAccessToken = response.data.access;

        localStorage.setItem("access", newAccessToken);

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        localStorage.removeItem("access");
        localStorage.removeItem("user");
        localStorage.removeItem("company");
        localStorage.removeItem("schema_name");
        localStorage.removeItem("user_type");

        window.location.href = `${window.location.origin}/login`;

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;