// src/api/auth.js

import axios from "axios";
import api from "./axios";

/**
 * Returns backend URL based on company subdomain.
 *
 * Examples:
 * - localhost:5173            -> http://localhost:8000
 * - buildtech.localhost:5173  -> http://buildtech.localhost:8000
 * - abc.localhost:5173        -> http://abc.localhost:8000
 */
export const getBackendUrl = (company = null) => {
  // If company is explicitly provided, use it
  if (company && company.trim() !== "") {
    return `http://${company}.localhost:8000`;
  }

  // Otherwise use the current hostname automatically
  return `http://${window.location.hostname}:8000`;
};

/**
 * Login User
 *
 * Sends email/password to backend.
 * Backend returns:
 * - access token (JSON response)
 * - user details (JSON response)
 * - refresh token (HttpOnly cookie set automatically)
 *
 * Stored in browser:
 * - localStorage.access
 * - localStorage.user
 * - localStorage.company
 *
 * Refresh token is NOT stored manually because it is in HttpOnly cookie.
 */
export const login = async ({ email, password }) => {
  const baseURL = getBackendUrl();

  const response = await axios.post(
    `${baseURL}/auth/login/`,
    {
      email,
      password,
    },
    {
      withCredentials: true, // Accept HttpOnly refresh token cookie
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  // MFA flow (optional for future use)
  if (response.status === 202 && response.data.mfa_required) {
    return response.data;
  }

  const access = response.data.tokens.access;
  const user = response.data.data;

  // Use role from backend, or determine based on subdomain if missing
  if (!user.role) {
    user.role =
      user.subdomain === "admin"
        ? "SUPER_ADMIN"
        : "COMPANY_ADMIN";
  }

  // Save access token and user info
  localStorage.setItem("access", access);
  localStorage.setItem("user", JSON.stringify(user));

  // Save tenant/company identifier for future API calls
  // Examples:
  // - admin  -> ""
  // - abc    -> "abc"
  // - buildtech -> "buildtech"
  localStorage.setItem(
    "company",
    user.subdomain === "admin" ? "" : user.subdomain
  );

  return {
    user,
    access,
    message: response.data.message,
  };
};

/**
 * Logout User
 *
 * Backend clears refresh token cookie.
 * Frontend clears localStorage.
 */
export const logout = async () => {
  try {
    await api.post("/auth/logout/", {});
  } catch (error) {
    // Even if backend logout fails, clear frontend session
    console.error("Logout error:", error);
  } finally {
    localStorage.removeItem("access");
    localStorage.removeItem("user");
    localStorage.removeItem("company");

    // Always redirect back to the public (root) domain login page
    window.location.href = "http://localhost:5173/login?logout=true";
  }
};

/**
 * Get Current Logged-in User
 */
export const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

/**
 * Get Current Access Token
 */
export const getAccessToken = () => {
  return localStorage.getItem("access");
};

/**
 * Check Whether User Is Authenticated
 *
 * If access token exists, user is considered logged in.
 * Even if access token is expired, axios interceptor
 * will automatically refresh it using HttpOnly cookie.
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem("access");
};

/**
 * Restore Session on Page Reload
 *
 * Purpose:
 * - Called when app starts.
 * - If access token exists, return stored user.
 * - If access token is missing but refresh cookie is still valid,
 *   request a new access token.
 * - If refresh token is expired, clear session and return null.
 */
export const restoreSession = async () => {
  const user = getCurrentUser();
  const access = getAccessToken();

  // If access token exists, session is already active
  if (access && user) {
    return user;
  }

  // Try to refresh using HttpOnly refresh token cookie
  try {
    const company = localStorage.getItem("company") || null;

    const response = await axios.post(
      `${getBackendUrl(company)}/api/auth/token/refresh/`,
      {},
      {
        withCredentials: true,
      }
    );

    const newAccess = response.data.access;

    localStorage.setItem("access", newAccess);

    return user;
  } catch (error) {
    // Refresh token invalid or expired
    localStorage.removeItem("access");
    localStorage.removeItem("user");
    localStorage.removeItem("company");

    return null;
  }
};

/**
 * Request Password Reset
 */
export const requestPasswordReset = async (email) => {
  const baseURL = getBackendUrl();
  const response = await axios.post(`${baseURL}/auth/password-reset/`, { email });
  return response.data;
};

/**
 * Verify MFA Login
 */
export const verifyMFALogin = async ({ email, code }) => {
  const baseURL = getBackendUrl();
  const response = await axios.post(
    `${baseURL}/auth/mfa/verify-login/`,
    { email, code },
    {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    }
  );

  const access = response.data.tokens.access;
  const user = response.data.data;

  if (!user.role) {
    user.role = user.subdomain === "admin" ? "SUPER_ADMIN" : "COMPANY_ADMIN";
  }

  localStorage.setItem("access", access);
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("company", user.subdomain === "admin" ? "" : user.subdomain);

  return { user, access, message: response.data.message };
};

/**
 * Confirm Password Reset
 */
export const confirmPasswordReset = async (token, password, confirm_password) => {
  const baseURL = getBackendUrl();
  const response = await axios.post(`${baseURL}/auth/password-reset-confirm/${token}/`, { 
    password, 
    confirm_password 
  });
  return response.data;
};