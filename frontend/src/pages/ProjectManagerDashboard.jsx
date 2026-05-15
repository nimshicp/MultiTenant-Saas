import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchMyProjects } from "../api/projects";

const ProjectManagerDashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await fetchMyProjects();
        setProjects(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load my projects:", error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  const activeProjects = projects.filter((project) =>
    ["PLANNING", "IN_PROGRESS"].includes(project.status)
  ).length;

  const criticalProjects = projects.filter(
    (project) => project.priority === "CRITICAL"
  ).length;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-12 font-sans relative overflow-hidden">
      {/* Background glow effects matching landing page */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#FF6B2C]/5 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-15%] right-[-5%] w-[45%] h-[45%] bg-blue-500/5 rounded-full blur-[140px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-10">
        {/* --- HERO SECTION --- */}
        <div className="relative rounded-[40px] bg-white/5 backdrop-blur-xl border border-white/10 p-10 md:p-14 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-[#FF6B2C]/10 to-transparent blur-3xl"></div>
          <div className="relative z-10 space-y-4">
            <span className="inline-flex items-center gap-2 text-[#FF6B2C] bg-[#FF6B2C]/10 text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-[#FF6B2C]/20">
              Dashboard
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter italic">
              Project <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B2C] to-[#FF8533]">Management</span>
            </h1>
            <p className="text-gray-400 max-w-xl font-medium leading-relaxed">
              Assigned to: <span className="text-white font-bold">{user?.name || user?.email}</span>. 
              Manage your assigned projects and monitor overall progress.
            </p>
          </div>
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard label="Total Projects" value={loading ? "—" : projects.length} />
          <MetricCard label="In Progress" value={loading ? "—" : activeProjects} accent="text-blue-500" />
          <MetricCard label="Urgent Tasks" value={loading ? "—" : criticalProjects} accent="text-red-500" />
        </div>

        {/* --- PROJECTS PANEL --- */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 md:p-12 shadow-xl">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-bold tracking-tight">Current Projects</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 font-mono">Overview</span>
          </div>
          
          {loading ? (
            <div className="py-20 text-center text-[#FF6B2C] font-bold tracking-widest animate-pulse">
              LOADING PROJECTS...
            </div>
          ) : projects.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[32px] text-gray-600 font-bold uppercase tracking-widest backdrop-blur-xl">
              No assigned projects found
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {projects.map((project) => (
                <div key={project.id} className="group relative bg-white/5 border border-white/5 rounded-[32px] p-8 transition-all duration-500 hover:border-[#FF6B2C]/30 hover:bg-white/10">
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Link to={`/company-dashboard/projects/${project.id}`} className="text-2xl font-bold tracking-tight hover:text-[#FF6B2C] transition-colors">
                          {project.name}
                        </Link>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${getPriorityStyles(project.priority)}`}>
                          {project.priority_display}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-2xl">
                        {project.description || "No description provided."}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 pt-2">
                        <DataBadge label="Stack" value={project.tech_stack || "Not specified"} />
                        <DataBadge label="Team" value={`${project.team_members_detail?.length || 0} Members`} />
                        <DataBadge label="Deadline" value={project.deadline || "TBD"} />
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 self-start">
                      <StatusBadge status={project.status} />
                      <p className="text-[10px] text-gray-700 font-mono font-bold uppercase tracking-widest">#{project.id.slice(0, 8)}</p>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Project Progress</span>
                      <span className="text-xs font-bold text-[#FF6B2C]">{project.progress_percentage}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#FF6B2C] to-[#FF8533] transition-all duration-700" style={{ width: `${project.progress_percentage}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, accent = "text-white" }) => (
  <div className="rounded-[40px] bg-white/5 border border-white/10 p-10 backdrop-blur-xl shadow-xl transition-all duration-500 hover:scale-[1.03] hover:border-[#FF6B2C]/20">
    <div className="flex items-center justify-between mb-4">
       <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</p>
    </div>
    <p className={`text-5xl font-bold tracking-tighter ${accent}`}>{value}</p>
  </div>
);

const DataBadge = ({ label, value }) => (
  <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mr-2">{label}:</span>
    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tight">{value}</span>
  </div>
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
    <span className={`text-[9px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border ${styles[status] || "bg-white/5 text-white/40 border-white/10"}`}>
      {status?.replace("_", " ")}
    </span>
  );
};


const getPriorityStyles = (priority) => {
  switch (priority) {
    case "CRITICAL": return "bg-red-500 text-white shadow-lg shadow-red-500/20";
    case "HIGH": return "bg-[#FF6B2C] text-white shadow-lg shadow-[#FF6B2C]/20";
    case "MEDIUM": return "bg-blue-600 text-white shadow-lg shadow-blue-500/20";
    default: return "bg-white/10 text-gray-400";
  }
};

export default ProjectManagerDashboard;
