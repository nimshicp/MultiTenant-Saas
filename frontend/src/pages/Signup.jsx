import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signupCompany } from "../api/signup";

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
    <div className="min-h-screen bg-[#0A0A0F] text-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Background glow effects matching landing page */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#FF6B2C]/5 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-15%] right-[-5%] w-[45%] h-[45%] bg-blue-500/5 rounded-full blur-[140px]"></div>
      </div>

      <div className="w-full max-w-4xl relative z-10">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-[#FF6B2C] transition-colors gap-2 group">
            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to home
          </Link>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white/10 overflow-hidden">
          <div className="p-10 md:p-14">
            <div className="text-center mb-12">
              <Link to="/" className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#FF6B2C] to-[#FF8533] rounded-[24px] shadow-xl shadow-[#FF6B2C]/20 mb-6 hover:scale-105 transition-transform">
                <span className="text-white text-3xl font-bold italic">B</span>
              </Link>
              <h2 className="text-4xl font-bold tracking-tighter italic mb-3">SIGN UP</h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Create your company account</p>
            </div>

            {error && (
              <div className="mb-8 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400 uppercase tracking-widest animate-in slide-in-from-top-2">{error}</div>
            )}
            {success && (
              <div className="mb-8 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-widest animate-in slide-in-from-top-2">{success}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-6">
                <h3 className="text-[10px] font-bold text-[#FF6B2C] uppercase tracking-[0.4em] border-b border-white/5 pb-4">01. Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Company Name" name="company_name" value={formData.company_name} onChange={handleChange} required />
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Subdomain</label>
                    <div className="relative">
                       <input type="text" name="subdomain" value={formData.subdomain} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-[#FF6B2C]/40 outline-none" placeholder="my-company" required />
                       <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-600 uppercase">.binford.com</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-[10px] font-bold text-[#FF6B2C] uppercase tracking-[0.4em] border-b border-white/5 pb-4">02. Administrator Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Full Name" name="manager_name" value={formData.manager_name} onChange={handleChange} required />
                  <Input label="Email Address" name="manager_email" type="email" value={formData.manager_email} onChange={handleChange} required />
                  <div className="relative">
                    <Input label="Password" name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} minLength={8} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 bottom-4 text-[10px] font-bold text-gray-600 hover:text-white transition"> {showPassword ? "HIDE" : "SHOW"} </button>
                  </div>
                  <div className="relative">
                    <Input label="Confirm Password" name="confirm_password" type={showConfirmPassword ? "text" : "password"} value={formData.confirm_password} onChange={handleChange} minLength={8} required />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-5 bottom-4 text-[10px] font-bold text-gray-600 hover:text-white transition"> {showConfirmPassword ? "HIDE" : "SHOW"} </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-[10px] font-bold text-[#FF6B2C] uppercase tracking-[0.4em] border-b border-white/5 pb-4">03. Select Plan</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    { value: "BASE", name: "Basic", price: "$29", features: ["10 Users", "Basic Features"] },
                    { value: "PLUS", name: "Plus", price: "$79", features: ["50 Users", "Advanced Features"] },
                    { value: "PRO", name: "Pro", price: "$149", features: ["Unlimited Users", "Premium Features"] }
                  ].map((plan) => (
                    <label key={plan.value} className={`cursor-pointer transition-all duration-500 border-2 rounded-[32px] p-6 text-center ${formData.subscription_plan === plan.value ? 'border-[#FF6B2C] bg-[#FF6B2C]/5 shadow-xl shadow-[#FF6B2C]/10' : 'border-white/5 bg-white/5 hover:border-white/20'}`}>
                      <input type="radio" name="subscription_plan" value={plan.value} checked={formData.subscription_plan === plan.value} onChange={handleChange} className="hidden" />
                      <div className="text-[10px] font-bold text-white uppercase tracking-widest mb-2">{plan.name}</div>
                      <div className="text-3xl font-bold tracking-tighter text-[#FF6B2C]">{plan.price}</div>
                      <div className="text-[9px] text-gray-600 uppercase font-bold mt-1">Per Month</div>
                      <div className="mt-4 space-y-1">
                        {plan.features.map((f, i) => <div key={i} className="text-[9px] font-bold text-gray-500 uppercase">{f}</div>)}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#FF6B2C] to-[#FF8533] text-white font-bold py-6 rounded-2xl shadow-xl shadow-[#FF6B2C]/20 hover:shadow-[#FF6B2C]/40 transition-all duration-300 disabled:opacity-50 text-[10px] uppercase tracking-[0.3em] active:scale-95">
                {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
              </button>

              <div className="text-center pt-8 border-t border-white/5">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Already have an account? <Link to="/login" className="text-[#FF6B2C] hover:text-white transition">Login</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const Input = ({ label, ...props }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{label}</label>
    <input {...props} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-[#FF6B2C]/40 outline-none transition-all placeholder-gray-700" />
  </div>
);


export default Signup;