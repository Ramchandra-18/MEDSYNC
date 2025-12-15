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
  if (id.startsWith("PH")) return "pharmacy";
  if (id.startsWith("P")) return "patient";
  if (id.startsWith("D")) return "doctor";
  if (id.startsWith("S")) return "staff";
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

  const API_BASE = import.meta.env.VITE_API_BASE;

  const loadRegisteredUsers = () => {
    return JSON.parse(localStorage.getItem("registeredUsers") || "[]");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

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
        const apiMsg = data?.message || data?.error || "Invalid credentials";
        console.error("Login API error response:", res.status, data);
        setMessage(apiMsg);

        if (apiMsg.toLowerCase().includes("access denied")) {
          const trimmedId = trimmed;
          const codeCandidate = trimmedId || (data?.user?.generated_code || "");
          const roleFromCode = getRoleByUserId(codeCandidate);
          if (roleFromCode && roleFromCode !== "default") {
            setTimeout(() => {
              setLoading(false);
              navigate(`/${roleFromCode}/dashboard`);
            }, 400);
            return;
          }
        }
      } else {
        const user = data.user || data;
        const token = data.token || data.accessToken || data.jwt || "";

        let rolePath;
        let keyId = "";

        if (user?.user_code) {
          rolePath = getRoleByUserId(user.user_code);
          keyId = user.user_code;
        }

        if (!rolePath || rolePath === "default") {
          keyId =
            user?.patientId ||
            user?.doctorId ||
            user?.staffId ||
            user?.pharmacyId ||
            "";
          if (keyId) {
            rolePath = getRoleByUserId(keyId);
          }
        }

        if (!rolePath || rolePath === "default") {
          const roleStr = (
            user?.role ||
            user?.role_name ||
            user?.userType ||
            ""
          ).toString();
          const normalizedRole = roleStr.toLowerCase();
          if (normalizedRole === "pharmacy" || normalizedRole.includes("pharm")) {
            rolePath = "pharmacy";
          } else if (normalizedRole === "doctor") {
            rolePath = "doctor";
          } else if (normalizedRole === "staff") {
            rolePath = "staff";
          } else if (normalizedRole === "patient") {
            rolePath = "patient";
          }
        }

        console.log("Login successful:", { role: rolePath, userId: keyId, user });

        localStorage.setItem("currentUser", JSON.stringify(user));
        if (token) {
          localStorage.setItem("jwtToken", token);
          localStorage.setItem("authToken", token);
        } else {
          localStorage.setItem("jwtToken", "api-token");
          localStorage.setItem("authToken", "api-token");
        }

        setBgUrl(BG_IMAGES[rolePath] || BG_IMAGES.default);

        setTimeout(() => {
          if (!rolePath) {
            setMessage("Error: Could not determine user role for redirection");
            setLoading(false);
            return;
          }
          console.log(`Redirecting to: /${rolePath}/dashboard`);
          navigate(`/${rolePath}/dashboard`);
        }, 300);

        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Login API error:", err);
      setMessage("Network error contacting auth server. Trying local login...");
    }

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
      const userKeyId =
        user.patientId || user.doctorId || user.staffId || user.pharmacyId || "";
      const role = getRoleByUserId(userKeyId);

      localStorage.setItem("currentUser", JSON.stringify(user));
      localStorage.setItem("jwtToken", "dummy-token");
      setBgUrl(BG_IMAGES[role] || BG_IMAGES.default);

      setTimeout(() => {
        navigate(`/${role}/dashboard`);
      }, 300);
    } else {
      if (!message)
        setMessage("Invalid user ID or password. Please try again.");
    }
    setLoading(false);
  };

  const inferredRole = getRoleByUserId(userId || "");

  return (
    <section className="flex flex-col lg:flex-row min-h-screen w-screen bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50 text-slate-900">
      {/* left image / story panel */}
      <div className="relative w-full lg:w-1/2 h-56 lg:h-auto">
        <div
          className="absolute inset-0 bg-cover bg-center rounded-b-3xl lg:rounded-b-none lg:rounded-r-3xl shadow-lg"
          style={{ backgroundImage: `url('${bgUrl}')` }}
        />
        <div className="absolute inset-0 bg-sky-900/10 rounded-b-3xl lg:rounded-b-none lg:rounded-r-3xl" />
        <div className="relative z-10 h-full w-full flex flex-col justify-between px-6 py-6 lg:px-10 lg:py-8">
          <div>
            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 text-sky-700 text-[11px] font-semibold tracking-[0.25em] uppercase shadow-sm">
              <span>MedSync</span>
              <span className="h-1 w-1 rounded-full bg-sky-500" />
              <span>Access</span>
            </p>
            <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 max-w-md">
              Unified login for your entire hospital.
            </h1>
            <p className="mt-3 text-xs sm:text-sm text-slate-700 max-w-md">
              Use your role ID or email and MedSync will route you directly to
              the right dashboard: doctor, staff, patient, or pharmacy.
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-600">
            <span className="inline-flex items-center justify-center h-6 px-2 rounded-full bg-white/80 text-sky-700 font-semibold">
              D123
            </span>
            <span className="inline-flex items-center justify-center h-6 px-2 rounded-full bg-white/80 text-amber-700 font-semibold">
              S001
            </span>
            <span className="inline-flex items-center justify-center h-6 px-2 rounded-full bg-white/80 text-emerald-700 font-semibold">
              PH001
            </span>
            <span className="inline-flex items-center justify-center h-6 px-2 rounded-full bg-white/80 text-fuchsia-700 font-semibold">
              P045
            </span>
            <span className="ml-1">Doctor · Staff · Pharmacy · Patient</span>
          </div>
        </div>
      </div>

      {/* right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-8 lg:py-0">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md bg-white/95 border border-slate-100 rounded-3xl shadow-[0_18px_50px_rgba(15,23,42,0.12)] px-6 sm:px-8 py-7 space-y-5"
          aria-label="Universal login form"
        >
          <div className="text-center mb-1">
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-1">
              Sign in to MedSync
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Use your MedSync ID (D123, PH001, etc.) or registered email.
            </p>
          </div>

          {inferredRole !== "default" && (
            <p className="text-[11px] text-sky-700 bg-sky-50 border border-sky-100 rounded-full px-3 py-1.5 inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              Detected role:&nbsp;
              <span className="font-semibold capitalize">{inferredRole}</span>
            </p>
          )}

          <div className="space-y-1">
            <label
              htmlFor="userid-input"
              className="block text-xs font-medium text-slate-800"
            >
              User ID or email
            </label>
            <input
              type="text"
              id="userid-input"
              className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent placeholder:text-slate-400"
              placeholder="e.g. D123, PH001 or you@example.com"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password-input"
              className="block text-xs font-medium text-slate-800"
            >
              Password
            </label>
            <input
              type="password"
              id="password-input"
              className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent placeholder:text-slate-400"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between text-[11px] mt-1">
            <span className="text-slate-500">
              Forgot your ID? Check your MedSync welcome mail.
            </span>
            <a
              href="/forgot-password"
              className="text-sky-600 hover:text-sky-700 hover:underline font-medium"
            >
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className={`w-full text-sm font-semibold text-white py-3 rounded-2xl shadow-md transition ${
              loading
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-sky-600 via-sky-500 to-emerald-500 hover:from-sky-700 hover:to-emerald-600"
            }`}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Continue"}
          </button>

          {message && (
            <div className="text-rose-700 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-center px-3 py-2">
              {message}
            </div>
          )}

          <div className="text-center mt-1">
            <p className="text-[11px] text-slate-500">
              New to MedSync? Create an account.
            </p>
            <a
              href="/register"
              className="inline-flex items-center justify-center mt-1 text-xs font-semibold text-sky-700 hover:text-sky-800 hover:underline"
            >
              Register now
            </a>
          </div>
        </form>
      </div>
    </section>
  );
};

export default LoginPage;
