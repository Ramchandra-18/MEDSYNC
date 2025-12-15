import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // Separate error state
  const navigate = useNavigate();

  const clearMessages = useCallback(() => {
    setMessage('');
    setError('');
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
      console.log('Sending OTP to:', email); // Debug log
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      let data;
      try {
        data = await res.json();
      } catch {
        data = { error: 'Invalid response from server' };
      }
      
      if (res.ok) {
        setMessage("✅ Check your inbox for OTP!");
        setStep(2);
      } else {
        setError(data?.error || data?.message || "Email not registered");
      }
    } catch (err) {
      console.error('Forgot password error:', err);
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
      console.log('Resetting password for:', email, 'OTP:', otp); // Debug log
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, new_password: newPassword }),
      });
      
      let data;
      try {
        data = await res.json();
      } catch {
        data = { error: 'Invalid response from server' };
      }
      
      if (res.ok) {
        setMessage("✅ Password updated successfully!");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(data?.error || data?.message || "Invalid OTP or server error");
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError("Network error. Check if backend is running.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-50 p-4">
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            {step === 1 ? 'Forgot Password?' : 'Reset Password'}
          </h2>
          <p className="text-gray-600">Enter details to reset your password</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full text-black p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full text-black !bg-gradient-to-r from-emerald-300 via-sky-400 to-indigo-400 hover:from-emerald-400 hover:to-indigo-500 text-white p-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full text-black p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                maxLength={6}
                required
                className="w-full text-black p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="New password (8+ chars, 1 uppercase, 1 number)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                className="w-full text-black p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full !bg-gradient-to-r from-black via-green-400 to-black hover:text-black-700 text-white p-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>
        )}

        {/* Messages */}
        {error && (
          <p className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            ❌ {error}
          </p>
        )}
        {message && (
          <p className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
            {message}
          </p>
        )}

        <button
          onClick={() => navigate('/login')}
          className="w-full !bg-gradient-to-r from-gray-800 via-gray-900 to-blue-500 mt-6 text- hover:text-blue-800 font-semibold py-2 transition-colors"
        >
          ← Back to Login
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
