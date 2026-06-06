import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signupCompany } from "../api/signup";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    company_name: "",
    subdomain: "",
    manager_name: "",
    manager_email: "",
    password: "",
    confirm_password: "",
    subscription_plan: "BASE",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.password.trim()) {
      setError("Password is required.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const registrationPayload = {
        ...formData,
        razorpay_payment_id: "pay_dummy123456789",
        razorpay_order_id: "order_dummy123456789",
        razorpay_signature: "dummy_signature_for_testing",
      };

      const result = await signupCompany(registrationPayload);
      setSuccess(`${result.message} Subdomain: ${result.subdomain}.localhost`);
      setTimeout(() => { navigate("/login"); }, 2500);
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white flex flex-col items-center justify-center p-4 py-12 font-sans relative overflow-hidden select-none">
      
      {/* ─── DYNAMIC COSMIC BACKGROUND NEBULA LAYER (Matching Login UI) ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Giant Left-Side Flared Glowing Orb */}
        <motion.div 
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.36, 0.3],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-[-25%] left-[-25%] w-[85vw] h-[85vw] max-w-[1000px] rounded-full bg-gradient-to-br from-[#ff7a38]/25 via-[#ca4a15]/10 to-transparent blur-[140px] mix-blend-screen opacity-35" 
        />
        
        {/* Secondary Core Warm Light Core Glow */}
        <div className="absolute top-[5%] left-[-10%] w-[45vw] h-[45vw] max-w-[500px] rounded-full bg-[#e1571d]/10 blur-[100px] mix-blend-color-dodge" />

        {/* Bottom Right Blue Backdrop Depth */}
        <div className="absolute bottom-[-15%] right-[-10%] w-[65vw] h-[65vw] max-w-[800px] rounded-full bg-gradient-to-tl from-[#1d4ed8]/8 via-[#1e1b4b]/15 to-transparent blur-[150px]" />

        {/* Deep Space Tiny Starfield Matrix Particles Pattern */}
        <div className="absolute inset-0 opacity-[0.35] mix-blend-screen bg-repeat bg-center" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Ccircle cx='15' cy='25' r='1' fill='%23ffffff' opacity='0.5'/%3E%3Ccircle cx='80' cy='20' r='1.2' fill='%23ffffff' opacity='0.7'/%3E%3Ccircle cx='115' cy='65' r='0.8' fill='%2393c5fd' opacity='0.4'/%3E%3Ccircle cx='40' cy='90' r='1' fill='%23ffffff' opacity='0.6'/%3E%3Ccircle cx='95' cy='110' r='1.5' fill='%23ffffff' opacity='0.8'/%3E%3C/svg%3E")` }} />

        {/* Distant Twinkling Stars */}
        <motion.div animate={{ opacity: [0.2, 0.8, 0.2] }} transition={{ duration: 6, repeat: Infinity }} className="absolute bottom-[20%] left-[15%] w-1 h-1 bg-white rounded-full shadow-[0_0_8px_#fff]" />
        <motion.div animate={{ opacity: [0.3, 0.9, 0.3] }} transition={{ duration: 5, repeat: Infinity, delay: 1.5 }} className="absolute top-[15%] right-[25%] w-1.5 h-1.5 bg-blue-300 rounded-full shadow-[0_0_10px_#93c5fd]" />
      </div>

      {/* ─── MAIN SIGNUP INTERFACE BLOCK ─── */}
      <div className="w-full max-w-4xl relative z-10 flex flex-col gap-4">
        
        {/* Back Link Router Toggle */}
        <div className="self-start pl-2">
          <Link to="/" className="inline-flex items-center text-[10px] font-bold uppercase tracking-[0.25em] text-[#6b6b72] hover:text-[#e1571d] transition-colors duration-300 gap-2 group">
            <svg className="w-3.5 h-3.5 transform group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to home
          </Link>
        </div>

        {/* ─── EXPANDED GLASSMORPHISM CARD CONTAINER ─── */}
        <motion.div 
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 95, damping: 24 }}
          className="bg-[#141416]/50 backdrop-blur-[40px] rounded-[32px] border border-white/[0.07] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.9)] overflow-hidden"
        >
          <div className="p-8 sm:p-12 md:p-14">
            
            {/* Header Titles */}
            <div className="mb-10 text-center">
              <Link to="/" className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#e1571d] to-[#eb6932] rounded-[20px] shadow-xl shadow-[#e1571d]/20 mb-4 hover:scale-105 transition-transform duration-300">
                <span className="text-white text-2xl font-bold italic">B</span>
              </Link>
              <h2 className="text-[28px] font-semibold tracking-tight text-white mb-1">Create your Account</h2>
              <p className="text-[12px] text-[#86868d] font-normal tracking-wide">Enter your core criteria details to launch registration</p>
            </div>

            {/* Error and Success Notifications Blocks */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: "auto", scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-400"
                >
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: "auto", scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400"
                >
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Registration Input Form Pipeline */}
            <form onSubmit={handleSubmit} className="space-y-10">
              
              {/* SECTION 1: Corporate Profile info */}
              <div className="space-y-5">
                <h3 className="text-[11px] font-semibold text-[#e1571d] uppercase tracking-[0.3em] border-b border-white/[0.04] pb-3">01. Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input label="Company Name" name="company_name" value={formData.company_name} onChange={handleChange} placeholder="e.g. Acme Corp" required />
                  <div className="space-y-2">
                    <label className="block text-[11px] font-medium text-[#86868d] pl-0.5 tracking-wide">Subdomain</label>
                    <div className="relative">
                       <input 
                         type="text" 
                         name="subdomain" 
                         value={formData.subdomain} 
                         onChange={handleChange} 
                         className="w-full px-4 py-3 bg-[#1d1d20]/45 hover:bg-[#1d1d20]/75 border border-white/[0.04] rounded-xl text-[14px] text-white placeholder-[#4b4b50] focus:outline-none focus:border-[#e1571d]/60 focus:bg-[#1d1d20]/90 transition-all duration-300" 
                         placeholder="my-company" 
                         required 
                       />
                       <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[#4b4b50] uppercase tracking-wider">.binford.com</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Identity Credentials */}
              <div className="space-y-5">
                <h3 className="text-[11px] font-semibold text-[#e1571d] uppercase tracking-[0.3em] border-b border-white/[0.04] pb-3">02. Administrator Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input label="Full Name" name="manager_name" value={formData.manager_name} onChange={handleChange} placeholder="Fahim" required />
                  <Input label="Email Address" name="manager_email" type="email" value={formData.manager_email} onChange={handleChange} placeholder="design.fahim@proton.me" required />
                  
                  {/* Password block container */}
                  <div className="relative">
                    <Input label="Password" name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} minLength={8} placeholder="••••••••••••" required />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-4 bottom-3.5 text-[#61616a] hover:text-gray-300 transition-colors"
                    > 
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />} 
                    </button>
                  </div>
                  
                  {/* Confirm Password block container */}
                  <div className="relative">
                    <Input label="Confirm Password" name="confirm_password" type={showConfirmPassword ? "text" : "password"} value={formData.confirm_password} onChange={handleChange} minLength={8} placeholder="••••••••••••" required />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                      className="absolute right-4 bottom-3.5 text-[#61616a] hover:text-gray-300 transition-colors"
                    > 
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />} 
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Strategy Tier Layout Cards */}
              <div className="space-y-5">
                <h3 className="text-[11px] font-semibold text-[#e1571d] uppercase tracking-[0.3em] border-b border-white/[0.04] pb-3">03. Select Plan</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { value: "BASE", name: "Basic", price: "$29", features: ["10 Users", "Basic Features"] },
                    { value: "PLUS", name: "Plus", price: "$79", features: ["50 Users", "Advanced Features"] },
                    { value: "PRO", name: "Pro", price: "$149", features: ["Unlimited Users", "Premium Features"] }
                  ].map((plan) => (
                    <label 
                      key={plan.value} 
                      className={`relative cursor-pointer transition-all duration-300 border rounded-2xl p-5 text-center flex flex-col items-center justify-center ${
                        formData.subscription_plan === plan.value 
                          ? 'border-[#e1571d] bg-[#e1571d]/5 shadow-[0_10px_30px_rgba(225,87,29,0.15)]' 
                          : 'border-white/[0.04] bg-[#1d1d20]/30 hover:border-white/20'
                      }`}
                    >
                      <input type="radio" name="subscription_plan" value={plan.value} checked={formData.subscription_plan === plan.value} onChange={handleChange} className="hidden" />
                      <div className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-1">{plan.name}</div>
                      <div className="text-3xl font-bold tracking-tight text-[#e1571d]">{plan.price}</div>
                      <div className="text-[9px] text-gray-500 font-medium uppercase mt-0.5 tracking-wider">Per Month</div>
                      <div className="mt-4 space-y-1.5 border-t border-white/[0.03] pt-3 w-full">
                        {plan.features.map((f, i) => <div key={i} className="text-[10px] font-normal text-gray-400">{f}</div>)}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Trigger Actions CTA */}
              <motion.button 
                whileTap={{ scale: 0.99 }}
                type="submit" 
                disabled={loading} 
                className="w-full mt-4 relative overflow-hidden group bg-gradient-to-r from-[#e1571d] to-[#eb6932] text-white font-medium py-3.5 rounded-xl shadow-[0_4px_25px_rgba(225,87,29,0.25)] hover:shadow-[0_4px_30px_rgba(225,87,29,0.45)] transition-all duration-300 disabled:opacity-50 text-[14px]"
              >
                <span className="relative z-10">{loading ? "Creating Account..." : "Create Account"}</span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-[#eb6932] to-[#e1571d] transition-transform duration-500 ease-out" />
              </motion.button>

              {/* Backtrack Destination Routing Anchor */}
              <div className="text-center pt-6 border-t border-white/[0.04]">
                <p className="text-[13px] font-normal text-gray-500">
                  Already have an account?{" "}
                  <Link to="/login" className="text-gray-300 hover:text-[#e1571d] font-medium underline underline-offset-4 transition-colors">
                    Login here
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Lower Core Metadata Branding Label */}
        <div className="text-center mt-1 opacity-25">
          <p className="text-[9px] font-medium text-gray-400 uppercase tracking-[0.45em]">Binford Ltd • Secure Portal</p>
        </div>

      </div>
    </div>
  );
};

/* Internal Glassmorphic Pure UI Input Sub-Tray Molecule Component */
const Input = ({ label, ...props }) => (
  <div className="space-y-2 w-full">
    <label className="block text-[11px] font-medium text-[#86868d] pl-0.5 tracking-wide">{label}</label>
    <input 
      {...props} 
      className="w-full px-4 py-3 bg-[#1d1d20]/45 hover:bg-[#1d1d20]/75 border border-white/[0.04] rounded-xl text-[14px] text-white placeholder-[#4b4b50] focus:outline-none focus:border-[#e1571d]/60 focus:bg-[#1d1d20]/90 transition-all duration-300" 
    />
  </div>
);

export default Signup;
