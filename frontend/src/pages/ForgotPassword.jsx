import React, { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../api/auth";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ loading: false, success: false, error: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: false, error: "" });
    try {
      await requestPasswordReset(email);
      setStatus({ loading: false, success: true, error: "" });
    } catch (err) {
      setStatus({ 
        loading: false, 
        success: false, 
        error: err.response?.data?.detail || "Failed to send reset link." 
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col justify-center py-12 px-6 font-sans relative overflow-hidden">
      {/* Background glow effects matching landing page */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#FF6B2C]/5 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-15%] right-[-5%] w-[45%] h-[45%] bg-blue-500/5 rounded-full blur-[140px]"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="flex justify-center mb-6">
          <Link to="/" className="inline-flex items-center text-[10px] font-bold text-gray-500 hover:text-[#FF6B2C] uppercase tracking-[0.2em] transition-colors gap-2 group">
            <svg className="w-3 h-3 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
        <div className="flex justify-center mb-8">
          <Link to="/" className="h-16 w-16 bg-gradient-to-br from-[#FF6B2C] to-[#FF8533] rounded-[24px] flex items-center justify-center shadow-2xl shadow-[#FF6B2C]/20 hover:scale-105 transition-transform">
             <span className="text-white text-3xl font-bold italic">B</span>
          </Link>
        </div>
        <h2 className="text-4xl font-bold tracking-tighter italic">FORGOT PASSWORD</h2>
        <p className="mt-2 text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Enter your email to reset your password</p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="bg-white/5 backdrop-blur-xl py-12 px-10 shadow-2xl rounded-[40px] border border-white/10">
          {status.success ? (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 mb-4 border border-emerald-500/20">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tighter">Reset Link Sent</h3>
              <p className="text-sm font-medium text-gray-400 leading-relaxed">
                If an account exists for <span className="text-[#FF6B2C] font-bold">{email}</span>, a reset link has been sent to your inbox.
              </p>
              <Link
                to="/login"
                className="mt-8 block w-full bg-white/10 text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-white/20 transition-all border border-white/10"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form className="space-y-8" onSubmit={handleSubmit}>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1 mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold text-sm focus:border-[#FF6B2C]/40 outline-none transition-all placeholder-gray-700"
                  placeholder="name@example.com"
                />
              </div>

              {status.error && (
                <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">{status.error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={status.loading}
                className="w-full bg-gradient-to-r from-[#FF6B2C] to-[#FF8533] text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-[#FF6B2C]/20 hover:shadow-[#FF6B2C]/40 transition-all active:scale-95 disabled:opacity-50"
              >
                {status.loading ? "SENDING..." : "RESET PASSWORD"}
              </button>

              <div className="text-center mt-6 pt-6 border-t border-white/5">
                <Link to="/login" className="text-[10px] font-bold text-gray-500 hover:text-[#FF6B2C] uppercase tracking-widest transition-colors">
                  Already have an account? <span className="text-[#FF6B2C]">Back to Login</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

    </div>
  );
};

export default ForgotPassword;
