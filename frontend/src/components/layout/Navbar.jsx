import React from "react";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    // Redirect is handled inside the logout function in api/auth.js
  };

  // Helper to get initials for the avatar
  const getInitials = (name) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/5 shadow-sm sticky top-0 z-10 text-white">
      <div className="flex h-16 items-center justify-between px-8">
        
        {/* Left: Company Identifier */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 bg-[#FF6B2C] rounded-full"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 leading-none">
              Workspace
            </span>
            <span className="text-lg font-bold text-white leading-tight italic tracking-tighter">
              {user?.tenant || "BuildFlow Platform"}
            </span>
          </div>
        </div>

        {/* Right: User Profile & Actions */}
        <div className="flex items-center gap-6">
          
          <div className="flex items-center gap-3 border-r border-white/5 pr-6">
            {/* User Text Info */}
            <div className="flex flex-col text-right">
              <span className="text-sm font-bold text-white leading-tight">
                {user?.user || "New User"}
              </span>
              <div className="flex items-center justify-end gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getRoleColor(user?.role)}`}>
                  {user?.role?.replace("_", " ") || "MEMBER"}
                </span>
              </div>
            </div>

            {/* Avatar */}
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#FF6B2C] to-[#FF8533] flex items-center justify-center text-white text-xs font-bold shadow-md border-2 border-white/10">
              {getInitials(user?.user)}
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-gray-400 transition hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

const getRoleColor = (role) => {
  switch (role) {
    case "SUPERADMIN": return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
    case "ADMIN": return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    case "PROJECT_MANAGER": return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    default: return "bg-white/5 text-gray-400 border border-white/10";
  }
};

export default Navbar;
