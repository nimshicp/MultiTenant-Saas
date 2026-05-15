import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const { login, verifyMFA } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [mfaRequired, setMfaRequired] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const { setUser } = useAuth();

  // Clear session if redirected from a logout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("logout") === "true") {
      localStorage.removeItem("access");
      localStorage.removeItem("user");
      localStorage.removeItem("company");
      setUser(null);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [setUser]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleMFAVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await verifyMFA({ email: formData.email, code: otpCode });
      handleLoginSuccess(data);
    } catch (err) {
      setError(err?.response?.data?.error || "Invalid security code.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (data) => {
    let targetPath = "/company-dashboard";
    if (data.user && data.user.role === "SUPERADMIN") {
      targetPath = "/platform-admin";
    } else if (data.user && data.user.role === "ADMIN") {
      targetPath = "/company-dashboard";
    } else if (data.user && data.user.role === "PROJECT_MANAGER") {
      targetPath = "/project-manager-dashboard";
    } else if (data.user && data.user.role === "EMPLOYEE") {
      targetPath = "/company-dashboard";
    }

    const expectedSubdomain = data.user.subdomain;
    const expectedHost = expectedSubdomain === "admin" || !expectedSubdomain
      ? "localhost"
      : `${expectedSubdomain}.localhost`;

    const currentHost = window.location.hostname;

    if (currentHost !== expectedHost) {
      const userStr = encodeURIComponent(JSON.stringify(data.user));
      window.location.href = `http://${expectedHost}:5173${targetPath}?access=${data.access}&user=${userStr}`;
    } else {
      navigate(targetPath);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(formData.email, formData.password);

      if (data.mfa_required) {
        setMfaRequired(true);
        return;
      }

      handleLoginSuccess(data);
    } catch (err) {
      const backendError = err?.response?.data?.detail || 
                           err?.response?.data?.non_field_errors?.[0] || 
                           (err?.response?.data && typeof err.response.data === 'object' ? Object.values(err.response.data)[0] : null);
      
      setError(backendError || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Background glow effects matching landing page */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#FF6B2C]/5 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-15%] right-[-5%] w-[45%] h-[45%] bg-[#FF6B2C]/5 rounded-full blur-[140px]"></div>
        <div className="absolute top-[30%] right-[20%] w-80 h-80 bg-[#FF6B2C]/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-[#FF6B2C] transition-colors gap-2 group">
            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to home 
          </Link>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white/10 overflow-hidden">
          <div className="p-10 md:p-12">
            <div className="text-center mb-10">
              <Link to="/" className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#FF6B2C] to-[#FF8533] rounded-[24px] shadow-xl shadow-[#FF6B2C]/20 mb-6 hover:scale-105 transition-transform">
                <span className="text-white text-3xl font-bold italic">B</span>
              </Link>
              <h2 className="text-4xl font-bold tracking-tighter italic mb-2 text-white">{mfaRequired ? "VERIFY" : "LOGIN"}</h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">
                {mfaRequired ? "Enter the 6-digit code from your app" : "Enter your credentials to continue"}
              </p>
            </div>

            {error && (
              <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm animate-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-tight">{error}</p>
                </div>
              </div>
            )}

            {!mfaRequired ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1 mb-2">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-700 focus:outline-none focus:border-[#FF6B2C]/40 transition-all font-bold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2 px-1">
                     <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Password</label>
                     <Link to="/forgot-password" size="sm" className="text-[10px] font-bold text-[#FF6B2C] hover:text-white transition uppercase tracking-widest">Forgot Password?</Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-700 focus:outline-none focus:border-[#FF6B2C]/40 transition-all font-bold"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-600 hover:text-white transition font-bold"
                    >
                      {showPassword ? "HIDE" : "SHOW"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#FF6B2C] to-[#FF8533] text-white font-bold py-5 rounded-2xl shadow-xl shadow-[#FF6B2C]/20 hover:shadow-[#FF6B2C]/40 transition-all duration-300 disabled:opacity-50 text-[10px] uppercase tracking-[0.3em] active:scale-95"
                >
                  {loading ? "LOGGING IN..." : "LOGIN"}
                </button>

                <div className="text-center pt-6 border-t border-white/5">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    Don't have an account?{" "}
                    <Link to="/signup" className="text-[#FF6B2C] hover:text-white font-bold transition">
                      Sign Up
                    </Link>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleMFAVerify} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1 mb-2">Authentication Code</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="000 000"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      maxLength={6}
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-center text-2xl tracking-[0.5em] placeholder-gray-700 focus:outline-none focus:border-[#FF6B2C]/40 transition-all font-black"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.length < 6}
                  className="w-full bg-gradient-to-r from-[#FF6B2C] to-[#FF8533] text-white font-bold py-5 rounded-2xl shadow-xl shadow-[#FF6B2C]/20 hover:shadow-[#FF6B2C]/40 transition-all duration-300 disabled:opacity-50 text-[10px] uppercase tracking-[0.3em] active:scale-95"
                >
                  {loading ? "VERIFYING..." : "VERIFY CODE"}
                </button>

                <button
                  type="button"
                  onClick={() => setMfaRequired(false)}
                  className="w-full text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition"
                >
                  Back to Login
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-8 text-center opacity-50">
           <p className="text-[9px] font-bold text-gray-600 uppercase tracking-[0.5em]">Binford Ltd • Secure Portal</p>
        </div>

      </div>
    </div>
  );
};

export default Login;