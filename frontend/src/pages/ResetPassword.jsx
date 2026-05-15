import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { confirmPasswordReset } from "../api/auth";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [status, setStatus] = useState({ loading: false, success: false, error: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setStatus({ ...status, error: "Passwords do not match." });
      return;
    }

    setStatus({ loading: true, success: false, error: "" });
    try {
      await confirmPasswordReset(token, formData.password, formData.confirmPassword);
      setStatus({ loading: false, success: true, error: "" });
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setStatus({ 
        loading: false, 
        success: false, 
        error: err.response?.data?.detail || "Invalid or expired token." 
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Background glow effects matching landing page */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#FF6B2C]/5 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-15%] right-[-5%] w-[45%] h-[45%] bg-blue-500/5 rounded-full blur-[140px]"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-10">
          <Link to="/" className="h-16 w-16 bg-gradient-to-br from-[#FF6B2C] to-[#FF8533] rounded-[20px] flex items-center justify-center shadow-xl shadow-[#FF6B2C]/20 hover:scale-105 transition-transform">
             <span className="text-white text-3xl font-black italic">B</span>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-4xl font-bold tracking-tighter text-white italic">
          RESET PASSWORD
        </h2>
        <p className="mt-2 text-center text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">
          Enter your new password below
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="bg-white/5 backdrop-blur-xl py-10 px-8 shadow-2xl rounded-[40px] border border-white/10">
          {status.success ? (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 mb-4 border border-emerald-500/20">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tighter">Password Reset Successfully</h3>
              <p className="text-sm font-bold text-gray-400 leading-relaxed">Your password has been updated. Redirecting to login...</p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="block w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-sm focus:border-[#FF6B2C]/40 outline-none transition-all placeholder-gray-700"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="block w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-sm focus:border-[#FF6B2C]/40 outline-none transition-all placeholder-gray-700"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {status.error && (
                <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-tight">{status.error}</p>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={status.loading}
                  className="w-full flex justify-center py-5 px-4 bg-gradient-to-r from-[#FF6B2C] to-[#FF8533] text-white rounded-2xl shadow-xl shadow-[#FF6B2C]/20 text-[10px] font-bold uppercase tracking-[0.2em] hover:shadow-[#FF6B2C]/40 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status.loading ? "RESETTING..." : "RESET PASSWORD"}
                </button>
              </div>
            </form>

          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
