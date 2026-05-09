// src/api/dashboard.js

import api from "../axios";

/**
 * Fetch Platform Dashboard Data
 *
 * Backend Endpoint:
 * GET /api/platform/dashboard/
 *
 * Required Permission:
 * - User must be logged in as Super Admin
 *
 * Response Example:
 * {
 *   "platform_admin": {
 *     "id": 1,
 *     "email": "admin@example.com",
 *     "username": "platformadmin",
 *     "name": "Platform Admin",
 *     "role": "SUPER_ADMIN"
 *   },
 *   "stats": {
 *     "total_tenants": 10,
 *     "active": 8
 *   }
 * }
 */
export const getPlatformDashboard = async () => {
  try {
    const response = await api.get("/api/platform/dashboard/");
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching platform dashboard:",
      error.response?.data || error.message
    );
    throw error.response?.data || { detail: "Failed to fetch dashboard data." };
  }
};