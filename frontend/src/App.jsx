import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PlatformDashboard from "./pages/PlatformDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import ProjectManagerDashboard from "./pages/ProjectManagerDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import TeamManagement from "./pages/TeamManagement";
import AcceptInvitation from "./pages/AcceptInvitation";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import LandingPage from "./pages/LandingPage";
import Security from "./pages/Security";
import ChatPage from "./pages/ChatPage";

// Layout & Protection
import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";

// Auto-redirector for the root path
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user?.role === "SUPERADMIN") return <Navigate to="/platform-admin" replace />;
  if (user?.role === "ADMIN") return <Navigate to="/company-dashboard" replace />;
  if (user?.role === "PROJECT_MANAGER") return <Navigate to="/project-manager-dashboard" replace />;
  if (user?.role === "EMPLOYEE") return <Navigate to="/employee-dashboard" replace />;

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />

          {/* Protected Routes inside the Main Layout */}
          <Route element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>

            {/* SUPER ADMIN Routes */}
            <Route path="/platform-admin" element={
              <RoleRoute allowedRoles={["SUPERADMIN"]}>
                <PlatformDashboard />
              </RoleRoute>
            } />

            {/* COMPANY ADMIN Routes */}
            <Route path="/company-dashboard" element={
              <RoleRoute allowedRoles={["ADMIN"]}>
                <CompanyDashboard />
              </RoleRoute>
            } />
            <Route path="/company-dashboard/projects" element={
              <RoleRoute allowedRoles={["ADMIN", "PROJECT_MANAGER", "EMPLOYEE", "VIEWER"]}>
                <Projects />
              </RoleRoute>
            } />
            <Route path="/company-dashboard/projects/:projectId" element={
              <RoleRoute allowedRoles={["ADMIN", "PROJECT_MANAGER", "EMPLOYEE", "VIEWER"]}>
                <ProjectDetails />
              </RoleRoute>
            } />
            <Route path="/company-dashboard/team" element={
              <RoleRoute allowedRoles={["ADMIN"]}>
                <TeamManagement />
              </RoleRoute>
            } />

            {/* PROJECT MANAGER Routes */}
            <Route path="/project-manager-dashboard" element={
              <RoleRoute allowedRoles={["PROJECT_MANAGER", "ADMIN"]}>
                <ProjectManagerDashboard />
              </RoleRoute>
            } />

            {/* EMPLOYEE Routes */}
            <Route path="/employee-dashboard" element={
              <RoleRoute allowedRoles={["EMPLOYEE", "ADMIN"]}>
                <EmployeeDashboard />
              </RoleRoute>
            } />

            {/* COMMON Routes */}
            <Route path="/security" element={<Security />} />
            <Route path="/chat" element={<ChatPage />} />

          </Route>

          {/* Root catch-all */}
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
