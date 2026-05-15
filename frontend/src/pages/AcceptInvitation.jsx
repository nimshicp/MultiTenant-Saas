import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const AcceptInvitation = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    password: "",
    confirm_password: "",
  });

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const res = await axios.get(`http://${window.location.hostname}:8000/employee/accept-invitation/${token}/`);
        setInvitation(res.data);
        setFormData(prev => ({ ...prev, full_name: res.data.full_name || "" }));
      } catch (err) {
        setError(err?.response?.data?.detail || "Invalid or expired invitation link.");
      } finally {
        setLoading(false);
      }
    };
    fetchInvitation();
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await axios.post(`http://${window.location.hostname}:8000/employee/accept-invitation/${token}/complete/`, formData);
      setSuccess("Account set up successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      const errorData = err?.response?.data;
      if (typeof errorData === "object") {
        const messages = Object.values(errorData).flat().join(" ");
        setError(messages || "Failed to complete account setup.");
      } else {
        setError(errorData?.detail || "Failed to complete account setup.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-[#FF6B2C] font-bold tracking-[0.5em] animate-pulse uppercase">PROCESSING INVITATION...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col justify-center py-12 px-6 font-sans relative overflow-hidden">
      {/* Background glow effects matching landing page */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#FF6B2C]/5 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-15%] right-[-5%] w-[45%] h-[45%] bg-blue-500/5 rounded-full blur-[140px]"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-white/5 backdrop-blur-xl py-12 px-10 shadow-2xl rounded-[40px] border border-white/10">
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#FF6B2C] to-[#FF8533] rounded-[24px] shadow-xl shadow-[#FF6B2C]/20 mb-6">
              <span className="text-white text-3xl font-bold italic">B</span>
            </div>
            <h2 className="text-4xl font-bold tracking-tighter italic mb-2">ACCEPT INVITATION</h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Complete your account setup</p>
          </div>

          {error && (
            <div className="mb-8 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400 uppercase tracking-widest text-center">{error}</div>
          )}

          {success && (
            <div className="mb-8 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-widest text-center">{success}</div>
          )}

          {!success && invitation && (
            <>
              <div className="mb-10 p-6 bg-white/5 border border-white/10 rounded-[32px] text-center">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1 font-bold">Company</p>
                <h3 className="text-xl font-bold text-[#FF6B2C] tracking-tighter">{invitation.company_name || "Nexus Core"}</h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1 mb-2">Full Name</label>
                      <input
                        type="text"
                        name="full_name"
                        placeholder="John Doe"
                        value={formData.full_name}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-700 focus:outline-none focus:border-[#FF6B2C]/40 transition-all font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={invitation?.email || ""}
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-gray-600 font-bold cursor-not-allowed"
                        disabled
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1 mb-2">Password</label>
                      <input
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-700 focus:outline-none focus:border-[#FF6B2C]/40 transition-all font-bold"
                        required
                        minLength={8}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1 mb-2">Confirm Password</label>
                      <input
                        type="password"
                        name="confirm_password"
                        placeholder="••••••••"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-700 focus:outline-none focus:border-[#FF6B2C]/40 transition-all font-bold"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-[#FF6B2C] to-[#FF8533] text-white font-bold py-6 rounded-2xl shadow-xl shadow-[#FF6B2C]/20 hover:shadow-[#FF6B2C]/40 transition-all duration-300 disabled:opacity-50 text-[10px] uppercase tracking-[0.3em] active:scale-95"
                >
                  {submitting ? "SETTING UP..." : "ACCEPT INVITATION"}
                </button>
              </form>
            </>
          )}
          
          {error && !invitation && (
            <div className="text-center mt-6">
              <button onClick={() => navigate("/login")} className="text-[#FF6B2C] font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors">Go back to login terminal</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;
