import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  createProject,
  updateProject,
  deleteProject,
  fetchProjectManagers,
  fetchEmployees,
  fetchProjects,
} from "../api/projects";

const initialForm = {
  name: "",
  description: "",
  project_type: "WEB_APP",
  priority: "MEDIUM",
  status: "IN_PROGRESS",
  tech_stack: "",
  repository_url: "",
  budget: "",
  start_date: "",
  deadline: "",
  project_manager: "",
  team_members: [],
};

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [managers, setManagers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [projectList, managerList, employeeList] = await Promise.all([
        fetchProjects(),
        fetchProjectManagers(),
        fetchEmployees(),
      ]);
      setProjects(Array.isArray(projectList) ? projectList : []);
      setManagers(managerList);
      setEmployees(employeeList);
    } catch (err) {
      setError(err?.message || "Could not load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-dismiss alerts after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const summary = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === "IN_PROGRESS").length;
    const critical = projects.filter((p) => p.priority === "CRITICAL").length;
    return { total, active, critical };
  }, [projects]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTeamChange = (e) => {
    const selectedIds = Array.from(e.target.selectedOptions, (opt) => opt.value);
    setFormData((prev) => ({ ...prev, team_members: selectedIds }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...formData,
        budget: formData.budget || null,
        project_manager: formData.project_manager || null,
        start_date: formData.start_date || null,
        deadline: formData.deadline || null,
      };

      if (isEditMode) {
        await updateProject(selectedProjectId, payload);
        setSuccess("Project updated successfully!");
      } else {
        await createProject(payload);
        setSuccess("Project created successfully!");
      }
      
      setFormData(initialForm);
      setIsEditMode(false);
      setSelectedProjectId(null);
      await loadData();
    } catch (err) {
      setError(err?.message || "Operation failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (project) => {
    setSelectedProjectId(project.id);
    setIsEditMode(true);
    setFormData({
      name: project.name,
      description: project.description || "",
      project_type: project.project_type,
      priority: project.priority,
      status: project.status,
      tech_stack: project.tech_stack || "",
      repository_url: project.repository_url || "",
      budget: project.budget || "",
      start_date: project.start_date || "",
      deadline: project.deadline || "",
      project_manager: project.project_manager || "",
      team_members: project.team_members || [],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) {
      return;
    }
    try {
      await deleteProject(projectId);
      setSuccess("Project deleted successfully.");
      await loadData();
    } catch (err) {
      setError(err?.message || "Failed to delete project.");
    }
  };

  const cancelEdit = () => {
    setIsEditMode(false);
    setSelectedProjectId(null);
    setFormData(initialForm);
    setError("");
    setSuccess("");
  };

  if (loading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-[#FF6B2C] font-black tracking-[0.5em] animate-pulse">INITIATING PROJECT MATRIX...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-12 font-sans relative overflow-hidden">
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
              Ecosystem Control
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
              Software <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B2C] to-[#FF8533]">Projects</span>
            </h1>
            <p className="text-gray-400 max-w-xl font-medium leading-relaxed">
              Centralized management of project lifecycles, resource allocation, and technical debt monitoring.
            </p>
          </div>
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard label="Total Deployments" value={summary.total}  />
          <MetricCard label="Active Sprints" value={summary.active}  accent="text-blue-500" />
          <MetricCard label="Critical Risks" value={summary.critical}  accent="text-red-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Form Side */}
          {(user?.role === "ADMIN" || user?.role === "SUPERADMIN") && (
            <div className="lg:col-span-5">
              <div className={`rounded-[40px] border-2 p-8 md:p-10 transition-all duration-500 backdrop-blur-xl ${isEditMode ? 'border-[#FF6B2C]/40 bg-[#FF6B2C]/5 shadow-2xl shadow-[#FF6B2C]/10' : 'border-white/10 bg-white/5 shadow-xl'}`}>
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-2xl font-bold tracking-tight">{isEditMode ? "Update Project" : "New Project"}</h2>
                  {isEditMode && (
                    <button onClick={cancelEdit} className="text-[10px] font-bold text-gray-500 hover:text-red-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">Cancel</button>
                  )}
                </div>

                {error && <div className="mb-6 rounded-2xl bg-red-500/10 p-4 text-[10px] font-bold text-red-400 border border-red-500/20">{error}</div>}
                {success && <div className="mb-6 rounded-2xl bg-emerald-500/10 p-4 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Project Title</label>
                    <input name="name" value={formData.name} onChange={handleChange} required className="w-full bg-[#0A0A0F]/60 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-[#FF6B2C]/40 outline-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Category</label>
                      <select name="project_type" value={formData.project_type} onChange={handleChange} className="w-full bg-[#0A0A0F]/60 border border-white/10 rounded-2xl p-4 text-sm font-bold outline-none cursor-pointer">
                        <option value="WEB_APP">Web Application</option>
                        <option value="MOBILE_APP">Mobile App</option>
                        <option value="API_BACKEND">API / Backend</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Priority</label>
                      <select name="priority" value={formData.priority} onChange={handleChange} className="w-full bg-[#0A0A0F]/60 border border-white/10 rounded-2xl p-4 text-sm font-bold outline-none cursor-pointer">
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Tech Stack</label>
                    <input name="tech_stack" placeholder="React, Python, etc." value={formData.tech_stack} onChange={handleChange} className="w-full bg-[#0A0A0F]/60 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-[#FF6B2C]/40 outline-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Budget ($)</label>
                      <input name="budget" type="number" value={formData.budget} onChange={handleChange} className="w-full bg-[#0A0A0F]/60 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-[#FF6B2C]/40 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Lead Manager</label>
                      <select name="project_manager" value={formData.project_manager} onChange={handleChange} className="w-full bg-[#0A0A0F]/60 border border-white/10 rounded-2xl p-4 text-sm font-bold outline-none cursor-pointer">
                         <option value="">None</option>
                         {managers.map(m => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Start Date</label>
                      <input name="start_date" type="date" value={formData.start_date} onChange={handleChange} className="w-full bg-[#0A0A0F]/60 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-[#FF6B2C]/40 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Deadline</label>
                      <input name="deadline" type="date" value={formData.deadline} onChange={handleChange} className="w-full bg-[#0A0A0F]/60 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-[#FF6B2C]/40 outline-none" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Assigned Team</label>
                    <div className="w-full h-48 bg-[#0A0A0F]/60 border border-white/10 rounded-2xl p-4 overflow-y-auto space-y-2 scrollbar-hide">
                      {employees.map(e => (
                        <label key={e.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group">
                          <input 
                            type="checkbox" 
                            checked={formData.team_members.includes(e.id)}
                            onChange={(event) => {
                              const isChecked = event.target.checked;
                              setFormData(prev => {
                                const newTeam = isChecked 
                                  ? [...prev.team_members, e.id]
                                  : prev.team_members.filter(id => id !== e.id);
                                return { ...prev, team_members: newTeam };
                              });
                            }}
                            className="h-5 w-5 rounded border-white/10 bg-white/5 text-[#FF6B2C] focus:ring-[#FF6B2C] focus:ring-offset-0"
                          />
                          <span className={`text-xs font-medium transition-colors ${formData.team_members.includes(e.id) ? 'text-[#FF6B2C]' : 'text-gray-400 group-hover:text-white'}`}>
                            {e.name || e.email}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button type="submit" disabled={saving} className={`w-full py-5 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl ${isEditMode ? 'bg-[#FF6B2C] text-white hover:bg-[#FF8533]' : 'bg-[#FF6B2C] text-white hover:bg-[#FF8533]'}`}>
                    {saving ? "Processing..." : isEditMode ? "Update Project" : "Create Project"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* List Side */}
          <div className={(user?.role === "ADMIN" || user?.role === "SUPERADMIN") ? "lg:col-span-7" : "lg:col-span-12"}>
            <div className="space-y-6">
              <h2 className="text-2xl font-black tracking-tight ml-2">Live Ecosystem</h2>
              {projects.length === 0 ? (
                <div className="rounded-[40px] border-2 border-dashed border-white/5 bg-white/5 p-24 text-center text-gray-600 font-black uppercase tracking-widest">System Offline</div>
              ) : (
                projects.map((project) => (
                  <div key={project.id} className="group relative rounded-[40px] bg-white/5 border border-white/10 p-8 md:p-10 backdrop-blur-xl shadow-xl transition-all duration-500 hover:border-[#FF6B2C]/30 hover:bg-white/10">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                           <StatusIndicator status={project.status} />
                           <Link to={`/company-dashboard/projects/${project.id}`} className="text-2xl font-black tracking-tight hover:text-[#FF6B2C] transition-colors">{project.name}</Link>
                        </div>
                        <div className="flex flex-wrap gap-3">
                           <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white/5 px-3 py-1 rounded-full">{project.project_type?.replace("_", " ")}</span>
                           {project.budget && <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6B2C] bg-[#FF6B2C]/10 px-3 py-1 rounded-full border border-[#FF6B2C]/20">${project.budget} BUDGET</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getPriorityStyles(project.priority)}`}>
                          {project.priority}
                        </span>
                        {(user?.role === "ADMIN" || user?.role === "SUPERADMIN") && (
                          <div className="flex gap-2">
                            <button onClick={() => handleEditClick(project)} className="p-2.5 rounded-xl bg-white/5 text-gray-500 hover:text-white transition-all">EDIT</button>
                            <button onClick={() => handleDeleteClick(project.id)} className="p-2.5 rounded-xl bg-white/5 text-gray-500 hover:text-red-500 transition-all">DEL</button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/5 pt-8">
                       <DataPoint label="Tech Stack" value={project.tech_stack} />
                       <DataPoint label="Manager" value={project.project_manager_detail?.full_name} />
                       <DataPoint label="Force" value={`${project.team_members_detail?.length || 0} Members`} />
                       <DataPoint label="Deadline" value={project.deadline} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, icon, accent = "text-white" }) => (
  <div className="rounded-[40px] bg-white/5 border border-white/10 p-10 backdrop-blur-xl shadow-xl transition-all duration-500 hover:scale-[1.03] hover:border-[#FF6B2C]/20">
    <div className="flex items-center justify-between mb-4">
       <span className="text-3xl">{icon}</span>
       <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</p>
    </div>
    <p className={`text-5xl font-black tracking-tighter ${accent}`}>{value}</p>
  </div>
);

const DataPoint = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">{label}</p>
    <p className="font-bold text-sm text-gray-300 tracking-tight">{value || "UNSET"}</p>
  </div>
);

const StatusIndicator = ({ status }) => {
  const colors = {
    PLANNING: "bg-gray-500",
    IN_PROGRESS: "bg-blue-600",
    ON_HOLD: "bg-orange-500",
    COMPLETED: "bg-emerald-500"
  };
  return <div className={`h-3 w-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)] ${colors[status] || "bg-gray-500"}`}></div>;
};

const getPriorityStyles = (priority) => {
  switch (priority) {
    case "CRITICAL": return "bg-red-500 text-white shadow-lg shadow-red-500/20";
    case "HIGH": return "bg-[#FF6B2C] text-white shadow-lg shadow-[#FF6B2C]/20";
    case "MEDIUM": return "bg-blue-600 text-white shadow-lg shadow-blue-500/20";
    default: return "bg-white/10 text-gray-400";
  }
};

export default Projects;
