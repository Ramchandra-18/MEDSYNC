import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE;

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validateOTP(otp) {
  return /^\d{6}$/.test(otp);
}
function validatePassword(pw) {
  return pw.length >= 8 && /[A-Z]/.test(pw) && /\d/.test(pw);
}

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const clearMessages = useCallback(() => {
    setMessage("");
    setError("");
  }, []);

  // Step 1: Request OTP
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = { error: "Invalid response from server" };
      }

      if (res.ok) {
        setMessage("Check your inbox for the 6‑digit OTP.");
        setStep(2);
      } else {
        setError(data?.error || data?.message || "Email not registered");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Network error. Check if backend is running on " + API_BASE);
    }
    setLoading(false);
  };

  // Step 2: Reset Password
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!validateOTP(otp)) {
      setError("OTP must be exactly 6 digits.");
      return;
    }
    if (!validatePassword(newPassword)) {
      setError("Password must be 8+ chars with 1 uppercase & 1 number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, new_password: newPassword }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = { error: "Invalid response from server" };
      }

      if (res.ok) {
        setMessage("Password updated successfully. Redirecting to login…");
        setTimeout(() => navigate("/login"), 1800);
      } else {
        setError(data?.error || data?.message || "Invalid OTP or server error");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError("Network error. Check if backend is running.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50 px-4">
      <div className="relative w-full max-w-md rounded-3xl bg-white/90 backdrop-blur-xl border border-white/70 shadow-[0_20px_60px_rgba(15,23,42,0.18)] px-6 sm:px-8 py-7">
        {/* step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1">
            <span
              className={`h-6 w-6 flex items-center justify-center rounded-full text-[11px] ${
                step === 1 ? "bg-sky-600 text-white" : "bg-sky-100 text-sky-700"
              }`}
            >
              1
            </span>
            <span>Email</span>
          </div>
          <span className="text-slate-300">—</span>
          <div className="flex items-center gap-1">
            <span
              className={`h-6 w-6 flex items-center justify-center rounded-full text-[11px] ${
                step === 2 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              2
            </span>
            <span>OTP & new password</span>
          </div>
        </div>

        {/* heading */}
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-semibold bg-gradient-to-r from-sky-600 via-emerald-500 to-sky-700 bg-clip-text text-transparent mb-1">
            {step === 1 ? "Forgot password?" : "Reset password"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            {step === 1
              ? "Enter your registered email to receive a one‑time code."
              : "Enter the OTP from your email and choose a new password."}
          </p>
        </div>

        {/* forms */}
        {step === 1 ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full text-slate-900 text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all disabled:bg-slate-50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 p-3 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full text-slate-900 text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                One‑time password (OTP)
              </label>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/[^\d]/g, "").slice(0, 6))
                }
                maxLength={6}
                required
                disabled={loading}
                className="w-full text-slate-900 text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all disabled:bg-slate-50 tracking-[0.3em] text-center"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                New password
              </label>
              <input
                type="password"
                placeholder="8+ chars, 1 uppercase, 1 number"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full text-slate-900 text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all disabled:bg-slate-50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full text-sm font-semibold text-white bg-gradient-to-r from-slate-900 via-sky-700 to-slate-900 hover:via-sky-600 p-3 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Resetting password..." : "Reset password"}
            </button>
          </form>
        )}

        {/* messages */}
        {error && (
          <p className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs sm:text-sm">
            ❌ {error}
          </p>
        )}
        {message && !error && (
          <p className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs sm:text-sm">
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full mt-6 text-xs sm:text-sm font-semibold text-slate-700 hover:text-sky-700 py-2 rounded-lg bg-transparent hover:bg-slate-50 transition-colors"
        >
          ← Back to login
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
