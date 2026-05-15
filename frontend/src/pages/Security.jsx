import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import api from "../api/axios";

const Security = () => {
  const [loading, setLoading] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [otpUri, setOtpUri] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [step, setStep] = useState(1); // 1: Status, 2: Setup

  const fetchMfaStatus = async () => {
    try {
      const res = await api.get("/auth/mfa/setup/");
      setMfaEnabled(res.data.mfa_enabled);
      setOtpUri(res.data.otp_uri);
    } catch (err) {
      setError("Failed to load security settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMfaStatus();
  }, []);

  // Auto-dismiss alerts
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

  const handleVerifySetup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/mfa/verify-setup/", { code: verificationCode });
      setSuccess("Multi-factor authentication enabled successfully!");
      setMfaEnabled(true);
      setStep(1);
    } catch (err) {
      setError(err?.response?.data?.error || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && step === 1) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-[#FF6B2C] font-black tracking-[0.5em] animate-pulse uppercase">Syncing Security Matrix...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-12 font-sans relative overflow-hidden">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#FF6B2C]/5 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[-15%] right-[-5%] w-[45%] h-[45%] bg-blue-500/5 rounded-full blur-[140px]"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="relative rounded-[40px] bg-white/5 backdrop-blur-xl border border-white/10 p-10 md:p-14 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-[#FF6B2C]/10 to-transparent blur-3xl"></div>
          <div className="relative z-10 space-y-4">
            <span className="inline-flex items-center gap-2 text-[#FF6B2C] bg-[#FF6B2C]/10 text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-[#FF6B2C]/20">
              Identity Protection
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
              Security <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B2C] to-[#FF8533]">Protocols</span>
            </h1>
            <p className="text-gray-400 max-w-xl font-medium leading-relaxed">
              Manage your authentication layers and secure your access to the platform matrix.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-500/10 p-4 text-[10px] font-bold text-red-400 border border-red-500/20 uppercase tracking-widest animate-in slide-in-from-top-2">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-2xl bg-emerald-500/10 p-4 text-[10px] font-bold text-emerald-400 border border-emerald-500/20 uppercase tracking-widest animate-in slide-in-from-top-2">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8">
          {/* MFA Status Card */}
          <div className="rounded-[40px] bg-white/5 border border-white/10 p-10 backdrop-blur-xl shadow-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <div className={`w-3 h-3 rounded-full ${mfaEnabled ? "bg-emerald-500 shadow-[0_0_12px_#10b981]" : "bg-red-500 shadow-[0_0_12px_#ef4444]"}`}></div>
                  <h2 className="text-2xl font-black tracking-tight uppercase">Multi-Factor Authentication</h2>
                </div>
                <p className="text-gray-500 text-sm font-medium max-w-md">
                  Adds an extra layer of security to your account by requiring a code from your authenticator app in addition to your password.
                </p>
              </div>

              {!mfaEnabled ? (
                <button 
                  onClick={() => setStep(2)}
                  className="px-10 py-5 bg-[#FF6B2C] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#FF8533] transition-all active:scale-95 shadow-xl shadow-[#FF6B2C]/20"
                >
                  Enable Protection
                </button>
              ) : (
                <div className="px-10 py-5 bg-white/5 border border-white/10 text-emerald-400 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px]">
                  Shield Active
                </div>
              )}
            </div>

            {/* Setup View */}
            {step === 2 && (
              <div className="mt-12 pt-12 border-t border-white/5 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-black uppercase tracking-tight text-[#FF6B2C]">Step 1: Scan QR Code</h3>
                      <p className="text-sm text-gray-400 leading-relaxed font-medium">
                        Open your authenticator app (like Google Authenticator or Authy) and scan this QR code to link your account.
                      </p>
                    </div>
                    
                    <div className="p-6 bg-white rounded-[32px] inline-block shadow-2xl">
                      <QRCodeSVG value={otpUri} size={200} fgColor="#0A0A0F" />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-black uppercase tracking-tight text-[#FF6B2C]">Step 2: Verify Setup</h3>
                      <p className="text-sm text-gray-400 leading-relaxed font-medium">
                        Enter the 6-digit code currently displayed in your app to confirm the link.
                      </p>
                    </div>

                    <form onSubmit={handleVerifySetup} className="space-y-4">
                      <input 
                        type="text"
                        placeholder="000 000"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="w-full bg-[#0A0A0F]/60 border border-white/10 rounded-2xl px-6 py-5 text-2xl font-black tracking-[0.5em] text-center focus:border-[#FF6B2C]/40 outline-none transition-all placeholder-gray-800"
                      />
                      <div className="flex gap-4">
                        <button 
                          type="submit"
                          disabled={loading || verificationCode.length < 6}
                          className="flex-1 py-5 bg-[#FF6B2C] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[#FF8533] transition-all disabled:opacity-50 active:scale-95"
                        >
                          {loading ? "Verifying..." : "Verify & Enable"}
                        </button>
                        <button 
                          type="button"
                          onClick={() => setStep(1)}
                          className="px-8 py-5 bg-white/5 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-white transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="rounded-[40px] bg-[#FF6B2C]/5 border border-[#FF6B2C]/10 p-8 flex items-start gap-6">
          <div className="w-12 h-12 rounded-xl bg-[#FF6B2C]/10 flex items-center justify-center text-[#FF6B2C] flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-white mb-2">Security Note</h4>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              If you lose access to your authenticator app, please contact your system administrator to reset your multi-factor authentication. Always keep your recovery codes in a safe place.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Security;
