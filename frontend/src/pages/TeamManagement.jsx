import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";
import {
  Plus,
  Users,
  Mail,
  Lock,
  Unlock,
  Trash2,
  Edit3,
  X,
  CheckCircle,
  AlertCircle,
  Shield,
  Briefcase,
} from "lucide-react";

const TeamManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [employees, setEmployees] = useState([]);
  const [fetching, setFetching] = useState(true);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "EMPLOYEE",
    department: "",
    job_title: "",
  });

  const fetchEmployees = async () => {
    try {
      const res = await api.get(`/api/employee/list/`);
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch employees", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post(`/api/employee/invite/`, formData);
      setSuccess("Invitation sent successfully!");
      setFormData({
        full_name: "",
        email: "",
        role: "EMPLOYEE",
        department: "",
        job_title: "",
      });
      fetchEmployees();
      setTimeout(() => setIsInviteModalOpen(false), 2000);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to invite employee.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (emp) => {
    setSelectedEmployee(emp);
    setFormData({
      full_name: emp.name,
      role: emp.role,
      department: emp.department || "",
      job_title: emp.job_title || "",
      is_blocked: emp.is_blocked,
      is_active: emp.is_active,
    });
    setIsEditModalOpen(true);
    setSuccess("");
    setError("");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch(`/api/employee/manage/${selectedEmployee.employee_id}/`, formData);
      setSuccess("Employee updated successfully!");
      fetchEmployees();
      setTimeout(() => setIsEditModalOpen(false), 1500);
    } catch (err) {
      setError("Failed to update employee.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) {
      return;
    }
    try {
      await api.delete(`/api/employee/manage/${employeeId}/`);
      setSuccess("Employee deleted successfully.");
      fetchEmployees();
    } catch (err) {
      setError("Failed to delete employee.");
    }
  };

  const toggleBlock = async (emp) => {
    try {
      await api.patch(`/api/employee/manage/${emp.employee_id}/`, {
        is_blocked: !emp.is_blocked,
      });
      setSuccess(`Employee ${emp.is_blocked ? "unblocked" : "blocked"} successfully.`);
      fetchEmployees();
    } catch (err) {
      setError("Failed to toggle block status.");
    }
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
    <div className="min-h-screen bg-[#0b0b0d] text-white p-4 md:p-10 lg:p-12 font-sans relative overflow-hidden select-none">
      {/* Background Effects with Enhanced Animations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Animated Orange/Red Orb - Top Left */}
        <motion.div
          animate={{
            scale: [1, 1.2, 0.9, 1.1, 1],
            opacity: [0.3, 0.5, 0.2, 0.4, 0.3],
            x: [0, 50, -30, 40, 0],
            y: [0, -40, 30, -20, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] left-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#e1571d]/20 via-[#eb6932]/10 to-transparent blur-[150px]"
        />

        {/* Animated Blue Orb - Bottom Right */}
        <motion.div
          animate={{
            scale: [0.9, 1.1, 1, 1.15, 0.9],
            opacity: [0.2, 0.4, 0.3, 0.35, 0.2],
            x: [0, -60, 40, -30, 0],
            y: [0, 50, -40, 30, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-[#1d4ed8]/12 via-[#1e1b4b]/8 to-transparent blur-[140px]"
        />

        {/* Animated Secondary Orange Accent - Right Side */}
        <motion.div
          animate={{
            scale: [1, 0.8, 1.3, 0.9, 1],
            opacity: [0.25, 0.15, 0.35, 0.2, 0.25],
            x: [0, -50, 60, -40, 0],
            y: [0, 60, -50, 40, 0],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-l from-[#e1571d]/15 via-[#ca4a15]/5 to-transparent blur-[120px]"
        />

        {/* Animated Subtle Blue Accent - Center */}
        <motion.div
          animate={{
            scale: [1.1, 0.9, 1, 1.2, 1.1],
            opacity: [0.15, 0.1, 0.2, 0.18, 0.15],
            x: [0, 40, -60, 50, 0],
            y: [0, -50, 40, -30, 0],
          }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute top-[40%] left-[10%] w-[400px] h-[400px] rounded-full bg-gradient-to-r from-[#1d4ed8]/10 to-transparent blur-[100px]"
        />

        {/* Starfield overlay for extra depth */}
        <div
          className="absolute inset-0 opacity-20 mix-blend-screen"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='10' cy='20' r='0.8' fill='%23ffffff' opacity='0.6'/%3E%3Ccircle cx='80' cy='10' r='1' fill='%23ffffff' opacity='0.4'/%3E%3Ccircle cx='90' cy='60' r='0.6' fill='%2393c5fd' opacity='0.5'/%3E%3Ccircle cx='30' cy='80' r='0.8' fill='%23ffffff' opacity='0.5'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* --- HEADER BANNER --- */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 85, damping: 18 }}
          className="rounded-[28px] bg-[#141416]/40 backdrop-blur-[30px] border border-white/[0.06] p-8 md:p-12 overflow-hidden shadow-xl"
        >
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-1.5 text-[#e1571d] bg-[#e1571d]/8 text-[11px] font-semibold uppercase tracking-[0.25em] px-3.5 py-1.5 rounded-full border border-[#e1571d]/15">
              <Users size={12} className="mt-[-1px]" />
              Team Control
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white">
              Team <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e1571d] to-[#eb6932]">Management</span>
            </h1>
            <p className="text-[#86868d] text-base max-w-2xl leading-relaxed">
              Manage your team members, roles, departments, and access permissions.
            </p>
          </div>
        </motion.div>

        {/* --- ALERTS --- */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-lg bg-red-500/10 p-4 text-sm font-medium text-red-400 border border-red-500/15 flex items-center gap-3"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-lg bg-emerald-500/10 p-4 text-sm font-medium text-emerald-400 border border-emerald-500/15 flex items-center gap-3"
            >
              <CheckCircle size={16} />
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- STATS GRID --- */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <StatCard
            variants={itemVariants}
            label="Total Members"
            value={employees.length}
            icon={<Users size={16} />}
          />
          <StatCard
            variants={itemVariants}
            label="Active"
            value={employees.filter((e) => e.is_active && !e.is_blocked).length}
            icon={<CheckCircle size={16} className="text-emerald-400" />}
          />
          <StatCard
            variants={itemVariants}
            label="Suspended"
            value={employees.filter((e) => e.is_blocked).length}
            icon={<Lock size={16} className="text-orange-400" />}
          />
        </motion.div>

        {/* --- ACTION BUTTON --- */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold tracking-tight">Member Roster</h2>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setIsInviteModalOpen(true);
              setFormData({
                full_name: "",
                email: "",
                role: "EMPLOYEE",
                department: "",
                job_title: "",
              });
              setSuccess("");
              setError("");
            }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#e1571d] to-[#eb6932] text-white px-6 py-3 rounded-lg font-medium text-sm uppercase tracking-wide shadow-[0_4px_20px_rgba(225,87,29,0.25)] hover:shadow-[0_4px_25px_rgba(225,87,29,0.35)] transition-all"
          >
            <Plus size={16} />
            Invite Member
          </motion.button>
        </div>

        {/* --- TEAM LIST --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 85,
            damping: 18,
            delay: 0.1,
          }}
          className="rounded-[24px] bg-[#141416]/40 backdrop-blur-[30px] border border-white/[0.06] overflow-hidden shadow-xl"
        >
          {fetching ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-[#e1571d]/20 border-t-[#e1571d] rounded-full animate-spin" />
                <div className="text-[#e1571d] text-xs font-semibold uppercase tracking-[0.4em]">
                  Loading Members
                </div>
              </div>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-24 text-[#86868d] text-sm font-medium uppercase tracking-widest">
              No team members yet
            </div>
          ) : (
            <div className="space-y-2 p-6">
              <AnimatePresence mode="wait">
                {employees.map((emp, index) => (
                  <motion.div
                    key={emp.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="show"
                    transition={{ delay: index * 0.05 }}
                    className="group rounded-[20px] bg-white/[0.02] border border-white/[0.06] p-6 hover:border-[#e1571d]/30 hover:bg-white/[0.05] transition-all duration-300"
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Employee Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#e1571d] to-[#eb6932] flex items-center justify-center flex-shrink-0 shadow-lg">
                          <span className="text-sm font-bold text-white">
                            {emp.name?.slice(0, 2).toUpperCase() || "?"}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-white group-hover:text-[#e1571d] transition-colors truncate">
                            {emp.name}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            <span className="text-[10px] font-medium text-[#e1571d] bg-[#e1571d]/10 px-2.5 py-1 rounded-md border border-[#e1571d]/20 uppercase tracking-wider">
                              {emp.role?.replace("_", " ")}
                            </span>
                            <span className="text-[10px] font-medium text-[#86868d] uppercase tracking-wider">
                              {emp.department || "General"} • {emp.job_title || "Team Member"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-500">
                            <Mail size={10} />
                            {emp.email}
                          </div>
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div>
                          <StatusBadge emp={emp} />
                        </div>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/[0.02] border border-white/[0.05] p-1 rounded-lg">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEditClick(emp)}
                            className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/[0.04] transition-all"
                            title="Edit"
                          >
                            <Edit3 size={14} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleBlock(emp)}
                            className={`p-2 rounded-md transition-all ${
                              emp.is_blocked
                                ? "text-emerald-400 hover:text-emerald-500 hover:bg-emerald-500/10"
                                : "text-orange-400 hover:text-orange-500 hover:bg-orange-500/10"
                            }`}
                            title={emp.is_blocked ? "Unblock" : "Block"}
                          >
                            {emp.is_blocked ? (
                              <Unlock size={14} />
                            ) : (
                              <Lock size={14} />
                            )}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteEmployee(emp.employee_id)}
                            className="p-2 rounded-md text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* --- INVITE MODAL --- */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <TeamModal
            title="Invite New Member"
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleInvite}
            onClose={() => setIsInviteModalOpen(false)}
            loading={loading}
            success={success}
            error={error}
            mode="invite"
          />
        )}
      </AnimatePresence>

      {/* --- EDIT MODAL --- */}
      <AnimatePresence>
        {isEditModalOpen && (
          <TeamModal
            title={`Edit Member: ${selectedEmployee?.name}`}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdate}
            onClose={() => setIsEditModalOpen(false)}
            loading={loading}
            success={success}
            error={error}
            mode="edit"
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

const StatusBadge = ({ emp }) => {
  if (!emp.is_active) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-red-400 bg-red-500/10 px-3 py-1.5 rounded-md border border-red-500/20">
        <AlertCircle size={10} />
        Deactivated
      </span>
    );
  }
  if (emp.is_blocked) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-md border border-orange-500/20">
        <Lock size={10} />
        Suspended
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-md border border-emerald-500/20">
      <CheckCircle size={10} />
      Active
    </span>
  );
};

const TeamModal = ({
  title,
  formData,
  setFormData,
  onSubmit,
  onClose,
  loading,
  success,
  error,
  mode,
}) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
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

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 rounded-lg bg-red-500/10 p-3 text-xs font-medium text-red-400 border border-red-500/15"
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 rounded-lg bg-emerald-500/10 p-3 text-xs font-medium text-emerald-400 border border-emerald-500/15"
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#86868d] mb-2 block">
                Full Name
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3 text-sm font-medium text-white focus:border-[#e1571d]/40 outline-none transition-all"
                placeholder="John Doe"
              />
            </div>
            {mode === "invite" && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#86868d] mb-2 block">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3 text-sm font-medium text-white focus:border-[#e1571d]/40 outline-none transition-all"
                  placeholder="john@example.com"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#86868d] mb-2 block">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3 text-sm font-medium text-gray-300 focus:border-[#e1571d]/40 outline-none cursor-pointer appearance-none"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="PROJECT_MANAGER">Project Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#86868d] mb-2 block">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3 text-sm font-medium text-white focus:border-[#e1571d]/40 outline-none transition-all"
                placeholder="Engineering"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#86868d] mb-2 block">
              Job Title
            </label>
            <input
              type="text"
              name="job_title"
              value={formData.job_title}
              onChange={handleChange}
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-3 text-sm font-medium text-white focus:border-[#e1571d]/40 outline-none transition-all"
              placeholder="Senior Developer"
            />
          </div>

          {mode === "edit" && (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Active Status
                  </p>
                  <p className="text-xs text-[#86868d] mt-1">
                    Allow member to login
                  </p>
                </div>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="h-5 w-5 rounded-lg bg-white/[0.03] border border-white/[0.06] accent-[#e1571d] cursor-pointer"
                />
              </label>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-[#e1571d] to-[#eb6932] text-white py-3 rounded-lg font-medium uppercase tracking-widest text-xs shadow-[0_4px_20px_rgba(225,87,29,0.25)] hover:shadow-[0_4px_25px_rgba(225,87,29,0.35)] transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading
                ? mode === "invite"
                  ? "Sending..."
                  : "Updating..."
                : mode === "invite"
                ? "Send Invitation"
                : "Update Member"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/[0.03] border border-white/[0.06] text-white py-3 rounded-lg font-medium uppercase tracking-widest text-xs hover:bg-white/[0.06] transition-all"
            >
              Cancel
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default TeamManagement;