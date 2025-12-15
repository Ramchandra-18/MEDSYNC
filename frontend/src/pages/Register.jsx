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
  "General OPD",
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

  const API_BASE = import.meta.env.VITE_API_BASE;

  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const timerRef = useRef(null);
  const [tempUser, setTempUser] = useState(null);

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
    const paddedNum =
      prefix === "PH"
        ? String(nextNum).padStart(2, "0")
        : String(nextNum).padStart(3, "0");
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

    const payload = {
      full_name: form.name,
      email: form.email,
      password: form.password,
      role: capitalizeRole(form.role),
    };
    if (form.role === "doctor") payload.department = form.department;

    if (!payload.email) {
      const simulatedOtp = String(Math.floor(100000 + Math.random() * 900000));
      console.log("Simulated OTP (no email provided):", simulatedOtp);
      setMessage(
        "No email provided — using simulated OTP. OTP logged to console."
      );
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

      setMessage(data.message || "OTP sent (check your email)");
      setTempUser(payload);
      setOtpSent(true);
      startOtpTimer(120);
    } catch (err) {
      console.error(err);
      setErrors((prev) => ({
        ...prev,
        submit: "Network error when sending OTP",
      }));
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

    if (!tempUser?.email) {
      setOtpError("");
      const allUsers = JSON.parse(
        localStorage.getItem("registeredUsers") || "[]"
      );
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

      setMessage(data.message || "Registration verified and completed.");
      setOtpSent(false);
      if (timerRef.current) clearInterval(timerRef.current);

      const rolePath = (
        data?.user?.role ||
        tempUser.role ||
        "patient"
      )
        .toString()
        .toLowerCase();
      setTimeout(
        () => navigate(`/login/${rolePath}`, { replace: true }),
        1500
      );
    } catch (err) {
      console.error(err);
      setOtpError("Network error when verifying OTP");
    }
  };

  const handleResend = async () => {
    setOtpError("");
    if (!tempUser) return;

    if (!tempUser.email) {
      const simulatedOtp = String(Math.floor(100000 + Math.random() * 900000));
      console.log("Simulated Resend OTP:", simulatedOtp);
      setMessage("Simulated OTP resent (check console)");
      startOtpTimer(120);
      return;
    }

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
      console.error(err);
      setOtpError("Network error when resending OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50 px-4">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-6">
        {/* left: story + stepper */}
        <div className="bg-white/90 backdrop-blur-xl border border-white/70 rounded-3xl shadow-[0_18px_50px_rgba(15,23,42,0.12)] px-6 sm:px-8 py-7 flex flex-col justify-between">
          <div>
            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-[11px] font-semibold tracking-[0.25em] uppercase">
              MedSync · Registration
            </p>
            <h2 className="mt-3 text-2xl sm:text-3xl font-semibold text-slate-900">
              {otpSent ? "Verify your MedSync ID" : "Create your MedSync ID"}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              {otpSent
                ? "Enter the OTP to confirm your account and get your role‑based access."
                : "Sign up as a patient, doctor, staff, or pharmacy and receive a unique MedSync ID."}
            </p>
          </div>

          <div className="mt-6 space-y-3 text-xs">
            <div className="flex items-center gap-2">
              <div
                className={`h-7 w-7 flex items-center justify-center rounded-full text-[11px] font-semibold ${
                  !otpSent ? "bg-sky-600 text-white" : "bg-sky-100 text-sky-700"
                }`}
              >
                1
              </div>
              <div>
                <p className="font-medium text-slate-800">Details</p>
                <p className="text-slate-500">
                  Fill your name, password, and choose your role (and department
                  if you&apos;re a doctor).
                </p>
              </div>
            </div>
            <div className="h-px bg-slate-200 ml-3" />
            <div className="flex items-center gap-2">
              <div
                className={`h-7 w-7 flex items-center justify-center rounded-full text-[11px] font-semibold ${
                  otpSent
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                2
              </div>
              <div>
                <p className="font-medium text-slate-800">OTP verification</p>
                <p className="text-slate-500">
                  Confirm the code sent to your email or simulated OTP in the
                  console.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-[11px] text-slate-500">
            After verification, you&apos;ll be redirected to the login page for
            your role with your generated MedSync ID.
          </p>
        </div>

        {/* right: form */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-100 rounded-3xl shadow-[0_18px_50px_rgba(15,23,42,0.12)] px-6 sm:px-7 py-7 flex flex-col">
          <form
            onSubmit={otpSent ? handleVerifyOtp : handleSubmit}
            className="space-y-5 text-slate-900 flex-1"
            noValidate
            aria-label="Register Form"
          >
            {!otpSent && (
              <>
                <div>
                  <input
                    name="name"
                    type="text"
                    placeholder="Full name"
                    value={form.name}
                    onChange={handleChange}
                    className={`w-full border p-3 rounded-2xl text-sm focus:outline-none focus:ring-2 ${
                      errors.name
                        ? "border-rose-500 focus:ring-rose-500"
                        : "border-slate-200 focus:ring-sky-400"
                    }`}
                    aria-invalid={!!errors.name}
                    aria-describedby="name-error"
                    required
                  />
                  {errors.name && (
                    <p id="name-error" className="text-rose-600 text-xs mt-1">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    name="email"
                    type="email"
                    placeholder="Email (required for email OTP)"
                    value={form.email}
                    onChange={handleChange}
                    className={`w-full border p-3 rounded-2xl text-sm focus:outline-none focus:ring-2 ${
                      errors.email
                        ? "border-rose-500 focus:ring-rose-500"
                        : "border-slate-200 focus:ring-sky-400"
                    }`}
                    aria-invalid={!!errors.email}
                    aria-describedby="email-error"
                  />
                  {errors.email && (
                    <p id="email-error" className="text-rose-600 text-xs mt-1">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    name="password"
                    type="password"
                    placeholder="Password (min 6 characters)"
                    value={form.password}
                    onChange={handleChange}
                    className={`w-full border p-3 rounded-2xl text-sm focus:outline-none focus:ring-2 ${
                      errors.password
                        ? "border-rose-500 focus:ring-rose-500"
                        : "border-slate-200 focus:ring-sky-400"
                    }`}
                    aria-invalid={!!errors.password}
                    aria-describedby="password-error"
                    required
                  />
                  {errors.password && (
                    <p
                      id="password-error"
                      className="text-rose-600 text-xs mt-1"
                    >
                      {errors.password}
                    </p>
                  )}
                </div>

                <fieldset className="space-y-2">
                  <legend className="text-xs font-medium text-slate-800">
                    Role
                  </legend>
                  <div className="flex flex-wrap gap-3">
                    {roles.map(({ label, value }) => (
                      <label
                        key={value}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs cursor-pointer bg-white hover:bg-sky-50 border-slate-200"
                      >
                        <input
                          type="radio"
                          name="role"
                          value={value}
                          checked={form.role === value}
                          onChange={handleChange}
                          className="text-sky-600"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {form.role === "doctor" && (
                  <fieldset className="space-y-2">
                    <legend className="text-xs font-medium text-slate-800">
                      Department
                    </legend>
                    <div className="flex flex-wrap gap-3">
                      {departments.map((dept) => (
                        <label
                          key={dept}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs cursor-pointer bg-white hover:bg-sky-50 border-slate-200"
                        >
                          <input
                            type="radio"
                            name="department"
                            value={dept}
                            checked={form.department === dept}
                            onChange={handleChange}
                            className="text-sky-600"
                            required
                          />
                          <span>{dept}</span>
                        </label>
                      ))}
                    </div>
                    {errors.department && (
                      <p className="text-rose-600 text-xs mt-1">
                        {errors.department}
                      </p>
                    )}
                  </fieldset>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-sky-600 via-sky-500 to-emerald-500 text-white text-sm py-3 rounded-2xl font-semibold shadow-md hover:from-sky-700 hover:to-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? "Sending OTP..." : "Register & send OTP"}
                </button>
              </>
            )}

            {otpSent && (
              <>
                <p className="text-xs sm:text-sm text-slate-600">
                  Enter the 6‑digit OTP sent to{" "}
                  <span className="font-semibold">
                    {tempUser?.email || "your contact"}
                  </span>
                  .
                </p>
                <input
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter OTP"
                  value={otpInput}
                  onChange={(e) =>
                    setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className={`w-full border p-3 rounded-2xl text-sm text-center tracking-[0.3em] focus:outline-none focus:ring-2 ${
                    otpError
                      ? "border-rose-500 focus:ring-rose-500"
                      : "border-slate-200 focus:ring-sky-400"
                  }`}
                  aria-invalid={!!otpError}
                  aria-describedby="otp-error"
                  required
                />
                {otpError && (
                  <p id="otp-error" className="text-rose-600 text-xs mt-1">
                    {otpError}
                  </p>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 text-white py-3 rounded-2xl text-sm font-semibold hover:bg-emerald-700 transition"
                  >
                    Verify OTP
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={otpTimer > 0}
                    className="px-4 py-2 rounded-2xl border border-slate-200 text-xs text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {otpTimer > 0 ? `Resend (${otpTimer}s)` : "Resend OTP"}
                  </button>
                </div>
              </>
            )}

            {errors.submit && (
              <p className="mt-1 text-center text-rose-600 text-xs">
                {errors.submit}
              </p>
            )}
            {message && (
              <p className="mt-1 text-center text-emerald-600 text-xs">
                {message}
              </p>
            )}
          </form>

          <div className="mt-4 text-center text-[11px] text-slate-500">
            <span>Already have an account? </span>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="font-semibold text-sky-700 !border-none !bg-transparent"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
