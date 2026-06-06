import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

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

    if (!formData.password.trim()) {
      setError("Password is required.");
      return;
    }

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
    <div className="min-h-screen bg-[#0b0b0d] text-white flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden select-none">
      
      {/* ─── DYNAMIC COSMIC BACKGROUND NEBULA LAYER ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        
        {/* Giant Left-Side Flared Glowing Orb (Replicating the blurred light arc in your reference) */}
        <motion.div 
          animate={{
            scale: [1, 1.06, 1],
            opacity: [0.3, 0.38, 0.3],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-[-20%] left-[-35%] w-[90vw] h-[90vw] max-w-[1000px] rounded-full bg-gradient-to-br from-[#ff7a38] via-[#ca4a15]/30 to-transparent blur-[130px] mix-blend-screen opacity-30" 
        />
        
        {/* Supporting Secondary Warm Core Ring Glow */}
        <div className="absolute top-[10%] left-[-15%] w-[50vw] h-[50vw] max-w-[500px] rounded-full bg-[#e1571d]/15 blur-[90px] mix-blend-color-dodge" />

        {/* Ambient Right Bottom Blue Deep Space Backdrop */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] max-w-[700px] rounded-full bg-gradient-to-tl from-[#1d4ed8]/10 via-[#1e1b4b]/20 to-transparent blur-[140px]" />

        {/* Deep Space Tiny Starfield Matrix Particles */}
        <div className="absolute inset-0 opacity-40 mix-blend-screen bg-repeat bg-center" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Ccircle cx='10' cy='20' r='1' fill='%23ffffff' opacity='0.5'/%3E%3Ccircle cx='75' cy='15' r='1.2' fill='%23ffffff' opacity='0.7'/%3E%3Ccircle cx='110' cy='60' r='0.8' fill='%2393c5fd' opacity='0.4'/%3E%3Ccircle cx='35' cy='85' r='1' fill='%23ffffff' opacity='0.6'/%3E%3Ccircle cx='90' cy='105' r='1.5' fill='%23ffffff' opacity='0.8'/%3E%3C/svg%3E")` }} />

        {/* Animated Sharp Feature Clusters (Distant Pulsing Stars) */}
        <motion.div animate={{ opacity: [0.2, 0.7, 0.2] }} transition={{ duration: 5, repeat: Infinity }} className="absolute bottom-[15%] left-[20%] w-1 h-1 bg-white rounded-full shadow-[0_0_8px_#fff]" />
        <motion.div animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }} className="absolute top-[25%] right-[20%] w-1.5 h-1.5 bg-blue-300 rounded-full shadow-[0_0_10px_#93c5fd]" />
        <motion.div animate={{ opacity: [0.1, 0.6, 0.1] }} transition={{ duration: 7, repeat: Infinity, delay: 2.5 }} className="absolute bottom-[35%] right-[12%] w-1 h-1 bg-white rounded-full shadow-[0_0_6px_#fff]" />
      </div>

      {/* ─── MAIN APP CONTENT INTERFACE CONTEXT ─── */}
      <div className="w-full max-w-[430px] relative z-10 flex flex-col gap-4">
        
        {/* Upper Directional Routing Button */}
        <div className="self-start pl-2">
          <Link to="/" className="inline-flex items-center text-[10px] font-bold uppercase tracking-[0.25em] text-[#6b6b72] hover:text-[#e1571d] transition-colors duration-300 gap-2 group">
            <svg className="w-3.5 h-3.5 transform group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to home 
          </Link>
        </div>

        {/* ─── CENTRAL GLASSMORPHISM CONTROLLER CONTAINER ─── */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 22 }}
          className="bg-[#141416]/55 backdrop-blur-[40px] rounded-[32px] border border-white/[0.07] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.9)] overflow-hidden"
        >
          <div className="p-9 sm:p-11">
            
            {/* Header Titles */}
            <div className="mb-8 text-left">
              <h2 className="text-[26px] font-semibold tracking-tight text-white mb-1">
                {mfaRequired ? "Security Verification" : "Welcome Back"}
              </h2>
              <p className="text-[12px] text-[#86868d] font-normal tracking-wide">
                {mfaRequired ? "Enter your 6-digit verification app code" : "Enter your credentials to continue"}
              </p>
            </div>

            {/* Application Feedback Error Banner */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: "auto", scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-400 shadow-inner"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Smooth Layout Morph State Engine */}
            <AnimatePresence mode="wait">
              {!mfaRequired ? (
                <motion.form 
                  key="credential-login-view"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  onSubmit={handleSubmit} 
                  className="space-y-5"
                >
                  {/* Email Input Field */}
                  <div>
                    <label className="block text-[11px] font-medium text-[#86868d] mb-2 pl-0.5 tracking-wide">Email </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="name@company.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#1d1d20]/45 hover:bg-[#1d1d20]/75 border border-white/[0.04] rounded-xl text-[14px] text-white placeholder-[#4b4b50] focus:outline-none focus:border-[#e1571d]/60 focus:bg-[#1d1d20]/90 transition-all duration-300"
                      required
                    />
                  </div>

                  {/* Password Input Field */}
                  <div>
                    <label className="block text-[11px] font-medium text-[#86868d] mb-2 pl-0.5 tracking-wide">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="••••••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#1d1d20]/45 hover:bg-[#1d1d20]/75 border border-white/[0.04] rounded-xl text-[14px] text-white placeholder-[#4b4b50] focus:outline-none focus:border-[#e1571d]/60 focus:bg-[#1d1d20]/90 transition-all duration-300 tracking-widest"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#61616a] hover:text-gray-300 transition-colors duration-200"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Support Option Flag */}
                  <div className="text-left pt-0.5">
                    <Link to="/forgot-password" className="text-[12px] font-normal text-gray-400 hover:text-[#e1571d] transition-colors duration-200">
                      Forget Password ?
                    </Link>
                  </div>

                  {/* Primary Authenticate Action Trigger */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 relative overflow-hidden group bg-gradient-to-r from-[#e1571d] to-[#eb6932] text-white font-medium py-3 rounded-xl shadow-[0_4px_25px_rgba(225,87,29,0.25)] hover:shadow-[0_4px_30px_rgba(225,87,29,0.45)] transition-all duration-300 disabled:opacity-50 text-[14px]"
                  >
                    <span className="relative z-10">{loading ? "Logging in..." : "Login in"}</span>
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-[#eb6932] to-[#e1571d] transition-transform duration-500 ease-out" />
                  </motion.button>

                  {/* Federated Single Sign On Blocks */}
                  <div className="space-y-3 pt-3">
                    <button type="button" className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#111113]/90 hover:bg-[#17171a] border border-white/[0.04] rounded-xl text-xs font-medium text-gray-200 transition-all duration-300 active:scale-[0.99]">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.256-3.133C18.435 1.208 15.618 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.854 11.57-11.77 0-.795-.085-1.4-.195-1.945H12.24z"/>
                      </svg>
                      Sign in with Google
                    </button>

                    <button type="button" className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#111113]/90 hover:bg-[#17171a] border border-white/[0.04] rounded-xl text-xs font-medium text-gray-200 transition-all duration-300 active:scale-[0.99]">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z"/>
                      </svg>
                      Sign in with Apple
                    </button>
                  </div>

                  {/* Downward Navigation Anchor */}
                  <div className="text-center pt-4 text-[12px] text-gray-500 font-normal">
                    New to Spotify?{" "}
                    <Link to="/signup" className="text-gray-300 hover:text-[#e1571d] font-medium underline underline-offset-4 transition-colors">
                      Create a new account here
                    </Link>
                  </div>
                </motion.form>
              ) : (
                <motion.form 
                  key="mfa-verification-view"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  onSubmit={handleMFAVerify} 
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-xs font-medium text-[#86868d] mb-4 text-center uppercase tracking-wider">Authentication Code</label>
                    <input
                      type="text"
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      maxLength={6}
                      className="w-full px-4 py-3.5 bg-[#1d1d20]/50 border border-white/[0.04] rounded-xl text-white text-center text-2xl tracking-[0.45em] font-bold focus:outline-none focus:border-[#e1571d]/60 focus:bg-[#1d1d20]/90 transition-all duration-300"
                      required
                      autoFocus
                    />
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading || otpCode.length < 6}
                    className="w-full bg-gradient-to-r from-[#e1571d] to-[#eb6932] text-white font-medium py-3 rounded-xl shadow-[0_4px_25px_rgba(225,87,29,0.25)] hover:shadow-[0_4px_30px_rgba(225,87,29,0.45)] transition-all duration-300 disabled:opacity-50 text-[14px]"
                  >
                    {loading ? "Verifying..." : "Verify Code"}
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => setMfaRequired(false)}
                    className="w-full text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors duration-200 uppercase tracking-widest text-center block"
                  >
                    Back to Login
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ─── DOCK-STYLE MOBILE FOOTER MARKETS ─── */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 90, damping: 20, delay: 0.12 }}
          className="bg-[#141416]/30 backdrop-blur-[25px] rounded-[22px] border border-white/[0.04] p-2.5 flex items-center justify-center gap-2.5"
        >
          {/* Play Market link */}
          <a href="#playstore" className="flex-1 flex items-center justify-center gap-2.5 py-2 px-3 bg-[#1c1c1f]/40 hover:bg-[#1c1c1f]/80 border border-white/[0.01] rounded-xl transition-all duration-300 group">
            <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.609 1.814L13.783 12 3.609 22.186c-.183-.163-.302-.397-.302-.667V2.481c0-.27.119-.504.302-.667zM14.491 12.7l3.14 3.139-12.76 7.34c-.214.123-.472.083-.642-.089L14.491 12.7zm3.896-1.396l3.366-1.936c.404-.232.404-.776 0-1.008l-3.366-1.936-3.23 3.23 3.23 3.23zm-3.896-1.908L4.229.71c.17-.172.428-.212.642-.089l12.76 7.34-3.14 3.139z"/>
            </svg>
            <div className="text-left leading-none">
              <span className="text-[8px] text-gray-500 block uppercase font-bold tracking-tight">Get it on</span>
              <span className="text-[11px] font-semibold text-gray-300 block mt-0.5">Google Play</span>
            </div>
          </a>

          {/* iOS App store link */}
          <a href="#appstore" className="flex-1 flex items-center justify-center gap-2.5 py-2 px-3 bg-[#1c1c1f]/40 hover:bg-[#1c1c1f]/80 border border-white/[0.01] rounded-xl transition-all duration-300 group">
            <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z"/>
            </svg>
            <div className="text-left leading-none">
              <span className="text-[8px] text-gray-500 block uppercase font-bold tracking-tight">Download on the</span>
              <span className="text-[11px] font-semibold text-gray-300 block mt-0.5">App Store</span>
            </div>
          </a>
        </motion.div>

        {/* Lower Meta Copyright Brand Flag */}
        <div className="text-center mt-1 opacity-30">
          <p className="text-[9px] font-medium text-gray-400 uppercase tracking-[0.45em]">Binford Ltd • Secure Portal</p>
        </div>

      </div>
    </div>
  );
};

export default Login;
