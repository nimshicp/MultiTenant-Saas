import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const MainLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A0F]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content wrapper */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <Navbar />

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            {/* The actual page content will be injected here via React Router */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
