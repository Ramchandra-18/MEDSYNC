import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const roles = [
  { label: "Patient", value: "patient" },
  { label: "Doctor", value: "doctor" },
  { label: "Staff", value: "staff" },
  { label: "Pharmacy", value: "pharmacy" },
];

const departments = [
  "Cardiology",
  "Neurology",
  "Pediatrics",
  "Orthopedics",
  "Pharmacy",
];

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient",
    department: "",
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API base (use Vite env var if provided)
  const API_BASE = import.meta.env.VITE_API_BASE ;

  // OTP / server flow state
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const timerRef = useRef(null);
  const [tempUser, setTempUser] = useState(null); // stores the submitted data until OTP verification

  const getIdKey = (role) => {
    switch (role) {
      case "patient":
        return "patientId";
      case "doctor":
        return "doctorId";
      case "staff":
        return "staffId";
      case "pharmacy":
        return "pharmacyId";
      default:
        return "userId";
    }
  };

  const getNextId = (users, role) => {
    const prefixMap = {
      patient: "P",
      doctor: "D",
      staff: "S",
      pharmacy: "PH",
    };

    const prefix = prefixMap[role];
    const roleUsers = users.filter((u) => u.role === role);
    const numbers = roleUsers.map((u) => {
      const idKey = getIdKey(role);
      if (!u[idKey]) return 0;
      const numPart = u[idKey].slice(prefix.length);
      const num = parseInt(numPart, 10);
      return isNaN(num) ? 0 : num;
    });
    const maxNum = numbers.length ? Math.max(...numbers) : 0;
    const nextNum = maxNum + 1;
    const paddedNum = prefix === "PH" ? String(nextNum).padStart(2, "0") : String(nextNum).padStart(3, "0");
    return prefix + paddedNum;
  };

  const validateForm = () => {
    const errorsFound = {};
    if (!form.name.trim()) errorsFound.name = "Name is required";
    if (!form.password.trim() || form.password.length < 6)
      errorsFound.password = "Password must be at least 6 characters";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email))
      errorsFound.email = "Email format is invalid";
    if (form.role === "doctor" && !form.department)
      errorsFound.department = "Department is required";

    setErrors(errorsFound);
    return Object.keys(errorsFound).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startOtpTimer = (seconds = 120) => {
    setOtpTimer(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setOtpTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const capitalizeRole = (r) => {
    if (!r) return r;
    return r.charAt(0).toUpperCase() + r.slice(1).toLowerCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setOtpError("");
    if (!validateForm()) return;
    setIsSubmitting(true);

    // Build payload expected by your backend
    const payload = {
      full_name: form.name,
      email: form.email,
      password: form.password,
      role: capitalizeRole(form.role),
    };
    if (form.role === "doctor") payload.department = form.department;

    // Backend requires an email to send OTP. If email missing, fall back to simulated client OTP
    if (!payload.email) {
      // Fallback: simulate OTP (keeps previous behavior when no email provided)
      const simulatedOtp = String(Math.floor(100000 + Math.random() * 900000));
      // eslint-disable-next-line no-console
      console.log("Simulated OTP (no email provided):", simulatedOtp);
      setMessage(`No email provided — using simulated OTP. OTP logged to console.`);
      setTempUser(payload);
      setOtpSent(true);
      startOtpTimer(120);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        const err = data?.message || data?.error || "Registration failed";
        setErrors((prev) => ({ ...prev, submit: err }));
        setIsSubmitting(false);
        return;
      }

      // Expecting { message: "OTP sent to ..." }
      setMessage(data.message || "OTP sent (check your email)");
      setTempUser(payload);
      setOtpSent(true);
      startOtpTimer(120);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setErrors((prev) => ({ ...prev, submit: "Network error when sending OTP" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError("");
    if (!otpSent) {
      setOtpError("No OTP sent. Please register first.");
      return;
    }
    if (otpTimer === 0) {
      setOtpError("OTP expired. Please resend.");
      return;
    }

    // If we used simulated flow (no email), we don't have a server to verify.
    if (!tempUser?.email) {
      setOtpError("");
      // In simulated case, assume success
      // Persist user locally using same id-generation logic as before
      const allUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
      const role = tempUser.role;
      const idKey = getIdKey(role);
      const newId = getNextId(allUsers, role);

      const newUser = {
        full_name: tempUser.full_name || tempUser.name,
        email: tempUser.email || "",
        password: tempUser.password || tempUser.password,
        role: capitalizeRole(role),
        [idKey]: newId,
      };

      allUsers.push(newUser);
      localStorage.setItem("registeredUsers", JSON.stringify(allUsers));
      localStorage.setItem("lastRegisteredRole", role);
      setMessage(`Registration successful! Your ID: ${newId}. Redirecting...`);
      setOtpSent(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeout(() => navigate(`/login/${role}`, { replace: true }), 1500);
      return;
    }

    // Call backend verify-otp
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: tempUser.email, otp: otpInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data?.message || data?.error || "OTP verification failed");
        return;
      }

      // Success: backend may return generated_code and user
      setMessage(data.message || "Registration verified and completed.");
      setOtpSent(false);
      if (timerRef.current) clearInterval(timerRef.current);

      // Optionally persist returned user or generated_code locally (not required)
      // Redirect to login (you might use role from returned user or tempUser)
      const rolePath = (data?.user?.role || tempUser.role || "patient").toString().toLowerCase();
      setTimeout(() => navigate(`/login/${rolePath}`, { replace: true }), 1500);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setOtpError("Network error when verifying OTP");
    }
  };

  const handleResend = async () => {
    setOtpError("");
    if (!tempUser) return;
    // If no email, simulate
    if (!tempUser.email) {
      const simulatedOtp = String(Math.floor(100000 + Math.random() * 900000));
      // eslint-disable-next-line no-console
      console.log("Simulated Resend OTP:", simulatedOtp);
      setMessage("Simulated OTP resent (check console)");
      startOtpTimer(120);
      return;
    }

    // Re-call register endpoint to trigger resend (many backends support a resend endpoint; if not, this often re-sends)
    try {
      setIsSubmitting(true);
      const payload = {
        full_name: tempUser.full_name || tempUser.name,
        email: tempUser.email,
        password: tempUser.password || tempUser.password,
        role: tempUser.role ? capitalizeRole(tempUser.role) : undefined,
        department: tempUser.department,
      };
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data?.message || "Resend failed");
        return;
      }
      setMessage(data.message || "OTP resent");
      startOtpTimer(120);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setOtpError("Network error when resending OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen w-screen bg-[url('https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-40568.jpeg')] bg-cover bg-center flex items-center justify-center"
    >
      <form
        onSubmit={otpSent ? handleVerifyOtp : handleSubmit}
        className="max-w-md w-full !text-black p-8 bg-white bg-opacity-90 rounded-lg shadow-lg space-y-6"
        noValidate
        aria-label="Register Form"
      >
        <h2 className="text-3xl font-bold text-center text-blue-600">Register</h2>

        {!otpSent && (
          <>
            <input
              name="name"
              type="text"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              className={`w-full border p-3 rounded focus:outline-none focus:ring-2 ${
                errors.name ? "border-red-600 focus:ring-red-600" : "border-gray-300 focus:ring-blue-500"
              }`}
              aria-invalid={!!errors.name}
              aria-describedby="name-error"
              required
            />
            {errors.name && <p id="name-error" className="text-red-600 text-sm">{errors.name}</p>}

            <input
              name="email"
              type="email"
              placeholder="Email (required for server OTP)"
              value={form.email}
              onChange={handleChange}
              className={`w-full border p-3 rounded focus:outline-none focus:ring-2 ${
                errors.email ? "border-red-600 focus:ring-red-600" : "border-gray-300 focus:ring-blue-500"
              }`}
              aria-invalid={!!errors.email}
              aria-describedby="email-error"
            />
            {errors.email && <p id="email-error" className="text-red-600 text-sm">{errors.email}</p>}

            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className={`w-full border p-3 rounded focus:outline-none focus:ring-2 ${
                errors.password ? "border-red-600 focus:ring-red-600" : "border-gray-300 focus:ring-blue-500"
              }`}
              aria-invalid={!!errors.password}
              aria-describedby="password-error"
              required
            />
            {errors.password && <p id="password-error" className="text-red-600 text-sm">{errors.password}</p>}

            <fieldset>
              <legend className="mb-2 text-lg font-semibold text-gray-700">Role</legend>
              <div className="flex space-x-6">
                {roles.map(({ label, value }) => (
                  <label
                    key={value}
                    className="inline-flex items-center space-x-2 cursor-pointer select-none"
                  >
                    <input
                      type="radio"
                      name="role"
                      value={value}
                      checked={form.role === value}
                      onChange={handleChange}
                      className="form-radio text-blue-600"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {form.role === "doctor" && (
              <fieldset>
                <legend className="mb-2 text-lg font-semibold text-gray-700">Department</legend>
                <div className="flex flex-wrap gap-4">
                  {departments.map((dept) => (
                    <label
                      key={dept}
                      className="inline-flex items-center space-x-2 cursor-pointer select-none"
                    >
                      <input
                        type="radio"
                        name="department"
                        value={dept}
                        checked={form.department === dept}
                        onChange={handleChange}
                        className="form-radio text-blue-600"
                        required
                      />
                      <span>{dept}</span>
                    </label>
                  ))}
                </div>
                {errors.department && <p className="text-red-600 text-sm">{errors.department}</p>}
              </fieldset>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 text-white text-white py-3 rounded font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              aria-busy={isSubmitting}
            >
              {isSubmitting ? "Sending OTP..." : "Register & Send OTP"}
            </button>
          </>
        )}

        {otpSent && (
          <>
            <p className="text-sm text-gray-700">
              Enter the 6-digit OTP sent to {tempUser?.email || "your contact"}.
            </p>

            <input
              name="otp"
              type="text"
              inputMode="numeric"
              placeholder="Enter OTP"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className={`w-full border p-3 rounded focus:outline-none focus:ring-2 ${
                otpError ? "border-red-600 focus:ring-red-600" : "border-gray-300 focus:ring-blue-500"
              }`}
              aria-invalid={!!otpError}
              aria-describedby="otp-error"
              required
            />
            {otpError && <p id="otp-error" className="text-red-600 text-sm">{otpError}</p>}

            <div className="flex items-center justify-between space-x-4">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-3 rounded font-semibold hover:bg-green-700 transition"
              >
                Verify OTP
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={otpTimer > 0}
                className="ml-2 px-4 py-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {otpTimer > 0 ? `Resend (${otpTimer}s)` : "Resend OTP"}
              </button>
            </div>
          </>
        )}

        {errors.submit && <p className="mt-2 text-center text-red-600">{errors.submit}</p>}
        {message && <p className="mt-4 text-center text-green-600">{message}</p>}
      </form>
    </div>
  );
};

export default Register;
