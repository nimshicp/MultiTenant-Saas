import api from "../axios";

/**
 * Create a Project Manager
 * 
 * Target: Tenant Schema (e.g., buildtech.localhost:8000)
 * Required Permissions: Must be logged in as COMPANY_ADMIN
 * 
 * @param {Object} formData - { email, username, name, password }
 */
export const createProjectManager = async (formData) => {
  try {
    const response = await api.post("/api/accounts/create/", {
      email: formData.email,
      username: formData.username || formData.email, // Fallback to email if username is empty
      name: formData.name,
      password: formData.password,
    });

    // Returns the newly created user object
    return response.data;
  } catch (error) {
    // Standardizing error messages from Django Rest Framework
    const errorData = error.response?.data;
    
    let errorMessage = "Failed to create Project Manager.";

    if (errorData) {
      if (typeof errorData === "string") {
        errorMessage = errorData;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      } else {
        // Flattens DRF field errors like { email: ["Already exists"] } 
        // into a single string: "email: Already exists"
        errorMessage = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ");
      }
    }

    throw new Error(errorMessage);
  }
};

/**
 * Get Current Logged-in User Profile
 * Useful for displaying user name/role in the Sidebar/Navbar
 */
export const fetchMe = async () => {
  try {
    const response = await api.get("/api/accounts/me/");
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error("Could not fetch user profile");
  }
};

/**
 * List all users in the current tenant
 * (Handy for a 'Team' or 'User Management' page)
 */
export const fetchTenantUsers = async () => {
  try {
    const response = await api.get("/api/accounts/users/");
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error("Could not fetch users");
  }
};