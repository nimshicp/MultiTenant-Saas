import React, { useState, useEffect } from "react";
import api from "../api/axios";

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
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post(`/api/employee/invite/`, formData);
      setSuccess("Invitation sent successfully!");
      setFormData({ full_name: "", email: "", role: "EMPLOYEE", department: "", job_title: "" });
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
      alert("Failed to delete employee.");
    }
  };

  const toggleBlock = async (emp) => {
    try {
      await api.patch(`/api/employee/manage/${emp.employee_id}/`, { is_blocked: !emp.is_blocked });
      fetchEmployees();
    } catch (err) {
      alert("Failed to toggle block status.");
    }
  };

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
            <span className="inline-flex items-center gap-2 text-[#FF6B2C] bg-[#FF6B2C]/10 text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-[#FF6B2C]/20">
              Team
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
              Team <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B2C] to-[#FF8533]">Management</span>
            </h1>
            <p className="text-gray-400 max-w-xl font-medium leading-relaxed">
              Manage your team members, assigned roles, and access status.
            </p>
          </div>
          <button
            onClick={() => { setIsInviteModalOpen(true); setFormData({ full_name: "", email: "", role: "EMPLOYEE", department: "", job_title: "" }); setSuccess(""); setError(""); }}
            className="relative z-10 bg-gradient-to-r from-[#FF6B2C] to-[#FF8533] text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-[#FF6B2C]/20 hover:shadow-[#FF6B2C]/40 transition-all active:scale-95 flex items-center gap-3"
          >
            <span className="text-xl">+</span> Invite Member
          </button>
        </div>

        {/* --- TEAM LIST PANEL --- */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight">Team List</h2>
            <span className="bg-white/5 border border-white/10 text-gray-400 px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest">{employees.length} Members</span>
          </div>
          
          {fetching ? (
            <div className="text-center py-24 text-[#FF6B2C] font-bold tracking-[0.3em] animate-pulse">LOADING MEMBERS...</div>
          ) : employees.length === 0 ? (
            <div className="text-center py-24 text-gray-600 font-bold tracking-widest">NO MEMBERS FOUND</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-gray-500 text-[10px] uppercase tracking-widest font-bold">
                  <tr>
                    <th className="py-6 px-10">Name</th>
                    <th className="py-6 px-10">Role & Dept</th>
                    <th className="py-6 px-10">Status</th>
                    <th className="py-6 px-10 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-white/5 transition-all duration-300 group">
                      <td className="py-6 px-10">
                        <div className="flex items-center gap-5">
                          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 text-white flex items-center justify-center font-bold text-lg shadow-xl">
                            {emp.name?.slice(0, 2) || "U"}
                          </div>
                          <div>
                            <div className="font-bold text-white text-lg tracking-tight group-hover:text-[#FF6B2C] transition-colors">{emp.name}</div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-10">
                        <div className="text-xs font-bold text-[#FF6B2C] uppercase tracking-widest">{emp.role?.replace("_", " ")}</div>
                        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">{emp.department || "General"} • {emp.job_title || "Team Member"}</div>
                      </td>
                      <td className="py-6 px-10">
                        <StatusIndicator emp={emp} />
                      </td>
                      <td className="py-6 px-10 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <button onClick={() => handleEditClick(emp)} className="p-3 bg-white/5 hover:bg-blue-600 hover:text-white rounded-xl text-gray-500 transition-all">EDIT</button>
                          <button onClick={() => toggleBlock(emp)} className={`p-3 rounded-xl transition-all ${emp.is_blocked ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-600' : 'bg-white/5 text-gray-500 hover:bg-orange-600'}`}>{emp.is_blocked ? "UNLOCK" : "BLOCK"}</button>
                          <button onClick={() => handleDeleteEmployee(emp.employee_id)} className="p-3 bg-white/5 hover:bg-red-600 text-gray-500 hover:text-white rounded-xl transition-all">DEL</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals with matching dark theme */}
      {isInviteModalOpen && (
        <Modal title="Invite Member" onClose={() => setIsInviteModalOpen(false)}>
          <form onSubmit={handleInvite} className="space-y-6 mt-8">
            {success && <div className="p-4 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-2xl border border-emerald-500/20">INVITATION SENT</div>}
            {error && <div className="p-4 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-2xl border border-red-500/20">{error}</div>}
            <div className="grid grid-cols-2 gap-5">
              <Input label="Full Name" name="full_name" value={formData.full_name} onChange={handleChange} required />
              <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <SelectField label="Role" name="role" value={formData.role} onChange={handleChange}>
                <option value="EMPLOYEE">Employee</option>
                <option value="PROJECT_MANAGER">Project Manager</option>
                <option value="ADMIN">Admin</option>
              </SelectField>
              <Input label="Department" name="department" value={formData.department} onChange={handleChange} />
            </div>
            <Input label="Job Title" name="job_title" value={formData.job_title} onChange={handleChange} />
            <button disabled={loading} className="w-full bg-[#FF6B2C] text-white py-4 rounded-2xl font-bold uppercase tracking-widest mt-4 shadow-xl shadow-[#FF6B2C]/20 hover:bg-[#FF8533] transition-all">
              {loading ? "SENDING..." : "Send Invitation"}
            </button>
          </form>
        </Modal>
      )}

      {isEditModalOpen && (
        <Modal title={`Edit Member: ${selectedEmployee?.name}`} onClose={() => setIsEditModalOpen(false)}>
          <form onSubmit={handleUpdate} className="space-y-6 mt-8">
            {success && <div className="p-4 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-2xl border border-emerald-500/20">MEMBER UPDATED</div>}
            <div className="grid grid-cols-2 gap-5">
              <Input label="Full Name" name="full_name" value={formData.full_name} onChange={handleChange} required />
              <SelectField label="Role" name="role" value={formData.role} onChange={handleChange}>
                <option value="EMPLOYEE">Employee</option>
                <option value="PROJECT_MANAGER">Project Manager</option>
                <option value="ADMIN">Admin</option>
              </SelectField>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <Input label="Department" name="department" value={formData.department} onChange={handleChange} />
              <Input label="Job Title" name="job_title" value={formData.job_title} onChange={handleChange} />
            </div>
            <div className="p-6 bg-white/5 rounded-2xl flex items-center justify-between border border-white/5">
              <div>
                <div className="text-[10px] font-bold text-white uppercase tracking-widest">Active Status</div>
                <div className="text-[9px] text-gray-500 uppercase font-bold tracking-widest mt-1">Allow member to login</div>
              </div>
              <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="h-6 w-6 rounded-lg bg-white/5 border-white/10 text-[#FF6B2C] focus:ring-[#FF6B2C] cursor-pointer" />
            </div>
            <button disabled={loading} className="w-full bg-[#FF6B2C] text-white py-4 rounded-2xl font-bold uppercase tracking-widest mt-6 hover:bg-[#FF8533] transition-all shadow-xl">
              {loading ? "SYNCHRONIZING..." : "Update Member"}
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
        <h2 className="text-3xl font-bold tracking-tighter italic">{title}</h2>
        <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 text-gray-500 hover:text-white transition-all font-bold">✕</button>
      </div>
      <div className="relative z-10">{children}</div>
    </div>
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

const StatusIndicator = ({ emp }) => {
  if (!emp.is_active) return <span className="inline-block bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-500/20">Deactivated</span>;
  if (emp.is_blocked) return <span className="inline-block bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-orange-500/20">Suspended</span>;
  return <span className="inline-block bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">Authorized</span>;
};

export default TeamManagement;
