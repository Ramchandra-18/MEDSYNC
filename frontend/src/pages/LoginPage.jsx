import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const BG_IMAGES = {
  doctor: "https://images.pexels.com/photos/32213424/pexels-photo-32213424.jpeg",
  staff: "https://images.pexels.com/photos/5722160/pexels-photo-5722160.jpeg",
  patient: "https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-40568.jpeg",
  pharmacy: "https://images.pexels.com/photos/5998512/pexels-photo-5998512.jpeg",
  default: "https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-40568.jpeg",
};

function getRoleByUserId(userId) {
  if (!userId) return "default";
  const id = userId.toString().toUpperCase();
  // More robust pharmacy detection
  if ( id.startsWith("PH")) return "pharmacy";
  // Other role checks
  if (id.startsWith("P")) return "patient";
  if (id.startsWith("D")) return "doctor";
  if (id.startsWith("S")) return "staff";
  // Try to infer role from the full ID if no prefix match
  if (id.includes("PHARM")) return "pharmacy";
  if (id.includes("DOCTOR")) return "doctor";
  if (id.includes("PATIENT")) return "patient";
  if (id.includes("STAFF")) return "staff";
  return "default";
}

const LoginPage = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [bgUrl, setBgUrl] = useState(BG_IMAGES.default);

  // API base (use Vite env var if provided)
  const API_BASE = import.meta.env.VITE_API_BASE ;

  // Load registered users from localStorage
  const loadRegisteredUsers = () => {
    return JSON.parse(localStorage.getItem("registeredUsers") || "[]");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Build login payload: allow login by email or by identifier (user code)
    const trimmed = userId.trim();
    const isEmail = trimmed.includes("@");
    const payload = isEmail
      ? { email: trimmed, password }
      : { identifier: trimmed, password };

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        // If API returns an error message, show it and log details to help debugging.
        const apiMsg = data?.message || data?.error || "Invalid credentials";
        console.error("Login API error response:", res.status, data);
        setMessage(apiMsg);

        // If backend responded with an access-denied about role, try to redirect based on the provided identifier/user code.
        if (apiMsg.toLowerCase().includes("access denied")) {
          // Determine candidate code: if user typed an identifier use that, otherwise check returned user.generated_code
          const trimmedId = trimmed;
          const codeCandidate = trimmedId || (data?.user?.generated_code || "");
          const roleFromCode = getRoleByUserId(codeCandidate);
          if (roleFromCode && roleFromCode !== "default") {
            // slight delay so message can be seen
            setTimeout(() => {
              setLoading(false);
              navigate(`/${roleFromCode}/dashboard`);
            }, 400);
            return;
          }
        }
        // continue to fallback to local auth
      } else {
        // Successful login via API
        const user = data.user || data;
        const token = data.token || data.accessToken || data.jwt || "";

        // Enhanced role detection
        let rolePath;
        // declare keyId here so it's available to logs below
        let keyId = "";

        // First try to get role from user_code if available
        if (user?.user_code) {
          rolePath = getRoleByUserId(user.user_code);
          keyId = user.user_code;
        }

        // If no role from user_code, try ID fields
        if (!rolePath || rolePath === "default") {
          keyId = user?.patientId || user?.doctorId || user?.staffId || user?.pharmacyId || "";
          if (keyId) {
            rolePath = getRoleByUserId(keyId);
          }
        }

        // If still no role, try role field with proper case handling
        if (!rolePath || rolePath === "default") {
          const roleStr = (user?.role || user?.role_name || user?.userType || "").toString();
          // First try exact matches
          const normalizedRole = roleStr.toLowerCase();
          if (normalizedRole === "pharmacy") {
            rolePath = "pharmacy";
          } else if (normalizedRole === "doctor") {
            rolePath = "doctor";
          } else if (normalizedRole === "staff") {
            rolePath = "staff";
          } else if (normalizedRole === "patient") {
            rolePath = "patient";
          } else if (normalizedRole.includes("pharm")) {
            rolePath = "pharmacy";
          }
        }

        console.log("Login successful:", { role: rolePath, userId: keyId, user }); // Debug info


        localStorage.setItem("currentUser", JSON.stringify(user));
        // Always save token as 'authToken' for consistent access
        if (token) {
          localStorage.setItem("jwtToken", token);
          localStorage.setItem("authToken", token);
        } else {
          localStorage.setItem("jwtToken", "api-token");
          localStorage.setItem("authToken", "api-token");
        }

        // set background based on determined role
        setBgUrl(BG_IMAGES[rolePath] || BG_IMAGES.default);

        // Ensure we use the detected rolePath for navigation, not the raw user.role
        setTimeout(() => {
          if (!rolePath) {
            setMessage("Error: Could not determine user role for redirection");
            return;
          }
          console.log(`Redirecting to: /${rolePath}/dashboard`);
          navigate(`/${rolePath}/dashboard`);
        }, 300);

        setLoading(false);
        return;
      }
    } catch (err) {
      // network error -> show message and fall back to localStorage check
      // eslint-disable-next-line no-console
      console.error("Login API error:", err);
      setMessage("Network error contacting auth server. Trying local login...");
    }

    // Fallback: localStorage-based auth (useful for dev/offline)
    const registeredUsers = loadRegisteredUsers();
    const user = registeredUsers.find((usr) => {
      return (
        usr.patientId === trimmed ||
        usr.doctorId === trimmed ||
        usr.staffId === trimmed ||
        usr.pharmacyId === trimmed ||
        (isEmail && usr.email === trimmed)
      );
    });

    if (user && user.password === password) {
      const userKeyId = user.patientId || user.doctorId || user.staffId || user.pharmacyId || "";
      const role = getRoleByUserId(userKeyId);

      localStorage.setItem("currentUser", JSON.stringify(user));
      localStorage.setItem("jwtToken", "dummy-token");
      setBgUrl(BG_IMAGES[role] || BG_IMAGES.default);

      setTimeout(() => {
        // use normalized role (computed from ID) to match route paths (lowercase)
        navigate(`/${role}/dashboard`);
      }, 300);
    } else {
      if (!message) setMessage("Invalid user ID or password. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen w-screen flex items-center justify-center bg-cover bg-center transition-all duration-500"
      style={{ backgroundImage: `url('${bgUrl}')` }}
    >
      <form
        onSubmit={handleLogin}
        className="bg-white bg-opacity-95 shadow-lg rounded-lg p-8 w-full max-w-sm space-y-5"
        aria-label="Universal login form"
      >
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">Login</h2>

        <label className="block mb-1 font-medium text-black" htmlFor="userid-input">User ID</label>
        <input
          type="text"
          id="userid-input"
          className="w-full border border-gray-300 rounded-lg p-3 text-black"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
        />

        <label className="block mb-1 font-medium text-black" htmlFor="password-input">Password</label>
        <input
          type="password"
          id="password-input"
          className="w-full border border-gray-300 rounded-lg p-3 text-black"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="text-right text-sm mb-2">
          <a href="/forgot-password" className="text-blue-600 hover:underline">Forgot Password?</a>
        </div>

        <button
          type="submit"
          className={`w-full ${loading ? "bg-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400"} text-white p-3 rounded-lg font-semibold transition`}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {message && <div className="text-red-700 text-sm text-center">{message}</div>}

        <div className="text-center mt-4">
          <p className="text-gray-600">Don't have an account?</p>
          <a href="/register" className="text-blue-600 hover:underline font-semibold">Register Now</a>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
