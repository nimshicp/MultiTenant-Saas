import { createContext, useContext, useEffect, useState } from "react";
import {
  login as loginUser,
  logout as logoutUser,
  restoreSession,
  verifyMFALogin,
} from "../api/auth";

// Create Context
const AuthContext = createContext();

// Provider Component
export const AuthProvider = ({ children }) => {
  // Global authentication state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated
  const isAuthenticated = !!user;

  /**
   * Login Function
   *
   * Receives:
   * - company
   * - email
   * - password
   *
   * Passes them as a single object to api/auth.js
   */
  const login = async (email, password) => {
    const data = await loginUser({
      email,
      password,
    });

    // Save logged-in user to global state
    setUser(data.user);

    return data;
  };

  /**
   * Logout Function
   */
  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      // Clear user from global state
      setUser(null);
    }
  };

  /**
   * Restore Session on App Load
   */
  const initializeAuth = async () => {
    try {
      const restoredUser = await restoreSession();

      if (restoredUser) {
        setUser(restoredUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Session restoration failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Run once when app starts
   */
  useEffect(() => {
    // Check if we just redirected from another domain and have tokens in the URL
    const params = new URLSearchParams(window.location.search);
    const urlAccess = params.get("access");
    const urlUser = params.get("user");

    if (urlAccess && urlUser) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(urlUser));
        
        // Save to this domain's localStorage
        localStorage.setItem("access", urlAccess);
        localStorage.setItem("user", JSON.stringify(parsedUser));
        localStorage.setItem("company", parsedUser.subdomain === "admin" ? "" : parsedUser.subdomain);
        
        setUser(parsedUser);
        setLoading(false);

        // Clean up the URL so tokens are not visible
        window.history.replaceState({}, document.title, window.location.pathname);
        return; // Skip normal initialization
      } catch (err) {
        console.error("Failed to parse user from URL", err);
      }
    }

    // Normal initialization
    initializeAuth();
  }, []);

  // Context values
  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    verifyMFA: verifyMFALogin,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook
export const useAuth = () => useContext(AuthContext);