import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getPlatformDashboard } from "../api/platform";

const PlatformDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total_tenants: 0, active: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getPlatformDashboard();
        setStats(data.stats);
      } catch (error) {
        console.error("Error fetching platform stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

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
        <div className="relative rounded-[40px] bg-white/5 backdrop-blur-xl border border-white/10 p-10 md:p-14 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-[#FF6B2C]/10 to-transparent blur-3xl"></div>
          <div className="relative z-10 space-y-4">
            <span className="inline-flex items-center gap-2 text-[#FF6B2C] bg-[#FF6B2C]/10 text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-[#FF6B2C]/20">
              Nexus Terminal
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
              Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B2C] to-[#FF8533]">Dashboard</span>
            </h1>
            <p className="text-gray-400 max-w-xl font-medium leading-relaxed">
              Welcome back, <span className="text-[#FF6B2C] font-bold">{user?.name || user?.email}</span>. 
              Overseeing the global multi-tenant architecture and ecosystem health.
            </p>
          </div>
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          <MetricCard label="Total Tenants" value={loading ? "—" : stats.total_tenants} icon="🏢" />
          <MetricCard label="Active Tenants" value={loading ? "—" : stats.active} icon="⚡" accent="text-blue-500" />
        </div>

        {/* --- PANEL --- */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 md:p-12 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black tracking-tight">Recent Companies</h2>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 font-mono">Real-time Feed</span>
          </div>

          <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[32px] text-gray-600 font-black uppercase tracking-widest backdrop-blur-xl">
            Tenant synchronization matrix offline
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, icon, accent = "text-white" }) => (
  <div className="rounded-[40px] bg-white/5 border border-white/10 p-10 backdrop-blur-xl shadow-xl transition-all duration-500 hover:scale-[1.03] hover:border-[#FF6B2C]/20">
    <div className="flex items-center justify-between mb-4">
       <span className="text-3xl">{icon}</span>
       <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</p>
    </div>
    <p className={`text-5xl font-black tracking-tighter ${accent}`}>{value}</p>
  </div>
);

export default PlatformDashboard;