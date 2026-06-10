// src/api/auth.js

import axios from "axios";
import api from "./axios";

/**
 * Returns backend URL from environment variable.
 */
export const getBackendUrl = (company = null) => {
  return import.meta.env.VITE_API_URL;
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
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (response.status === 202 && response.data.mfa_required) {
    return response.data;
  }

  const access = response.data.tokens.access;
  const user = response.data.data;

  if (!user.role) {
    user.role =
      user.subdomain === "admin"
        ? "SUPER_ADMIN"
        : "COMPANY_ADMIN";
  }

  localStorage.setItem("access", access);
  localStorage.setItem("user", JSON.stringify(user));

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
 */
export const logout = async () => {
  try {
    await api.post("/auth/logout/", {});
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    localStorage.removeItem("access");
    localStorage.removeItem("user");
    localStorage.removeItem("company");

    window.location.href = `${window.location.origin}/login?logout=true`;
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
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem("access");
};

/**
 * Restore Session on Page Reload
 */
export const restoreSession = async () => {
  const user = getCurrentUser();
  const access = getAccessToken();

  if (access && user) {
    return user;
  }

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

  const response = await axios.post(
    `${baseURL}/auth/password-reset/`,
    { email }
  );

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
    user.role =
      user.subdomain === "admin"
        ? "SUPER_ADMIN"
        : "COMPANY_ADMIN";
  }

  localStorage.setItem("access", access);
  localStorage.setItem("user", JSON.stringify(user));
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
 * Confirm Password Reset
 */
export const confirmPasswordReset = async (
  token,
  password,
  confirm_password
) => {
  const baseURL = getBackendUrl();

  const response = await axios.post(
    `${baseURL}/auth/password-reset-confirm/${token}/`,
    {
      password,
      confirm_password,
    }
  );

  return response.data;
};