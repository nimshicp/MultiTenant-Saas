import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchProjects } from "../api/projects";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, ArrowRight, FolderKanban, Users, Compass } from "lucide-react";

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

  // Container configuration variants for itemized stagger effects
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const fadeInUpItem = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white p-4 md:p-10 lg:p-12 font-sans selection:bg-[#e1571d] selection:text-white relative overflow-hidden select-none">
      
      {/* ─── COSMIC BACKGROUND NEBULA LAYER (Matching Login & Signup UI) ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div 
          animate={{
            scale: [1, 1.04, 1],
            opacity: [0.3, 0.38, 0.3],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] left-[-15%] w-[75vw] h-[75vw] max-w-[900px] rounded-full bg-gradient-to-br from-[#ff7a38]/20 via-[#ca4a15]/5 to-transparent blur-[140px] mix-blend-screen opacity-40" 
        />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] max-w-[700px] rounded-full bg-gradient-to-tl from-[#1d4ed8]/8 via-[#1e1b4b]/12 to-transparent blur-[130px]" />
        <div className="absolute top-[35%] right-[15%] w-80 h-80 bg-[#e1571d]/5 rounded-full blur-[110px]" />
        <div className="absolute inset-0 opacity-[0.25] mix-blend-screen bg-repeat bg-center" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Ccircle cx='15' cy='25' r='1' fill='%23ffffff' opacity='0.5'/%3E%3Ccircle cx='80' cy='20' r='1.2' fill='%23ffffff' opacity='0.7'/%3E%3Ccircle cx='115' cy='65' r='0.8' fill='%2393c5fd' opacity='0.4'/%3E%3Ccircle cx='40' cy='90' r='1' fill='%23ffffff' opacity='0.6'/%3E%3Ccircle cx='95' cy='110' r='1.5' fill='%23ffffff' opacity='0.8'/%3E%3C/svg%3E")` }} />
        <motion.div animate={{ opacity: [0.2, 0.7, 0.2] }} transition={{ duration: 7, repeat: Infinity }} className="absolute bottom-[40%] left-[8%] w-1 h-1 bg-white rounded-full shadow-[0_0_6px_#fff]" />
        <motion.div animate={{ opacity: [0.3, 0.9, 0.3] }} transition={{ duration: 5, repeat: Infinity, delay: 2 }} className="absolute top-[20%] right-[30%] w-1.5 h-1.5 bg-blue-300 rounded-full shadow-[0_0_8px_#93c5fd]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        
        {/* ─── HERO SECTION BANNER ─── */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 85, damping: 18 }}
          className="relative rounded-[32px] bg-[#141416]/40 backdrop-blur-[30px] border border-white/[0.06] p-8 md:p-12 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        >
          <div className="absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-[#e1571d]/8 to-transparent blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <span className="inline-flex items-center gap-1.5 text-[#e1571d] bg-[#e1571d]/8 text-[11px] font-semibold uppercase tracking-[0.25em] px-3.5 py-1.5 rounded-full border border-[#e1571d]/15">
              <LayoutDashboard size={12} className="mt-[-1px]" /> Overview
            </span>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-white">
              Company <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e1571d] to-[#eb6932]">Dashboard</span>
            </h1>
            <p className="text-[#86868d] text-[14px] max-w-xl font-normal leading-relaxed">
              Welcome back, <span className="text-gray-200 font-semibold">{user?.name || user?.email}</span>. 
              Manage your company's projects and team members from here.
            </p>
            <div className="pt-2">
              <Link to="/company-dashboard/projects" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#e1571d] to-[#eb6932] text-white font-medium px-6 py-3 rounded-xl shadow-[0_4px_20px_rgba(225,87,29,0.2)] hover:shadow-[0_4px_25px_rgba(225,87,29,0.35)] transition-all active:scale-[0.98] text-xs uppercase tracking-widest group">
                Manage Projects <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ─── ANALYTICAL STATS GRID ─── */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
        >
          <StatCard variants={fadeInUpItem} label="Total Projects" value={loading ? "—" : stats.total} borderColor="border-[#e1571d]/20" icon={<FolderKanban size={14} className="text-[#e1571d]" />} />
          <StatCard variants={fadeInUpItem} label="Active Delivery" value={loading ? "—" : stats.active} borderColor="border-blue-500/20" icon={<Compass size={14} className="text-blue-400" />} />
          <StatCard variants={fadeInUpItem} label="Completed" value={loading ? "—" : stats.completed} borderColor="border-emerald-500/20" icon={<div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />} />
          <StatCard variants={fadeInUpItem} label="Assigned Managers" value={loading ? "—" : stats.managers} borderColor="border-[#eb6932]/20" icon={<Users size={14} className="text-[#eb6932]" />} />
        </motion.div>

        {/* ─── DUAL COLUMN CONTENT PANEL GRID ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          
          {/* Column A: Recent Live Projects Stream */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 90, damping: 16, delay: 0.15 }}
            className="lg:col-span-8 bg-[#141416]/40 backdrop-blur-[30px] border border-white/[0.06] rounded-[24px] p-6 md:p-8 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6 border-b border-white/[0.04] pb-4">
              <h2 className="text-lg font-medium tracking-tight text-gray-100">Recent Projects</h2>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#86868d] bg-white/[0.03] px-2.5 py-1 rounded-md border border-white/[0.02]">Live Status</span>
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <div key="skeleton-loader" className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-[68px] w-full bg-white/[0.02] border border-white/[0.02] rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : projects.length === 0 ? (
                <motion.div 
                  key="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-16 text-center border border-dashed border-white/[0.05] rounded-xl text-gray-500 text-xs font-medium uppercase tracking-widest"
                >
                  No active projects found
                </motion.div>
              ) : (
                <motion.div 
                  key="project-list"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  className="space-y-3"
                >
                  {projects.slice(0, 5).map((project, idx) => (
                    <motion.div 
                      variants={fadeInUpItem}
                      key={project.id} 
                      className="group flex items-center justify-between p-4 bg-[#1d1d20]/25 border border-white/[0.03] rounded-xl hover:border-[#e1571d]/30 hover:bg-[#1d1d20]/50 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-xs font-mono font-bold text-gray-600 group-hover:text-[#e1571d]/60 transition-colors">0{idx + 1}</span>
                        <div className="min-w-0">
                          <h3 className="font-medium text-[14px] text-gray-200 tracking-tight group-hover:text-white transition-colors truncate">{project.name}</h3>
                          <p className="text-[11px] text-[#86868d] font-normal tracking-wide mt-0.5 truncate">
                            {project.location} <span className="text-white/[0.08] mx-1.5">•</span> {project.project_manager_name || "Unassigned"}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-3">
                        <StatusBadge status={project.status} />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Column B: Internal System Directories & Reference Metrics */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 90, damping: 16, delay: 0.2 }}
            className="lg:col-span-4 space-y-6"
          >
            <div className="bg-[#141416]/40 backdrop-blur-[30px] border border-white/[0.06] rounded-[24px] p-6 md:p-8 shadow-xl">
              <h2 className="text-[15px] font-medium tracking-tight text-gray-100 mb-4">Quick Links</h2>
              <div className="space-y-2.5">
                <QuickLink to="/company-dashboard/projects" label="Projects Portal" />
                <QuickLink to="/company-dashboard/team" label="Team Directory" />
              </div>
              
              <div className="my-6 border-b border-white/[0.04]" />
              
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#86868d] mb-4">Status Map Indices</h3>
              <div className="space-y-3">
                {[
                  ["PLANNING", "Planning Phase"],
                  ["IN_PROGRESS", "Active Work"],
                  ["ON_HOLD", "Paused / On Hold"],
                  ["COMPLETED", "Finished Lifecycle"],
                ].map(([s, desc]) => (
                  <div key={s} className="flex items-center gap-3 bg-white/[0.01] p-2 rounded-lg border border-white/[0.02]">
                    <StatusBadge status={s} />
                    <span className="text-[12px] font-normal text-[#86868d]">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

/* ─── REUSABLE CORE INTERFACE ELEMENTS ─── */

const StatCard = ({ label, value, borderColor, icon, variants }) => (
  <motion.div 
    variants={variants}
    whileHover={{ y: -3, scale: 1.01 }}
    transition={{ type: "spring", stiffness: 200, damping: 15 }}
    className={`bg-[#141416]/40 backdrop-blur-[30px] border ${borderColor} rounded-[24px] p-5 md:p-6 shadow-md flex flex-col justify-between`}
  >
    <div className="flex items-center justify-between mb-3">
      <span className="text-[11px] font-medium uppercase tracking-wider text-[#86868d]">{label}</span>
      <div className="w-6 h-6 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-center">
        {icon}
      </div>
    </div>
    <div className="text-3xl font-semibold tracking-tight text-white">{value}</div>
  </motion.div>
);

const QuickLink = ({ to, label }) => (
  <Link to={to} className="flex items-center justify-between p-3.5 bg-[#1d1d20]/25 border border-white/[0.03] rounded-xl hover:border-[#e1571d]/40 hover:bg-[#e1571d]/5 transition-all duration-300 group">
    <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{label}</span>
    <ArrowRight size={14} className="text-gray-600 group-hover:text-[#e1571d] group-hover:translate-x-0.5 transition-all duration-300" />
  </Link>
);

const StatusBadge = ({ status }) => {
  const styles = {
    PLANNING: "bg-gray-500/10 text-gray-400 border-gray-500/15",
    IN_PROGRESS: "bg-blue-500/10 text-blue-400 border-blue-500/15",
    ON_HOLD: "bg-orange-500/10 text-orange-400 border-orange-500/15",
    COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/15",
    CANCELLED: "bg-red-500/10 text-red-400 border-red-500/15",
  };
  return (
    <span className={`text-[9px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-md border ${styles[status] || "bg-white/5 text-white/40 border-white/10"}`}>
      {status?.replace("_", " ")}
    </span>
  );
};

export default CompanyDashboard;