import axios from "axios";

/**
 * Build backend URL dynamically.
 *
 * Examples:
 * - company = ""        -> http://localhost:8000
 * - company = "myntra"  -> http://myntra.localhost:8000
 */
const getBaseURL = () => {
  const company = localStorage.getItem("company") || "";
  const cleanedCompany = company.trim().toLowerCase();

  if (!cleanedCompany) {
    return "http://localhost:8000";
  }

  return `http://${cleanedCompany}.localhost:8000`;
};

/**
 * Main Axios instance used throughout the application.
 */
const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true, // Sends HttpOnly refresh token cookie automatically
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Attach access token to every request.
 */
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("access");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
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

    // Access token expired
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem("access")
    ) {
      // If another refresh is already in progress, wait for it
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization =
              `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Browser automatically sends refresh_token HttpOnly cookie
        const response = await axios.post(
          `${getBaseURL()}/api/auth/refresh/`,
          {},
          {
            withCredentials: true,
          }
        );

        const newAccessToken = response.data.access;

        // Store new access token
        localStorage.setItem("access", newAccessToken);

        // Retry queued requests
        processQueue(null, newAccessToken);

        // Retry original request
        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token expired or invalid
        processQueue(refreshError, null);

        // Clear local storage
        localStorage.removeItem("access");
        localStorage.removeItem("user");
        localStorage.removeItem("company");
        localStorage.removeItem("schema_name");
        localStorage.removeItem("user_type");

        // Redirect to login page
        window.location.href = "http://localhost:3000/login";

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;