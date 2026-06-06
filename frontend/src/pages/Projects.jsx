import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FolderKanban, 
  Layers, 
  AlertTriangle, 
  Briefcase, 
  Code, 
  DollarSign, 
  User, 
  Calendar, 
  Users, 
  Trash2, 
  Edit3, 
  X 
} from "lucide-react";
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

  // Motion Configuration Staggers
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  if (loading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-[#0b0b0d] flex items-center justify-center font-sans select-none">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#e1571d]/20 border-t-[#e1571d] rounded-full animate-spin" />
          <div className="text-[#e1571d] text-xs font-semibold uppercase tracking-[0.4em] animate-pulse">
            INITIATING PROJECT MATRIX...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white p-4 md:p-10 lg:p-12 font-sans selection:bg-[#e1571d] selection:text-white relative overflow-hidden select-none">
      
      {/* ─── COSMIC BACKGROUND NEBULA LAYER ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div 
          animate={{ scale: [1, 1.03, 1], opacity: [0.35, 0.42, 0.35] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-25%] left-[-10%] w-[70vw] h-[70vw] max-w-[900px] rounded-full bg-gradient-to-br from-[#e1571d]/15 via-[#ca4a15]/5 to-transparent blur-[140px] mix-blend-screen" 
        />
        <div className="absolute bottom-[-10%] right-[-10%] w-[55vw] h-[55vw] max-w-[700px] rounded-full bg-gradient-to-tl from-[#1d4ed8]/8 via-[#1e1b4b]/10 to-transparent blur-[130px]" />
        <div className="absolute inset-0 opacity-[0.25] mix-blend-screen bg-repeat bg-center" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Ccircle cx='20' cy='30' r='1' fill='%23ffffff' opacity='0.4'/%3E%3Ccircle cx='75' cy='15' r='1.2' fill='%23ffffff' opacity='0.6'/%3E%3Ccircle cx='110' cy='70' r='0.8' fill='%2393c5fd' opacity='0.5'/%3E%3Ccircle cx='45' cy='95' r='1' fill='%23ffffff' opacity='0.5'/%3E%3C/svg%3E")` }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        
        {/* ─── HERO SECTION BANNER ─── */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 85, damping: 18 }}
          className="relative rounded-[32px] bg-[#141416]/40 backdrop-blur-[30px] border border-white/[0.06] p-8 md:p-12 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        >
          <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-[#e1571d]/8 to-transparent blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <span className="inline-flex items-center gap-1.5 text-[#e1571d] bg-[#e1571d]/8 text-[11px] font-semibold uppercase tracking-[0.25em] px-3.5 py-1.5 rounded-full border border-[#e1571d]/15">
              <FolderKanban size={12} className="mt-[-1px]" /> Ecosystem Control
            </span>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-white">
              Software <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e1571d] to-[#eb6932]">Projects</span>
            </h1>
            <p className="text-[#86868d] text-[14px] max-w-xl font-normal leading-relaxed">
              Centralized management of project lifecycles, resource allocation, and technical debt monitoring.
            </p>
          </div>
        </motion.div>

        {/* ─── METRIC STATS GRID ─── */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5"
        >
          <MetricCard label="Total Deployments" value={summary.total} icon={<Briefcase size={15} className="text-gray-400" />} borderColor="border-white/[0.06]" />
          <MetricCard label="Active Sprints" value={summary.active} icon={<Layers size={15} className="text-blue-400" />} accent="text-blue-400" borderColor="border-blue-500/10" />
          <MetricCard label="Critical Risks" value={summary.critical} icon={<AlertTriangle size={15} className="text-red-400" />} accent="text-red-400" borderColor="border-red-500/15" />
        </motion.div>

        {/* ─── TWO-COLUMN OPERATION PANELS ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
          
          {/* Form Panel Column */}
          {(user?.role === "ADMIN" || user?.role === "SUPERADMIN") && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 90, damping: 16, delay: 0.1 }}
              className="lg:col-span-5"
            >
              <div className={`rounded-[28px] border backdrop-blur-[30px] p-6 md:p-8 transition-all duration-500 shadow-xl ${isEditMode ? 'border-[#e1571d]/40 bg-[#e1571d]/[0.03]' : 'border-white/[0.06] bg-[#141416]/40'}`}>
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/[0.04]">
                  <h2 className="text-lg font-medium tracking-tight text-gray-100">
                    {isEditMode ? "Update Project" : "New Project"}
                  </h2>
                  {isEditMode && (
                    <button 
                      onClick={cancelEdit} 
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-red-400 uppercase tracking-widest bg-white/[0.03] hover:bg-white/[0.06] px-2.5 py-1 rounded-md border border-white/[0.05] transition-colors"
                    >
                      <X size={10} /> Cancel
                    </button>
                  )}
                </div>

                {/* Notifications and Feedback Alerts */}
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-5 rounded-xl bg-red-500/10 p-3.5 text-[11px] font-medium text-red-400 border border-red-500/15">
                      {error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-5 rounded-xl bg-emerald-500/10 p-3.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/15">
                      {success}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form Elements */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#86868d] ml-0.5">Project Title</label>
                    <input name="name" value={formData.name} onChange={handleChange} required className="w-full bg-[#1c1c1f]/40 focus:bg-[#1c1c1f]/80 border border-white/[0.06] focus:border-[#e1571d]/40 rounded-xl px-4 py-3 text-sm font-medium text-white outline-none transition-all" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#86868d] ml-0.5">Category</label>
                      <select name="project_type" value={formData.project_type} onChange={handleChange} className="w-full bg-[#1c1c1f]/40 border border-white/[0.06] rounded-xl p-3 text-sm font-medium text-gray-300 outline-none cursor-pointer focus:border-[#e1571d]/40 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2386868d%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px] bg-[right_12px_center] bg-no-repeat">
                        <option value="WEB_APP">Web Application</option>
                        <option value="MOBILE_APP">Mobile App</option>
                        <option value="API_BACKEND">API / Backend</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#86868d] ml-0.5">Priority</label>
                      <select name="priority" value={formData.priority} onChange={handleChange} className="w-full bg-[#1c1c1f]/40 border border-white/[0.06] rounded-xl p-3 text-sm font-medium text-gray-300 outline-none cursor-pointer focus:border-[#e1571d]/40 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2386868d%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px] bg-[right_12px_center] bg-no-repeat">
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#86868d] ml-0.5">Tech Stack</label>
                    <input name="tech_stack" placeholder="React, Python, etc." value={formData.tech_stack} onChange={handleChange} className="w-full bg-[#1c1c1f]/40 focus:bg-[#1c1c1f]/80 border border-white/[0.06] focus:border-[#e1571d]/40 rounded-xl px-4 py-3 text-sm font-medium text-white outline-none transition-all placeholder:text-gray-600" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#86868d] ml-0.5">Budget ($)</label>
                      <input name="budget" type="number" value={formData.budget} onChange={handleChange} className="w-full bg-[#1c1c1f]/40 focus:bg-[#1c1c1f]/80 border border-white/[0.06] focus:border-[#e1571d]/40 rounded-xl px-4 py-3 text-sm font-medium text-white outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#86868d] ml-0.5">Lead Manager</label>
                      <select name="project_manager" value={formData.project_manager} onChange={handleChange} className="w-full bg-[#1c1c1f]/40 border border-white/[0.06] rounded-xl p-3 text-sm font-medium text-gray-300 outline-none cursor-pointer focus:border-[#e1571d]/40 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2386868d%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px] bg-[right_12px_center] bg-no-repeat">
                         <option value="">None</option>
                         {managers.map(m => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#86868d] ml-0.5">Start Date</label>
                      <input name="start_date" type="date" value={formData.start_date} onChange={handleChange} className="w-full bg-[#1c1c1f]/40 border border-white/[0.06] focus:border-[#e1571d]/40 rounded-xl p-3 text-sm font-medium text-gray-300 outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#86868d] ml-0.5">Deadline</label>
                      <input name="deadline" type="date" value={formData.deadline} onChange={handleChange} className="w-full bg-[#1c1c1f]/40 border border-white/[0.06] focus:border-[#e1571d]/40 rounded-xl p-3 text-sm font-medium text-gray-300 outline-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#86868d] ml-0.5">Assigned Team</label>
                    <div className="w-full h-44 bg-[#141416]/50 border border-white/[0.06] rounded-xl p-2 overflow-y-auto space-y-1 custom-scrollbar">
                      {employees.map(e => (
                        <label key={e.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] cursor-pointer transition-colors group">
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
                            className="h-4 w-4 rounded border-white/[0.15] bg-[#141416] text-[#e1571d] focus:ring-[#e1571d] focus:ring-offset-0"
                          />
                          <span className={`text-xs font-medium transition-colors ${formData.team_members.includes(e.id) ? 'text-[#e1571d]' : 'text-gray-400 group-hover:text-gray-200'}`}>
                            {e.name || e.email}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button type="submit" disabled={saving} className="w-full py-4 mt-2 bg-gradient-to-r from-[#e1571d] to-[#eb6932] text-white rounded-xl font-medium uppercase tracking-widest text-xs shadow-[0_4px_20px_rgba(225,87,29,0.25)] hover:shadow-[0_4px_25px_rgba(225,87,29,0.35)] transition-all active:scale-[0.98]">
                    {saving ? "Processing..." : isEditMode ? "Update Project" : "Create Project"}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* Ecosystem List Panel Column */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 90, damping: 16, delay: 0.15 }}
            className={(user?.role === "ADMIN" || user?.role === "SUPERADMIN") ? "lg:col-span-7" : "lg:col-span-12"}
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between mb-2 ml-1">
                <h2 className="text-lg font-medium tracking-tight text-gray-100">Live Ecosystem</h2>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#86868d] bg-white/[0.03] px-2.5 py-1 rounded-md border border-white/[0.02]">Stream Active</span>
              </div>
              
              <AnimatePresence mode="wait">
                {projects.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="rounded-[28px] border-2 border-dashed border-white/[0.05] bg-[#141416]/20 py-24 text-center text-gray-500 text-xs font-medium uppercase tracking-widest"
                  >
                    System Offline
                  </motion.div>
                ) : (
                  <motion.div 
                    variants={containerVariants} 
                    initial="hidden" 
                    animate="show" 
                    className="space-y-4"
                  >
                    {projects.map((project) => (
                      <motion.div 
                        variants={itemVariants}
                        key={project.id} 
                        className="group relative rounded-[28px] bg-[#141416]/40 border border-white/[0.06] p-6 md:p-8 backdrop-blur-[30px] shadow-xl transition-all duration-300 hover:border-[#e1571d]/30 hover:bg-[#141416]/60"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-3 min-w-0">
                            <div className="flex items-center gap-3">
                              <StatusIndicator status={project.status} />
                              <Link to={`/company-dashboard/projects/${project.id}`} className="text-xl font-medium tracking-tight hover:text-[#e1571d] transition-colors truncate block">
                                {project.name}
                              </Link>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-white/[0.03] px-2.5 py-1 rounded-md border border-white/[0.04]">
                                {project.project_type?.replace("_", " ")}
                              </span>
                              {project.budget && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#e1571d] bg-[#e1571d]/8 px-2.5 py-1 rounded-md border border-[#e1571d]/15">
                                  ${project.budget} Budget
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Items Panel */}
                          <div className="flex items-center sm:justify-end gap-3 self-end sm:self-start">
                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-semibold uppercase tracking-wider border ${getPriorityStyles(project.priority)}`}>
                              {project.priority}
                            </span>
                            {(user?.role === "ADMIN" || user?.role === "SUPERADMIN") && (
                              <div className="flex items-center gap-1.5 bg-white/[0.02] border border-white/[0.05] p-1 rounded-lg">
                                <button onClick={() => handleEditClick(project)} className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/[0.04] transition-all" title="Edit Matrix">
                                  <Edit3 size={13} />
                                </button>
                                <button onClick={() => handleDeleteClick(project.id)} className="p-2 rounded-md text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Purge Record">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Extended Project Metadata Sub-grid */}
                        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-white/[0.04] pt-5">
                          <DataPoint label="Tech Stack" value={project.tech_stack} icon={<Code size={11} />} />
                          <DataPoint label="Manager" value={project.project_manager_detail?.full_name} icon={<User size={11} />} />
                          <DataPoint label="Force" value={`${project.team_members_detail?.length || 0} Members`} icon={<Users size={11} />} />
                          <DataPoint label="Deadline" value={project.deadline} icon={<Calendar size={11} />} />
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

/* ─── REUSABLE CORE COMPONENT NODES ─── */

const MetricCard = ({ label, value, icon, accent = "text-white", borderColor, variants }) => (
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
    <div className={`text-3xl font-semibold tracking-tight ${accent}`}>{value}</div>
  </motion.div>
);

const DataPoint = ({ label, value, icon }) => (
  <div className="min-w-0">
    <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#86868d] mb-1">
      {icon} <span>{label}</span>
    </p>
    <p className="font-medium text-[13px] text-gray-300 tracking-tight truncate">{value || "UNSET"}</p>
  </div>
);

const StatusIndicator = ({ status }) => {
  const colors = {
    PLANNING: "bg-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.4)]",
    IN_PROGRESS: "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.4)]",
    ON_HOLD: "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.4)]",
    COMPLETED: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]"
  };
  return <div className={`h-2 w-2 rounded-full flex-shrink-0 ${colors[status] || "bg-gray-400"}`}></div>;
};

const getPriorityStyles = (priority) => {
  switch (priority) {
    case "CRITICAL": return "bg-red-500/10 text-red-400 border-red-500/20";
    case "HIGH": return "bg-[#e1571d]/10 text-[#eb6932] border-[#e1571d]/20";
    case "MEDIUM": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    default: return "bg-white/5 text-gray-400 border-white/10";
  }
};

export default Projects;