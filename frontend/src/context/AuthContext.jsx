import { createContext, useContext, useEffect, useState } from "react";
import {
  login as loginUser,
  logout as logoutUser,
  restoreSession,
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
  const login = async (company, email, password) => {
    const data = await loginUser({
      company,
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
    initializeAuth();
  }, []);

  // Context values
  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
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