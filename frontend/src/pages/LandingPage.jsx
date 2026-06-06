import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LandingPage = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (user.role === "SUPERADMIN") navigate("/platform-admin");
      else if (user.role === "ADMIN") navigate("/company-dashboard");
      else if (user.role === "PROJECT_MANAGER") navigate("/project-manager-dashboard");
      else if (user.role === "EMPLOYEE") navigate("/employee-dashboard");
    }
  }, [isAuthenticated, user, loading, navigate]);

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 font-sans selection:bg-[#FF6B2C]/30 selection:text-[#FF6B2C] overflow-x-hidden relative">
      
      {/* --- RE-FIXED BACKGROUND & PLANETARY HORIZON LAYER SYSTEM --- */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle top grid texture pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_40%_at_50%_20%,#000_70%,transparent_100%)] opacity-70"></div>
        
        {/* Ambient Top Glow behind header text */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[400px] bg-gradient-to-b from-[#FF6B2C]/0.05 to-transparent blur-[100px]"></div>

        {/* THE VETRA SEMI-CIRCLE PLANETARY HORIZON
          Explicitly placed at 52vh to anchor directly behind the primary action buttons 
          and curve gracefully right under the header text.
        */}
        <div className="absolute top-[52vh] left-1/2 -translate-x-1/2 w-[220vw] sm:w-[170vw] lg:w-[130vw] aspect-[2.5/1] rounded-[100%] bg-gradient-to-t from-[#030303] via-[#0b0604] to-[#170a04]/40 border-t-[1.5px] border-[#FF6B2C]/35 shadow-[0_-20px_80px_rgba(255,107,44,0.15)] opacity-0 scale-[0.96] origin-top animate-[vetraHorizonReveal_1.8s_cubic-bezier(0.16,1,0.3,1)_0.2s_forwards]">
          {/* Volumetric atmosphere atmospheric fog mask immediately below the arc line */}
          <div className="absolute inset-x-0 top-0 h-[150px] bg-gradient-to-b from-[#FF6B2C]/12 via-[#FF6B2C]/0.01 to-transparent blur-[30px] rounded-[100%]"></div>
        </div>
      </div>

      {/* --- NAVBAR --- */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-6 max-w-7xl mx-auto opacity-0 animate-[fadeIn_0.8s_ease-out_0.2s_forwards]">
        {/* Brand Identity */}
        <div className="flex items-center gap-3.5 group cursor-pointer">
          <div className="h-10 w-10 bg-[#FF6B2C] rounded-[14px] flex items-center justify-center shadow-[0_0_25px_rgba(255,107,44,0.3)] hover:scale-105 transition-transform duration-300">
            <span className="text-white font-black italic text-xl tracking-tighter">B</span>
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-xl font-extrabold tracking-tight text-white leading-none">Binford</span>
            <span className="text-[10px] tracking-[0.25em] text-zinc-500 font-bold uppercase mt-1 leading-none">Enterprise</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-10 text-xs tracking-widest font-semibold text-zinc-400 uppercase">
          {["Features", "Solutions", "Pricing", "Contact"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-white transition-colors duration-200">
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200">
            Log in
          </Link>
          <Link to="/signup" className="bg-[#FF6B2C] hover:bg-[#e55a1f] text-white text-xs font-bold tracking-wider uppercase px-6 py-2.5 rounded-full shadow-lg shadow-[#FF6B2C]/10 transition-all duration-300">
            Sign up
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative z-10 pt-20 pb-16 px-6 flex flex-col items-center text-center">
        
        {/* Version Badge */}
        <div className="mb-8 inline-flex items-center gap-2 bg-zinc-950/80 border border-zinc-800/80 px-4 py-1.5 rounded-full text-xs font-medium backdrop-blur-md opacity-0 animate-[slideDown_0.6s_cubic-bezier(0.16,1,0.3,1)_0.4s_forwards]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C] animate-pulse"></span>
          <span className="text-zinc-400">Binford AI v2.0 is live</span>
          <span className="text-zinc-200 border-l border-zinc-800 pl-2 ml-1 cursor-pointer hover:text-white transition-colors">Read updates →</span>
        </div>

        {/* Main Title Heading */}
        <h1 className="text-5xl md:text-8xl font-black tracking-tight max-w-5xl leading-[1.05] mb-8 bg-gradient-to-b from-white via-zinc-100 to-zinc-500 bg-clip-text text-transparent opacity-0 translate-y-12 animate-[slideUp_1s_cubic-bezier(0.16,1,0.3,1)_0.5s_forwards]">
          Run Your Projects <br />On Autopilot
        </h1>

        {/* Subtitle Description */}
        <p className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl mb-12 font-normal leading-relaxed opacity-0 translate-y-6 animate-[slideUp_1s_cubic-bezier(0.16,1,0.3,1)_0.7s_forwards]">
          The intelligent tracking workspace for operations, teams, and resource management. Let an AI assistant map timelines, catch blockers, and update pipelines instantly.
        </p>

        {/* Action Button Matrix */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-36 opacity-0 translate-y-4 animate-[slideUp_1s_cubic-bezier(0.16,1,0.3,1)_0.9s_forwards]">
          <button className="w-full sm:w-auto px-8 py-4 rounded-full border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-md hover:bg-zinc-900/60 text-zinc-300 transition-all text-sm font-medium shadow-xl">
            Watch Demo
          </button>
          <Link to="/signup" className="w-full sm:w-auto bg-[#FF6B2C] hover:bg-[#e55a1f] text-white text-sm font-semibold px-10 py-4 rounded-full shadow-2xl shadow-[#FF6B2C]/20 transition-all">
            Get started for free
          </Link>
        </div>

        {/* --- HIGH FIDELITY DASHBOARD COMPONENT --- */}
        <div className="w-full max-w-5xl mx-auto opacity-0 translate-y-24 animate-[slideUp_1.4s_cubic-bezier(0.16,1,0.3,1)_1.1s_forwards]">
          <div className="relative bg-[#0b0b0c] border border-zinc-800/80 rounded-2xl shadow-[0_40px_140px_rgba(0,0,0,0.95)] p-1 overflow-hidden">
            <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#FF6B2C]/40 to-transparent"></div>
            
            <div className="bg-[#060608] rounded-[12px] p-6 sm:p-8 text-left">
              {/* Dashboard Internal Workspace Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-zinc-900 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FF6B2C]/10 border border-[#FF6B2C]/20 flex items-center justify-center text-[#FF6B2C] font-mono text-xs font-bold shadow-inner">AI</div>
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold text-zinc-200 tracking-tight">Workspace Cluster Tracker</div>
                    <div className="text-[10px] text-zinc-500 font-mono tracking-wider">NODE_STATUS // DEPLOYED_OPTIMAL</div>
                  </div>
                </div>
                <span className="text-[10px] tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-1.5 rounded-lg font-mono">
                  Sprint Status: 84% Completed
                </span>
              </div>

              {/* Data Cards Block */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                
                {/* Micro Metric Card 1 */}
                <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-xl p-5 flex flex-col justify-between h-36">
                  <span className="text-[10px] text-zinc-500 font-bold tracking-wider font-mono uppercase">Resource Saturation</span>
                  <div className="space-y-3">
                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#FF6B2C] to-orange-400 rounded-full animate-[barLoad75_1.5s_cubic-bezier(0.16,1,0.3,1)_forwards] origin-left"></div>
                    </div>
                    <div className="h-1.5 w-4/5 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-zinc-700/50 rounded-full animate-[barLoad50_1.5s_cubic-bezier(0.16,1,0.3,1)_forwards] origin-left"></div>
                    </div>
                  </div>
                </div>

                {/* Micro Metric Card 2 (Vetra Core Animated Chart Blocks) */}
                <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-xl p-5 flex flex-col justify-between h-36">
                  <span className="text-[10px] text-zinc-500 font-bold tracking-wider font-mono uppercase">Delivery Momentum</span>
                  <div className="h-14 w-full border-b border-l border-zinc-900/80 flex items-end gap-3 px-2">
                    <div className="w-full bg-[#FF6B2C]/20 rounded-sm animate-[barGrowOne_1.4s_cubic-bezier(0.16,1,0.3,1)_forwards] origin-bottom"></div>
                    <div className="w-full bg-[#FF6B2C]/40 rounded-sm animate-[barGrowTwo_1.4s_cubic-bezier(0.16,1,0.3,1)_forwards] origin-bottom"></div>
                    <div className="w-full bg-[#FF6B2C] rounded-sm animate-[barGrowThree_1.4s_cubic-bezier(0.16,1,0.3,1)_forwards] origin-bottom"></div>
                  </div>
                </div>

                {/* Micro Metric Card 3 */}
                <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-xl p-5 flex flex-col justify-between h-36">
                  <span className="text-[10px] text-zinc-500 font-bold tracking-wider font-mono uppercase">Assistant Chronicler</span>
                  <div className="text-[11px] space-y-2 font-mono">
                    <p className="text-emerald-500 flex items-center gap-2"><span>✓</span> Timeline optimized</p>
                    <p className="text-amber-500 flex items-center gap-2"><span>!</span> Capacity warning isolated</p>
                    <p className="text-zinc-600 flex items-center gap-2"><span>...</span> Processing status</p>
                  </div>
                </div>
              </div>

              {/* Integrated Bottom Operational Log */}
              <div className="bg-zinc-900/10 border border-zinc-900/50 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3.5 text-[10px] text-zinc-500 font-bold tracking-widest font-mono uppercase">
                  <span>Active Automation Pipeline</span>
                  <span className="text-[#FF6B2C] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#FF6B2C] rounded-full animate-ping"></span> Live Syncing
                  </span>
                </div>
                <div className="space-y-2.5">
                  {[
                    { n: "Core infrastructure scaling & indexing parameters", s: "Processing", c: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
                    { n: "Project milestone auto-generation sequences", s: "Completed", c: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
                    { n: "Resource bottleneck predictive machine matrix", s: "Standby", c: "bg-zinc-900 text-zinc-500 border-zinc-800" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-[#030304]/60 p-3 rounded-lg border border-zinc-900/60 hover:border-zinc-800/80 transition-colors duration-300">
                      <span className="text-zinc-400 truncate max-w-[70%] sm:max-w-[80%]">{item.n}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono border ${item.c}`}>{item.s}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section id="features" className="relative z-10 py-32 px-6 max-w-7xl mx-auto border-t border-zinc-900/40">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-5">Built for Absolute Clarity</h2>
          <p className="text-zinc-400 max-w-xl mx-auto text-base sm:text-lg">Focus on high-level strategy while Binford Enterprise handles the tracking and operational updates.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { t: "Automated Tracking", d: "Your AI assistant cross-references commits, docs, and notes to update project status smoothly." },
            { t: "Predictive Blockers", d: "Identify scheduling risks and capacity issues days before they affect your delivery deadlines." },
            { t: "Resource Mapping", d: "Seamlessly align tasks to team availability to balance workloads and ensure delivery speed." }
          ].map((f, i) => (
            <div key={i} className="p-8 rounded-2xl bg-zinc-900/10 border border-zinc-900/60 hover:border-zinc-700/80 transition-all duration-300 group">
              <div className="w-9 h-9 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded-lg mb-6 flex items-center justify-center font-mono text-xs group-hover:text-[#FF6B2C] group-hover:border-[#FF6B2C]/30 transition-colors">
                // 0{i+1}
              </div>
              <h3 className="text-lg font-bold text-zinc-100 mb-3">{f.t}</h3>
              <p className="text-zinc-500 leading-relaxed text-sm">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- FOOTER ENGINE --- */}
      <footer className="relative z-10 border-t border-zinc-900/60 pt-16 pb-10 px-6 max-w-7xl mx-auto text-center text-zinc-600 text-xs">
        <p>© 2026 Binford Enterprise Inc. All operational parameters reserved.</p>
      </footer>

      {/* --- RE-CONNECTED TRANSITIONS ENGINE --- */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(35px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-15px); } to { opacity: 1; transform: translateY(0); } }
        
        /* CORRECTED PLANETARY ARC REVEAL ENGINE */
        @keyframes vetraHorizonReveal {
          from { 
            opacity: 0; 
            transform: translate(-50%, 40px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translate(-50%, 0) scale(1); 
          }
        }

        /* CARD DATA ANIMATION LOADING HOOKS */
        @keyframes barLoad75 { from { width: 0%; } to { width: 75%; } }
        @keyframes barLoad50 { from { width: 0%; } to { width: 50%; } }
        @keyframes barGrowOne { from { height: 0%; } to { height: 35%; } }
        @keyframes barGrowTwo { from { height: 0%; } to { height: 58%; } }
        @keyframes barGrowThree { from { height: 0%; } to { height: 85%; } }
      `}} />
    </div>
  );
};

export default LandingPage;