import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";
import {
  deleteTask,
  updateTask,
  updateProject,
  fetchTaskEvidences,
} from "../api/projects";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  Calendar,
  Code,
  Plus,
  X,
  PlayCircle,
} from "lucide-react";

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
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    task_type: "FEATURE",
    priority: "MEDIUM",
    due_date: "",
    assigned_to: "",
  });

  // Auto-dismiss alerts
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

  const fetchData = async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        api.get(`/api/projects/${projectId}/`),
        api.get(`/api/projects/${projectId}/tasks/`),
      ]);
      setProject(projRes.data);
      const nextTasks = Array.isArray(taskRes.data) ? taskRes.data : [];
      setTasks(nextTasks);
      setTaskEvidences({});
      await Promise.all(nextTasks.map((task) => loadTaskEvidences(task.id)));
    } catch (err) {
      console.error("Failed to fetch project details", err);
      setError("Failed to load project details");
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
      setSuccess("Project status updated");
      fetchData();
    } catch (err) {
      setError("Failed to update project status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleTaskProgressUpdate = async (taskId, newProgress) => {
    try {
      await updateTask(taskId, { progress_percentage: newProgress });
      setSuccess("Task progress updated");
      fetchData();
    } catch (err) {
      setError("Failed to update task progress");
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
      setError(err?.response?.data?.detail || "Failed to open evidence");
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setTaskForm({
      title: "",
      description: "",
      task_type: "FEATURE",
      priority: "MEDIUM",
      due_date: "",
      assigned_to: "",
    });
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
      assigned_to: task.assigned_to || "",
    });
    setIsTaskModalOpen(true);
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await updateTask(editingTask.id, taskForm);
        setSuccess("Task updated successfully");
      } else {
        await api.post(`/api/projects/${projectId}/tasks/create/`, taskForm);
        setSuccess("Task created successfully");
      }
      setIsTaskModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Operation failed");
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await deleteTask(taskId);
      setSuccess("Task deleted successfully");
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0d] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#e1571d]/20 border-t-[#e1571d] rounded-full animate-spin" />
          <div className="text-[#e1571d] text-xs font-semibold uppercase tracking-[0.4em]">
            LOADING PROJECT
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#0b0b0d] text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Project Not Found</h2>
          <Link
            to="/company-dashboard/projects"
            className="text-[#e1571d] hover:text-[#eb6932] transition-colors"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const isManagerOrAdmin =
    user?.role === "ADMIN" ||
    user?.role === "SUPERADMIN" ||
    user?.role === "PROJECT_MANAGER" ||
    project.project_manager === user?.id ||
    project.project_manager_detail?.email?.toLowerCase() ===
      user?.user?.toLowerCase();

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.progress_percentage === 100).length,
    inProgress: tasks.filter(
      (t) => t.progress_percentage > 0 && t.progress_percentage < 100
    ).length,
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 15 },
    },
  };

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white p-4 md:p-10 lg:p-12 font-sans relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{ scale: [1, 1.03, 1], opacity: [0.35, 0.42, 0.35] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-25%] left-[-10%] w-[70vw] h-[70vw] max-w-[900px] rounded-full bg-gradient-to-br from-[#e1571d]/15 via-[#ca4a15]/5 to-transparent blur-[140px]"
        />
        <div className="absolute bottom-[-10%] right-[-10%] w-[55vw] h-[55vw] max-w-[700px] rounded-full bg-gradient-to-tl from-[#1d4ed8]/8 via-[#1e1b4b]/10 to-transparent blur-[130px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 85, damping: 18 }}
          className="flex items-center justify-between gap-4"
        >
          <Link
            to="/company-dashboard/projects"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#86868d] hover:text-white transition-colors group"
          >
            <ArrowLeft
              size={16}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Back to Projects
          </Link>
          {isManagerOrAdmin && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#e1571d] to-[#eb6932] text-white px-6 py-3 rounded-lg font-medium text-sm uppercase tracking-wide shadow-[0_4px_20px_rgba(225,87,29,0.25)] hover:shadow-[0_4px_25px_rgba(225,87,29,0.35)] transition-all"
            >
              <Plus size={16} />
              New Task
            </motion.button>
          )}
        </motion.div>

        {/* Alerts */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-lg bg-red-500/10 p-4 text-sm font-medium text-red-400 border border-red-500/15"
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-lg bg-emerald-500/10 p-4 text-sm font-medium text-emerald-400 border border-emerald-500/15"
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 85, damping: 18, delay: 0.1 }}
          className="rounded-[28px] bg-[#141416]/40 backdrop-blur-[30px] border border-white/[0.06] p-8 md:p-12 overflow-hidden shadow-xl"
        >
          <div className="relative z-10 space-y-4">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white">
              {project.name}
            </h1>
            <p className="text-[#86868d] text-base max-w-2xl leading-relaxed">
              {project.description || "Project parameters synchronized and active."}
            </p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <StatCard
            variants={itemVariants}
            label="Total Tasks"
            value={taskStats.total}
            icon={<CheckCircle size={16} />}
          />
          <StatCard
            variants={itemVariants}
            label="Completed"
            value={taskStats.completed}
            icon={<CheckCircle size={16} className="text-emerald-400" />}
          />
          <StatCard
            variants={itemVariants}
            label="In Progress"
            value={taskStats.inProgress}
            icon={<Clock size={16} className="text-blue-400" />}
          />
          <StatCard
            variants={itemVariants}
            label="Progress"
            value={`${project.progress_percentage}%`}
            icon={<AlertTriangle size={16} className="text-[#e1571d]" />}
          />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              type: "spring",
              stiffness: 90,
              damping: 16,
              delay: 0.15,
            }}
            className="space-y-6"
          >
            {/* Project Info */}
            <div className="rounded-[24px] bg-[#141416]/40 backdrop-blur-[30px] border border-white/[0.06] p-6 shadow-xl">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#86868d] mb-6 border-b border-white/[0.04] pb-4">
                Project Details
              </h3>
              <div className="space-y-6">
                <InfoItem
                  label="Status"
                  value={
                    isManagerOrAdmin ? (
                      <select
                        disabled={updatingStatus}
                        value={project.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="bg-[#1c1c1f]/40 border border-white/[0.06] rounded-lg px-3 py-2 text-sm font-medium text-white focus:border-[#e1571d]/40 outline-none cursor-pointer"
                      >
                        <option value="PLANNING">Planning</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="ON_HOLD">On Hold</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    ) : (
                      <span className="text-sm font-medium text-[#e1571d]">
                        {project.status_display}
                      </span>
                    )
                  }
                />
                <InfoItem
                  label="Manager"
                  value={project.project_manager_detail?.full_name || "Unassigned"}
                />
                <InfoItem
                  label="Tech Stack"
                  value={project.tech_stack || "Standard"}
                />
                <InfoItem label="Deadline" value={project.deadline || "TBD"} />
              </div>
            </div>

            {/* Team Members */}
            {project.team_members_detail?.length > 0 && (
              <div className="rounded-[24px] bg-[#141416]/40 backdrop-blur-[30px] border border-white/[0.06] p-6 shadow-xl">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#86868d] mb-4 border-b border-white/[0.04] pb-4">
                  Team Members
                </h3>
                <div className="space-y-3">
                  {project.team_members_detail?.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                    >
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#e1571d] to-[#eb6932] flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-white">
                          {member.full_name?.charAt(0) || "?"}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-300 truncate">
                        {member.full_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Tasks Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              type: "spring",
              stiffness: 90,
              damping: 16,
              delay: 0.2,
            }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">Tasks</h2>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#86868d] bg-white/[0.03] px-3 py-1.5 rounded-md border border-white/[0.05]">
                {tasks.length} Active
              </span>
            </div>

            <AnimatePresence mode="wait">
              {tasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-[24px] border-2 border-dashed border-white/[0.05] bg-[#141416]/20 py-16 text-center text-gray-500 text-sm font-medium uppercase tracking-widest"
                >
                  No tasks found
                </motion.div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-4"
                >
                  {tasks.map((task) => (
                    <motion.div
                      variants={itemVariants}
                      key={task.id}
                      className="group rounded-[24px] bg-[#141416]/40 border border-white/[0.06] p-6 backdrop-blur-[30px] shadow-xl hover:border-[#e1571d]/30 hover:bg-[#141416]/60 transition-all duration-300"
                    >
                      <div className="space-y-4">
                        {/* Task Header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <span
                                className={`inline-flex text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-md border ${getPriorityStyles(
                                  task.priority
                                )}`}
                              >
                                {task.priority}
                              </span>
                              <h3 className="text-lg font-semibold text-white group-hover:text-[#e1571d] transition-colors truncate">
                                {task.title}
                              </h3>
                            </div>
                            <p className="text-sm text-[#86868d] line-clamp-2">
                              {task.description}
                            </p>
                          </div>
                          {isManagerOrAdmin && (
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenEditModal(task)}
                                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.04] transition-all"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(task.id)}
                                className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Task Meta */}
                        <div className="flex flex-wrap gap-2">
                          <Badge label="Status" value={task.status_display} />
                          <Badge label="Type" value={task.task_type_display} />
                          {task.assigned_to_detail?.full_name && (
                            <Badge
                              label="Assignee"
                              value={task.assigned_to_detail.full_name}
                            />
                          )}
                        </div>

                        {/* Progress */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#86868d] uppercase tracking-wider">
                              Progress
                            </span>
                            <span className="text-lg font-bold text-[#e1571d]">
                              {task.progress_percentage}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-white/[0.05] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${task.progress_percentage}%` }}
                              transition={{ duration: 0.6 }}
                              className="h-full bg-gradient-to-r from-[#e1571d] to-[#eb6932]"
                            />
                          </div>
                          {user?.role === "EMPLOYEE" &&
                            task.assigned_to_detail?.email?.toLowerCase() ===
                              user?.user?.toLowerCase() && (
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={task.progress_percentage}
                                onChange={(e) =>
                                  handleTaskProgressUpdate(
                                    task.id,
                                    e.target.value
                                  )
                                }
                                className="w-full h-1 bg-white/[0.05] rounded-lg appearance-none cursor-pointer accent-[#e1571d]"
                              />
                            )}
                        </div>

                        {/* Evidence Section */}
                        {taskEvidences[task.id]?.length > 0 && (
                          <div className="border-t border-white/[0.04] pt-4">
                            <p className="text-xs font-semibold text-[#86868d] uppercase tracking-wider mb-3">
                              Evidence Files
                            </p>
                            <div className="space-y-2">
                              {taskEvidences[task.id].map((evidence) => (
                                <motion.button
                                  key={evidence.id}
                                  whileHover={{ x: 4 }}
                                  onClick={() => handleViewEvidence(evidence.id)}
                                  className="w-full flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-4 py-3 text-left hover:border-[#e1571d]/30 hover:bg-white/[0.05] transition-all group"
                                >
                                  <span className="text-xs font-medium text-gray-400 group-hover:text-white transition-colors truncate">
                                    {evidence.file_name || evidence.name}
                                  </span>
                                  <PlayCircle
                                    size={12}
                                    className="text-[#e1571d] flex-shrink-0"
                                  />
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Task Modal */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <TaskModal
            title={editingTask ? "Edit Task" : "Create New Task"}
            project={project}
            taskForm={taskForm}
            setTaskForm={setTaskForm}
            onSubmit={handleSubmitTask}
            onClose={() => setIsTaskModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── REUSABLE COMPONENTS ─── */

const StatCard = ({ label, value, icon, variants }) => (
  <motion.div
    variants={variants}
    whileHover={{ y: -3, scale: 1.01 }}
    transition={{ type: "spring", stiffness: 200, damping: 15 }}
    className="bg-[#141416]/40 backdrop-blur-[30px] border border-white/[0.06] rounded-[20px] p-5 shadow-md"
  >
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-medium uppercase tracking-wider text-[#86868d]">
        {label}
      </span>
      <div className="w-6 h-6 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-center">
        {icon}
      </div>
    </div>
    <div className="text-2xl font-semibold tracking-tight text-white">
      {value}
    </div>
  </motion.div>
);

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wider text-[#86868d] mb-2">
      {label}
    </p>
    {typeof value === "string" ? (
      <p className="text-sm font-medium text-gray-300">{value || "Not set"}</p>
    ) : (
      value
    )}
  </div>
);

const Badge = ({ label, value }) => (
  <div className="inline-flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1.5">
    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868d]">
      {label}:
    </span>
    <span className="text-xs font-medium text-gray-300">{value}</span>
  </div>
);

const TaskModal = ({
  title,
  project,
  taskForm,
  setTaskForm,
  onSubmit,
  onClose,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-[#0b0b0d] border border-white/[0.06] rounded-[28px] w-full max-w-2xl p-8 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/[0.04] rounded-lg text-gray-400 hover:text-white transition-all"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#86868d] mb-2 block">
            Task Title
          </label>
          <input
            type="text"
            value={taskForm.title}
            onChange={(e) =>
              setTaskForm({ ...taskForm, title: e.target.value })
            }
            required
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3 text-sm font-medium text-white focus:border-[#e1571d]/40 outline-none transition-all"
            placeholder="Enter task title"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#86868d] mb-2 block">
              Priority
            </label>
            <select
              value={taskForm.priority}
              onChange={(e) =>
                setTaskForm({ ...taskForm, priority: e.target.value })
              }
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3 text-sm font-medium text-gray-300 focus:border-[#e1571d]/40 outline-none cursor-pointer appearance-none"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#86868d] mb-2 block">
              Type
            </label>
            <select
              value={taskForm.task_type}
              onChange={(e) =>
                setTaskForm({ ...taskForm, task_type: e.target.value })
              }
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3 text-sm font-medium text-gray-300 focus:border-[#e1571d]/40 outline-none cursor-pointer appearance-none"
            >
              <option value="FEATURE">Feature</option>
              <option value="BUG_FIX">Bug Fix</option>
              <option value="CODE_REVIEW">Code Review</option>
              <option value="TESTING">QA / Testing</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#86868d] mb-2 block">
              Due Date
            </label>
            <input
              type="date"
              value={taskForm.due_date}
              onChange={(e) =>
                setTaskForm({ ...taskForm, due_date: e.target.value })
              }
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3 text-sm font-medium text-gray-300 focus:border-[#e1571d]/40 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#86868d] mb-2 block">
              Assign To
            </label>
            <select
              value={taskForm.assigned_to}
              onChange={(e) =>
                setTaskForm({ ...taskForm, assigned_to: e.target.value })
              }
              required
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3 text-sm font-medium text-gray-300 focus:border-[#e1571d]/40 outline-none cursor-pointer appearance-none"
            >
              <option value="">Select Team Member</option>
              {project.team_members_detail?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#86868d] mb-2 block">
            Description
          </label>
          <textarea
            value={taskForm.description}
            onChange={(e) =>
              setTaskForm({ ...taskForm, description: e.target.value })
            }
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3 text-sm font-medium text-white focus:border-[#e1571d]/40 outline-none resize-none h-32"
            placeholder="Enter task description"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-gradient-to-r from-[#e1571d] to-[#eb6932] text-white py-3 rounded-lg font-medium uppercase tracking-widest text-xs shadow-[0_4px_20px_rgba(225,87,29,0.25)] hover:shadow-[0_4px_25px_rgba(225,87,29,0.35)] transition-all active:scale-[0.98]"
          >
            Save Task
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-white/[0.03] border border-white/[0.06] text-white py-3 rounded-lg font-medium uppercase tracking-widest text-xs hover:bg-white/[0.06] transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  </motion.div>
);

const getPriorityStyles = (priority) => {
  switch (priority) {
    case "CRITICAL":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case "HIGH":
      return "bg-[#e1571d]/10 text-[#eb6932] border-[#e1571d]/20";
    case "MEDIUM":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    default:
      return "bg-white/5 text-gray-400 border-white/10";
  }
};

export default ProjectDetails;