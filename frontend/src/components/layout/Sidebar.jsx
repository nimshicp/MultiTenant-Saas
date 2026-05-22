import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Sidebar = () => {
  const { user } = useAuth();

  const getNavLinks = () => {
    const role = user?.role;

    const links = [];

    if (role === "SUPERADMIN") {
      links.push({ name: "Platform Admin", path: "/platform-admin" });
    } else if (role === "ADMIN") {
      links.push(
        { name: "Dashboard", path: "/company-dashboard" },
        { name: "Projects", path: "/company-dashboard/projects" },
        { name: "Invite Team", path: "/company-dashboard/team" },
        { name: "Chat", path: "/chat" }
      );
    } else if (role === "PROJECT_MANAGER") {
      links.push(
        { name: "Dashboard", path: "/project-manager-dashboard" },
        { name: "Projects", path: "/company-dashboard/projects" },
        { name: "Chat", path: "/chat" }
      );
    } else if (role === "EMPLOYEE" || role === "VIEWER") {
      links.push(
        { name: "My Dashboard", path: "/employee-dashboard" },
        { name: "Projects", path: "/company-dashboard/projects" },
        { name: "Chat", path: "/chat" }
      );
    }

    // Common links
    if (role) {
      links.push({ name: "Security", path: "/security" });
    }

    return links;
  };

  const navLinks = getNavLinks();

  const getRoleDisplay = () => {
    const role = user?.role;
    if (role === "SUPERADMIN") return "Super Administrator";
    if (role === "ADMIN") return "Company Administrator";
    if (role === "PROJECT_MANAGER") return "Project Manager";
    if (role === "EMPLOYEE") return "Team Member";
    if (role === "VIEWER") return "Viewer";
    return "User";
  };

  return (
    <aside className="w-72 bg-[#0A0A0F] text-white min-h-screen flex flex-col border-r border-white/5 relative overflow-hidden">
      {/* Subtle background glow matching landing page */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#FF6B2C]/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Logo Section */}
      <div className="relative z-10 p-8 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-gradient-to-br from-[#FF6B2C] to-[#FF8533] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF6B2C]/20">
            <span className="text-white text-2xl font-bold italic">B</span>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tighter">Binford</h2>
            <p className="text-[9px] text-gray-500 uppercase tracking-[0.2em] mt-0.5">Enterprise</p>
          </div>
        </div>
      </div>

      {/* User Info Section */}
      {user && (
        <div className="relative z-10 px-8 py-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#FF6B2C]/10 border border-[#FF6B2C]/20 flex items-center justify-center">
              <span className="text-[#FF6B2C] text-sm font-black">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white truncate">
                {user?.name || user?.email?.split('@')[0] || "User"}
              </p>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate mt-0.5">{getRoleDisplay()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="relative z-10 mt-8 flex flex-col gap-2 px-4 flex-1">
        <div className="mb-4 ml-4 text-[9px] font-black uppercase tracking-[0.3em] text-gray-600">
          Control Matrix
        </div>
        {navLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end
            className={({ isActive }) =>
              `group flex items-center gap-4 rounded-2xl px-5 py-4 text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                isActive
                  ? "bg-[#FF6B2C]/10 text-[#FF6B2C] border border-[#FF6B2C]/20 shadow-xl shadow-[#FF6B2C]/5"
                  : "text-gray-500 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            {link.icon && (
              <span className={`text-lg transition-all group-hover:scale-110 ${
                link.path === window.location.pathname ? "text-[#FF6B2C]" : ""
              }`}>
                {link.icon}
              </span>
            )}
            <span>{link.name}</span>
            {link.path === window.location.pathname && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FF6B2C] shadow-[0_0_8px_#FF6B2C]"></div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Section */}
      <div className="relative z-10 p-8 border-t border-white/5 mt-auto">
        <div className="rounded-[24px] bg-white/5 backdrop-blur-xl p-5 border border-white/10 hover:border-[#FF6B2C]/30 transition-all duration-300 group cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#FF6B2C]/10 flex items-center justify-center text-[#FF6B2C] group-hover:bg-[#FF6B2C] group-hover:text-white transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase tracking-widest">Support</p>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Active Node</p>
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
};

export default Sidebar;
