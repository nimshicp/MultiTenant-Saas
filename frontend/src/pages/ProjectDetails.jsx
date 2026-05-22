import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import {
  deleteTask,
  updateTask,
  updateProject,
  fetchTaskEvidences,
} from "../api/projects";

const ProjectDetails = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskEvidences, setTaskEvidences] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    task_type: "FEATURE",
    priority: "MEDIUM",
    due_date: "",
    assigned_to: ""
  });

  const fetchData = async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        api.get(`/api/projects/${projectId}/`),
        api.get(`/api/projects/${projectId}/tasks/`)
      ]);
      setProject(projRes.data);
      const nextTasks = Array.isArray(taskRes.data) ? taskRes.data : [];
      setTasks(nextTasks);
      setTaskEvidences({});
      await Promise.all(nextTasks.map((task) => loadTaskEvidences(task.id)));
    } catch (err) {
      console.error("Failed to fetch project details", err);
    } finally {
      setLoading(false);
    }
  };

  const loadTaskEvidences = async (taskId) => {
    try {
      const data = await fetchTaskEvidences(taskId);
      setTaskEvidences((prev) => ({
        ...prev,
        [taskId]: Array.isArray(data) ? data : [],
      }));
    } catch (err) {
      setTaskEvidences((prev) => ({
        ...prev,
        [taskId]: [],
      }));
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await updateProject(projectId, { status: newStatus });
      fetchData();
    } catch (err) {
      alert("Failed to update project status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleTaskProgressUpdate = async (taskId, newProgress) => {
    try {
      await updateTask(taskId, { progress_percentage: newProgress });
      fetchData();
    } catch (err) {
      alert("Failed to update task progress.");
    }
  };

  const handleViewEvidence = async (evidenceId) => {
    try {
      const response = await api.get(
        `/api/projects/tasks/evidence/${evidenceId}/view-url/`
      );

      if (response.data?.view_url) {
        window.open(response.data.view_url, "_blank", "noopener,noreferrer");
      } else {
        throw new Error("No view URL returned.");
      }
    } catch (err) {
      alert(err?.response?.data?.detail || err?.message || "Failed to open evidence.");
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setTaskForm({ title: "", description: "", task_type: "FEATURE", priority: "MEDIUM", due_date: "", assigned_to: "" });
    setIsTaskModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      task_type: task.task_type,
      priority: task.priority,
      due_date: task.due_date || "",
      assigned_to: task.assigned_to || ""
    });
    setIsTaskModalOpen(true);
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await updateTask(editingTask.id, taskForm);
      } else {
        await api.post(`/api/projects/${projectId}/tasks/create/`, taskForm);
      }
      setIsTaskModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || err.message || "Operation failed.");
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await deleteTask(taskId);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
      <div className="text-[#FF6B2C] font-black tracking-[0.5em] animate-pulse uppercase">ACCESSING VAULT...</div>
    </div>
  );
  
  if (!project) return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
      <div className="text-red-500 font-black uppercase">Project Not Found</div>
    </div>
  );

  const isManagerOrAdmin = 
    user?.role === "ADMIN" || 
    user?.role === "SUPERADMIN" || 
    user?.role === "PROJECT_MANAGER" ||
    project.project_manager === user?.id ||
    project.project_manager_detail?.email?.toLowerCase() === user?.user?.toLowerCase();

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
        <div className="relative rounded-[40px] bg-white/5 backdrop-blur-xl border border-white/10 p-10 md:p-14 overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="relative z-10 space-y-4">
             <Link to="/company-dashboard/projects" className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF6B2C] hover:text-white transition-colors">← Back to Ecosystem</Link>
             <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mt-2">{project.name}</h1>
             <p className="text-gray-400 max-w-2xl font-medium leading-relaxed">{project.description || "Project parameters synchronized and active."}</p>
          </div>
          {isManagerOrAdmin && (
            <button onClick={handleOpenCreateModal} className="relative z-10 bg-gradient-to-r from-[#FF6B2C] to-[#FF8533] text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-[#FF6B2C]/20 hover:shadow-[#FF6B2C]/40 transition-all active:scale-95 flex items-center gap-3 text-xs">
              + Initialize Task
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Intelligence Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-xl">
               <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-6 border-b border-white/5 pb-4">Core Info</h3>
               <div className="space-y-6">
                 <div className="flex flex-col gap-2">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Project Status</p>
                   {isManagerOrAdmin ? (
                     <select 
                       disabled={updatingStatus}
                       value={project.status}
                       onChange={(e) => handleStatusChange(e.target.value)}
                       className="bg-[#0A0A0F] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-[#FF6B2C] outline-none cursor-pointer"
                     >
                       <option value="PLANNING">Planning</option>
                       <option value="IN_PROGRESS">In Progress</option>
                       <option value="ON_HOLD">On Hold</option>
                       <option value="COMPLETED">Completed</option>
                       <option value="CANCELLED">Cancelled</option>
                     </select>
                   ) : (
                     <p className="text-sm font-bold text-blue-400 uppercase">{project.status_display}</p>
                   )}
                 </div>
                 <IntelItem label="Lead Manager" value={project.project_manager_detail?.full_name || "Unassigned"} />
                 <IntelItem label="Completion" value={`${project.progress_percentage}%`} />
                 <IntelItem label="Tech Stack" value={project.tech_stack || "Standard"} />
                 <IntelItem label="Deadline" value={project.deadline || "TBD"} />
               </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-xl">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6 border-b border-white/5 pb-4">Project Force</h3>
               <div className="flex flex-wrap gap-2">
                 {project.team_members_detail?.map(m => (
                   <span key={m.id} className="bg-white/5 px-4 py-2 rounded-xl text-[10px] font-black text-gray-300 border border-white/5 uppercase tracking-widest">
                     {m.full_name}
                   </span>
                 ))}
               </div>
            </div>
          </div>

          {/* Task Control Center */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
               <h2 className="text-2xl font-black tracking-tight">Task Matrix</h2>
               <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">Synchronized</span>
            </div>

            {tasks.length === 0 ? (
              <div className="rounded-[40px] border-2 border-dashed border-white/5 bg-white/5 p-24 text-center text-gray-600 font-black uppercase tracking-widest backdrop-blur-xl">No active operations found</div>
            ) : (
              <div className="space-y-6">
                {tasks.map(task => (
                  <div key={task.id} className="group bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-xl shadow-xl transition-all duration-500 hover:border-[#FF6B2C]/30">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getPriorityStyles(task.priority)}`}>{task.priority}</span>
                            <h4 className="text-xl font-black tracking-tight group-hover:text-[#FF6B2C] transition-colors">{task.title}</h4>
                          </div>
                          {isManagerOrAdmin && (
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                               <button onClick={() => handleOpenEditModal(task)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-gray-500 hover:text-white transition-all">EDIT</button>
                               <button onClick={() => handleDelete(task.id)} className="p-2.5 bg-white/5 hover:bg-red-500/20 rounded-xl text-gray-500 hover:text-red-500 transition-all">DEL</button>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-2xl">{task.description}</p>
                        <div className="flex flex-wrap gap-4 pt-2">
                           <MiniField label="Status" value={task.status_display} accent="text-blue-400" />
                           <MiniField label="Assignee" value={task.assigned_to_detail?.full_name || "Unassigned"} />
                           <MiniField label="Type" value={task.task_type_display} />
                        </div>
                        {task.notes && (
                          <div className="bg-black/20 rounded-2xl p-5 border border-white/5 mt-4">
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-2 font-mono">Terminal Notes</p>
                            <p className="text-xs font-medium text-gray-400 italic">"{task.notes}"</p>
                          </div>
                        )}

                        {taskEvidences[task.id]?.length > 0 && (
                          <div className="bg-black/20 rounded-2xl p-5 border border-white/5 mt-4">
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-3 font-mono">Task Evidence</p>
                            <div className="space-y-2">
                              {taskEvidences[task.id].map((evidence, index) => (
                                <button
                                  key={evidence.id || `${task.id}-evidence-${index}`}
                                  type="button"
                                  onClick={() => handleViewEvidence(evidence.id)}
                                  className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-left text-xs font-bold text-gray-300 transition-all hover:border-[#FF6B2C]/30 hover:text-white"
                                >
                                  <span className="truncate pr-3">
                                    {evidence.file_name || evidence.name || "Evidence file"}
                                  </span>
                                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#FF6B2C]">View</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="w-full md:w-40 text-right">
                        <div className="text-3xl font-bold tracking-tighter text-[#FF6B2C]">{task.progress_percentage}%</div>
                        <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mt-1">Progress</div>
                        
                        {user?.role === "EMPLOYEE" && task.assigned_to_detail?.email?.toLowerCase() === user?.user?.toLowerCase() && (
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            step="5"
                            value={task.progress_percentage}
                            onChange={(e) => handleTaskProgressUpdate(task.id, e.target.value)}
                            className="w-full mt-4 h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-[#FF6B2C]"
                          />
                        )}
                        
                        <div className="mt-4 w-full bg-white/5 h-2 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-[#FF6B2C] to-[#FF8533] h-full transition-all duration-1000" style={{ width: `${task.progress_percentage}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {isTaskModalOpen && (
        <Modal title={editingTask ? "Sync Parameters" : "Initialize Task"} onClose={() => setIsTaskModalOpen(false)}>
          <form onSubmit={handleSubmitTask} className="space-y-6 mt-8">
            <Input label="Title" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} required />
            <div className="grid grid-cols-2 gap-5">
               <SelectField label="Priority" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                 <option value="LOW">Low</option>
                 <option value="MEDIUM">Medium</option>
                 <option value="HIGH">High</option>
                 <option value="CRITICAL">Critical</option>
               </SelectField>
               <SelectField label="Type" value={taskForm.task_type} onChange={e => setTaskForm({...taskForm, task_type: e.target.value})}>
                 <option value="FEATURE">Feature</option>
                 <option value="BUG_FIX">Bug Fix</option>
                 <option value="CODE_REVIEW">Code Review</option>
                 <option value="TESTING">QA / Testing</option>
               </SelectField>
            </div>
            <div className="grid grid-cols-2 gap-5">
               <Input label="Due Date" type="date" value={taskForm.due_date} onChange={e => setTaskForm({...taskForm, due_date: e.target.value})} />
               <SelectField label="Personnel" value={taskForm.assigned_to} onChange={e => setTaskForm({...taskForm, assigned_to: e.target.value})} required>
                  <option value="">Select Member</option>
                  {project.team_members_detail?.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
               </SelectField>
            </div>
            <textarea className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-medium text-white focus:border-[#FF6B2C]/40 outline-none h-32 resize-none" placeholder="Technical specs..." value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} />
            <button type="submit" className="w-full bg-[#FF6B2C] text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-[#FF8533] transition-all">
              {editingTask ? "Apply Changes" : "Create Instance"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-[#0A0A0F]/90 backdrop-blur-xl flex items-center justify-center p-6 z-50">
    <div className="bg-[#0A0A0F] border border-white/10 rounded-[40px] shadow-2xl w-full max-w-2xl p-10 md:p-14 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#FF6B2C]/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="flex justify-between items-center mb-4 relative z-10">
        <h2 className="text-3xl font-black tracking-tighter italic">{title}</h2>
        <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 text-gray-500 hover:text-white transition-all font-black">✕</button>
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  </div>
);

const IntelItem = ({ label, value, accent = "text-white" }) => (
  <div>
    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{label}</p>
    <p className={`text-sm font-black uppercase tracking-tight ${accent}`}>{value || "UNSET"}</p>
  </div>
);

const MiniField = ({ label, value, accent = "text-gray-300" }) => (
  <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-xl">
    <span className="text-[9px] font-black uppercase tracking-widest text-gray-600 mr-2 font-mono">{label}:</span>
    <span className={`text-[10px] font-black uppercase tracking-widest ${accent}`}>{value}</span>
  </div>
);

const Input = ({ label, ...props }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">{label}</label>
    <input {...props} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:border-[#FF6B2C]/40 outline-none transition-all" />
  </div>
);

const SelectField = ({ label, children, ...props }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">{label}</label>
    <select {...props} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:border-[#FF6B2C]/40 outline-none appearance-none cursor-pointer">
      {children}
    </select>
  </div>
);

const getPriorityStyles = (priority) => {
  switch (priority) {
    case "CRITICAL": return "bg-red-500 text-white shadow-lg shadow-red-500/20";
    case "HIGH": return "bg-[#FF6B2C] text-white shadow-lg shadow-[#FF6B2C]/20";
    case "MEDIUM": return "bg-blue-600 text-white shadow-lg shadow-blue-500/20";
    default: return "bg-white/10 text-gray-400";
  }
};

export default ProjectDetails;
