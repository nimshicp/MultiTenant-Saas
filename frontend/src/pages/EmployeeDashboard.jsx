import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchMyTasks, updateTask, addChecklistItem, updateChecklistItem, deleteChecklistItem } from "../api/projects";

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const loadTasks = async () => {
    try {
      const data = await fetchMyTasks();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status !== 'DONE').length;
    const completed = total - pending;
    const avgProgress = total > 0 ? Math.round(tasks.reduce((acc, t) => acc + (t.progress_percentage || 0), 0) / total) : 0;
    return { total, pending, completed, avgProgress };
  }, [tasks]);

  const handleStatusChange = async (taskId, newStatus) => {
    setUpdatingId(taskId);
    try {
      await updateTask(taskId, { status: newStatus });
      await loadTasks();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleProgressUpdate = async (taskId, progress, notes) => {
    setUpdatingId(taskId);
    try {
      await updateTask(taskId, { progress_percentage: progress, notes });
      await loadTasks();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddCheckpoint = async (taskId, content) => {
    try {
      await addChecklistItem(taskId, content);
      await loadTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleCheckpoint = async (itemId, isCompleted) => {
    try {
      await updateChecklistItem(itemId, { is_completed: !isCompleted });
      await loadTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCheckpoint = async (itemId) => {
    try {
      await deleteChecklistItem(itemId);
      await loadTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-[#FF6B2C] font-bold tracking-[0.5em] animate-pulse">LOADING...</div>
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
              Employee Dashboard
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
              My <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B2C] to-[#FF8533]">Dashboard</span>
            </h1>
            <p className="text-gray-400 max-w-xl font-medium leading-relaxed">
              Welcome back, <span className="text-[#FF6B2C] font-bold">{user?.name || user?.email}</span>. 
              Track your tasks and progress below.
            </p>
          </div>
        </div>

        {/* --- METRICS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard label="Total Tasks" value={stats.total} />
          <MetricCard label="In Progress" value={stats.pending} accent="text-orange-500" />
          <MetricCard label="Completed" value={stats.completed} accent="text-emerald-500" />
          <MetricCard label="Overall Progress" value={`${stats.avgProgress}%`} accent="text-blue-500" />
        </div>

        {/* --- TASK LIST --- */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-bold tracking-tight">Active Assignments</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">Priority List</span>
          </div>

          {tasks.length === 0 ? (
            <div className="rounded-[40px] border-2 border-dashed border-white/5 bg-white/5 p-24 text-center text-gray-600 font-bold uppercase tracking-widest backdrop-blur-xl">
              No active tasks found
            </div>
          ) : (
            <div className="grid gap-8">
              {tasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onStatusChange={handleStatusChange}
                  onProgressUpdate={handleProgressUpdate}
                  onAddCheckpoint={handleAddCheckpoint}
                  onToggleCheckpoint={handleToggleCheckpoint}
                  onDeleteCheckpoint={handleDeleteCheckpoint}
                  isUpdating={updatingId === task.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TaskCard = ({ task, onStatusChange, onProgressUpdate, onAddCheckpoint, onToggleCheckpoint, onDeleteCheckpoint, isUpdating }) => {
  const [localProgress, setLocalProgress] = useState(task.progress_percentage || 0);
  const [localNotes, setLocalNotes] = useState(task.notes || "");
  const [newCheckpoint, setNewCheckpoint] = useState("");

  const handleAdd = (e) => {
    if (e.key === 'Enter' && newCheckpoint.trim()) {
      onAddCheckpoint(task.id, newCheckpoint.trim());
      setNewCheckpoint("");
    }
  };

  return (
    <div className={`rounded-[40px] bg-white/5 border border-white/10 p-8 md:p-10 backdrop-blur-xl shadow-2xl transition-all duration-500 hover:border-[#FF6B2C]/30 ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex flex-col xl:flex-row gap-10">
        <div className="flex-1 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${getPriorityStyles(task.priority)}`}>
                {task.priority}
              </span>
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest font-mono">ID: {task.id.slice(0,8)}</span>
            </div>
            
            <h3 className="text-3xl font-bold tracking-tight">{task.title}</h3>
            <p className="text-sm font-medium text-gray-400 leading-relaxed max-w-2xl">{task.description || "No description provided."}</p>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <DataBadge label="Type" value={task.task_type?.replace("_", " ")} />
              <DataBadge label="Project" value={task.project_name || "N/A"} />
              <DataBadge label="Due Date" value={task.due_date || "Not Set"} />
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-white/5 rounded-[32px] p-6 border border-white/10 space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Task Checklist</h4>
              <span className="text-[10px] font-bold text-[#FF6B2C] uppercase tracking-widest">{task.checklist_items?.filter(i => i.is_completed).length || 0}/{task.checklist_items?.length || 0} Complete</span>
            </div>
            
            <div className="space-y-2">
              {task.checklist_items?.map(item => (
                <div key={item.id} className="flex items-center justify-between group bg-[#0A0A0F]/40 p-4 rounded-2xl border border-white/5 transition-all hover:border-[#FF6B2C]/20">
                  <div className="flex items-center gap-4">
                    <input 
                      type="checkbox" 
                      checked={item.is_completed} 
                      onChange={() => onToggleCheckpoint(item.id, item.is_completed)}
                      className="h-5 w-5 rounded-lg bg-white/5 border-white/10 text-[#FF6B2C] focus:ring-[#FF6B2C] cursor-pointer"
                    />
                    <span className={`text-sm font-bold transition-all ${item.is_completed ? 'line-through text-gray-600' : 'text-gray-300'}`}>
                      {item.content}
                    </span>
                  </div>
                  <button onClick={() => onDeleteCheckpoint(item.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-all text-xs font-bold">DELETE</button>
                </div>
              ))}
            </div>

            <div className="relative">
              <input 
                type="text" 
                value={newCheckpoint}
                onChange={(e) => setNewCheckpoint(e.target.value)}
                onKeyDown={handleAdd}
                placeholder="Add sub-task..."
                className="w-full bg-[#0A0A0F]/60 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-[#FF6B2C]/40 outline-none transition-all pr-24"
              />
              <button 
                onClick={() => {
                  if (newCheckpoint.trim()) {
                    onAddCheckpoint(task.id, newCheckpoint.trim());
                    setNewCheckpoint("");
                  }
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#FF6B2C] text-white px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#FF8533] transition-all shadow-lg shadow-[#FF6B2C]/20"
              >
                ADD
              </button>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="w-full xl:w-96 space-y-6 bg-[#0A0A0F]/80 rounded-[40px] p-8 border border-white/10 shadow-2xl self-start">
          <div className="space-y-8">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4 ml-1">Task Status</label>
              <select 
                value={task.status} 
                onChange={(e) => onStatusChange(task.id, e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold uppercase tracking-widest text-white focus:border-[#FF6B2C]/40 transition-all outline-none cursor-pointer"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Overall Progress</label>
                <span className="text-sm font-bold text-[#FF6B2C]">{localProgress}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={localProgress} 
                onChange={(e) => setLocalProgress(parseInt(e.target.value))}
                className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-[#FF6B2C]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4 ml-1">Task Notes</label>
              <textarea 
                value={localNotes}
                onChange={(e) => setLocalNotes(e.target.value)}
                placeholder="Add notes about your progress..."
                className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-medium text-gray-300 focus:border-[#FF6B2C]/40 transition-all outline-none resize-none"
              />
            </div>

            <button 
              onClick={() => onProgressUpdate(task.id, localProgress, localNotes)}
              className="w-full bg-gradient-to-r from-[#FF6B2C] to-[#FF8533] text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-xs hover:shadow-lg hover:shadow-[#FF6B2C]/25 transition-all active:scale-95 shadow-xl"
            >
              Update Task
            </button>
          </div>
        </div>
      </div>
    </div>

  );
};

const MetricCard = ({ label, value, accent = "text-white" }) => (
  <div className="rounded-[40px] bg-white/5 border border-white/10 p-10 backdrop-blur-xl shadow-xl transition-all duration-500 hover:scale-[1.03] hover:border-[#FF6B2C]/20">
    <div className="flex items-center justify-between mb-4">
       <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</p>
    </div>
    <p className={`text-5xl font-black tracking-tighter ${accent}`}>{value}</p>
  </div>
);

const DataBadge = ({ label, value }) => (
  <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 mr-2">{label}:</span>
    <span className="text-[10px] font-black text-gray-300 uppercase tracking-tight">{value}</span>
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

export default EmployeeDashboard;
