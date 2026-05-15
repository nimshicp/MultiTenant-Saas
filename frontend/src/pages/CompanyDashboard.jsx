import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchProjects } from "../api/projects";
import { Link } from "react-router-dom";

const CompanyDashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await fetchProjects();
        setProjects(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load projects:", error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) =>
      ["PLANNING", "IN_PROGRESS"].includes(p.status)
    ).length;
    const completed = projects.filter((p) => p.status === "COMPLETED").length;
    const managers = new Set(
      projects.map((p) => p.project_manager_id).filter(Boolean)
    ).size;
    return { total, active, completed, managers };
  }, [projects]);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-12 font-sans selection:bg-[#FF6B2C] selection:text-white relative overflow-hidden">
      {/* Background glow effects matching landing page */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#FF6B2C]/5 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-15%] right-[-5%] w-[45%] h-[45%] bg-blue-500/5 rounded-full blur-[140px]"></div>
        <div className="absolute top-[30%] right-[20%] w-80 h-80 bg-[#FF6B2C]/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-10">
        {/* --- HERO SECTION --- */}
        <div className="relative rounded-[40px] bg-white/5 backdrop-blur-xl border border-white/10 p-10 md:p-14 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-[#FF6B2C]/10 to-transparent blur-3xl"></div>
          <div className="relative z-10 space-y-4">
            <span className="inline-flex items-center gap-2 text-[#FF6B2C] bg-[#FF6B2C]/10 text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-[#FF6B2C]/20">
              Overview
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
              Company <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B2C] to-[#FF8533]">Dashboard</span>
            </h1>
            <p className="text-gray-400 max-w-xl font-medium leading-relaxed">
              Welcome back, <span className="text-white font-bold">{user?.name || user?.email}</span>. 
              Manage your company's projects and team members from here.
            </p>
            <div className="pt-4">
              <Link to="/company-dashboard/projects" className="inline-flex items-center bg-gradient-to-r from-[#FF6B2C] to-[#FF8533] text-white font-bold px-8 py-3.5 rounded-xl hover:shadow-lg hover:shadow-[#FF6B2C]/25 transition-all active:scale-95 text-sm uppercase tracking-widest">
                Manage Projects →
              </Link>
            </div>
          </div>
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Total Projects" value={loading ? "—" : stats.total} color="border-[#FF6B2C]/30" />
          <StatCard label="Active Delivery" value={loading ? "—" : stats.active} color="border-blue-500/30" />
          <StatCard label="Completed" value={loading ? "—" : stats.completed} color="border-emerald-500/30" />
          <StatCard label="Assigned Managers" value={loading ? "—" : stats.managers} color="border-[#FF6B2C]/30" />
        </div>

        {/* --- MAIN CONTENT GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recent Projects */}
          <div className="lg:col-span-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold tracking-tight">Recent Projects</h2>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Live Status</span>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 w-full bg-white/5 rounded-2xl animate-pulse"></div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl text-gray-500 font-bold uppercase tracking-widest">
                No active projects found
              </div>
            ) : (
              <div className="space-y-4">
                {projects.slice(0, 5).map((project, idx) => (
                  <div key={project.id} className="group flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-[#FF6B2C]/30 hover:bg-white/10 transition-all cursor-pointer">
                    <div className="flex items-center gap-5">
                      <span className="text-xs font-bold text-gray-600">0{idx + 1}</span>
                      <div>
                        <h3 className="font-bold text-sm tracking-tight group-hover:text-[#FF6B2C] transition-colors">{project.name}</h3>
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-0.5">{project.location} • {project.project_manager_name || "Unassigned"}</p>
                      </div>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions & Legend */}
          <div className="lg:col-span-4 space-y-8">
             <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-xl">
               <h2 className="text-xl font-bold tracking-tight mb-6">Quick Links</h2>
               <div className="space-y-3">
                 <QuickLink to="/company-dashboard/projects" label="Projects" />
                 <QuickLink to="/company-dashboard/team" label="Team" />
               </div>
               
               <hr className="my-8 border-white/5" />
               
               <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-6">Status Meanings</h3>
               <div className="space-y-4">
                 {[
                   ["PLANNING", "Planning Phase"],
                   ["IN_PROGRESS", "Active Work"],
                   ["ON_HOLD", "Paused"],
                   ["COMPLETED", "Finished"],
                 ].map(([s, desc]) => (
                   <div key={s} className="flex items-center gap-3">
                     <StatusBadge status={s} />
                     <span className="text-xs font-medium text-gray-400">{desc}</span>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className={`bg-white/5 backdrop-blur-xl border ${color} rounded-[32px] p-8 shadow-xl hover:scale-[1.02] transition-transform duration-300`}>
    <div className="flex items-center justify-between mb-4">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
    </div>
    <div className="text-4xl font-bold tracking-tighter">{value}</div>
  </div>
);

const QuickLink = ({ to, label }) => (
  <Link to={to} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-[#FF6B2C]/40 hover:bg-[#FF6B2C]/5 transition-all group">
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold text-gray-300 group-hover:text-white">{label}</span>
    </div>
    <span className="text-gray-600 group-hover:text-[#FF6B2C] group-hover:translate-x-1 transition-all">→</span>
  </Link>
);

const StatusBadge = ({ status }) => {
  const styles = {
    PLANNING: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    IN_PROGRESS: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    ON_HOLD: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${styles[status] || "bg-white/5 text-white/40 border-white/10"}`}>
      {status?.replace("_", " ")}
    </span>
  );
};


export default CompanyDashboard;