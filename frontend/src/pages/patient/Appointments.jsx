import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import PatientHeader from "../../Components/PatientHeader";
import PatientFooter from "../../Components/PatientFooter";

const departments = ["Cardiology", "Neurology", "Pediatrics", "Orthopedics", "General OPD"];
const genders = ["Male", "Female", "Other"];

const Appointments = () => {
  const location = useLocation();
  const initialDoctor = location.state?.doctor || {};

  const [showForm, setShowForm] = useState(Boolean(initialDoctor.name));
  const [form, setForm] = useState({
    fullName: "",
    age: "",
    phone: "",
    gender: "",
    symptoms: "",
    department: initialDoctor.department || "",
    doctorName: initialDoctor.name || "",
    date: "",
    time: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE || "http://192.168.1.15:5000";

  useEffect(() => {
    if (initialDoctor.name) setShowForm(true);
  }, [initialDoctor]);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        setLoadingRecent(true);
        const token = localStorage.getItem("jwtToken");
        const res = await fetch(`${API_BASE}/api/patient/appointments/recent`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) return;
        const data = await res.json();
        setRecentAppointments(data.appointments || data || []);
      } catch (err) {
        console.error("Fetch recent appointments error", err);
      } finally {
        setLoadingRecent(false);
      }
    };

    fetchRecent();
  }, [API_BASE]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const Age = Number(form.age);
    if (!form.fullName.trim()) return setError("Full Name is required");
    if (!Number.isFinite(Age) || Age < 1 || Age > 120)
      return setError("Age must be a number between 1 and 120");
    if (!form.phone.trim()) return setError("Phone is required");
    if (!genders.includes(form.gender))
      return setError("Gender must be Male, Female or Other");
    if (!departments.includes(form.department))
      return setError("Please select a valid department");
    if (!form.doctorName.trim()) return setError("Doctor name is required");
    if (!form.date) return setError("Date is required");
    if (!form.time) return setError("Time is required");

    const payload = {
      Full_Name: form.fullName.trim(),
      Age: Age,
      Phone: String(form.phone).trim(),
      Gender: form.gender,
      department: form.department,
      Doctor_name: form.doctorName.trim(),
      Date: form.date,
      Time: form.time,
      symptoms: form.symptoms.trim(),
    };

    setLoading(true);

    (async () => {
      try {
        const token = localStorage.getItem("jwtToken");
        const res = await fetch(`${API_BASE}/api/patient/appointments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (res.status === 201) {
          setSuccess(data.message || "Appointment booked successfully.");
          setShowForm(false);
          setForm({
            fullName: "",
            age: "",
            phone: "",
            gender: "",
            symptoms: "",
            department: "",
            doctorName: "",
            date: "",
            time: "",
          });

          try {
            setLoadingRecent(true);
            const resRecent = await fetch(
              `${API_BASE}/api/patient/appointments/recent`,
              {
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
              }
            );
            if (resRecent.ok) {
              const recentData = await resRecent.json();
              setRecentAppointments(recentData.appointments || recentData || []);
            }
          } finally {
            setLoadingRecent(false);
          }
        } else if (res.status === 400) {
          setError(data?.error || data?.message || "Validation error");
        } else {
          setError(
            data?.error || data?.message || "Server error booking appointment"
          );
        }
      } catch (err) {
        console.error("Appointment booking error", err);
        setError("Network error while booking appointment");
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <div className="min-h-screen w-screen flex flex-col bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50 font-sans text-slate-900">
      {/* background accents */}
      <div className="pointer-events-none fixed inset-0 opacity-60 mix-blend-multiply">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-sky-200 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-emerald-200 blur-3xl" />
      </div>

      <div className="fixed top-0 left-0 right-0 z-40">
        <PatientHeader />
      </div>

      <main className="relative z-10 flex-grow pt-24 pb-10 px-4 sm:px-8 lg:px-16 flex justify-center">
        <div className="w-full max-w-6xl rounded-3xl bg-white/80 backdrop-blur-xl border border-white/70 shadow-[0_16px_50px_rgba(15,23,42,0.10)] p-5 sm:p-8">
          {/* Heading + CTA */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-sky-600">
                MedSync · Patient appointments
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-semibold text-slate-900">
                Book an appointment
              </h1>
              <p className="mt-1 text-sm text-slate-600 max-w-xl">
                Choose your department, doctor, and time slot. Your appointments are securely stored in your MedSync record.
              </p>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="self-start md:self-auto bg-gradient-to-r from-sky-500 to-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:brightness-110 transition"
              >
                Book new appointment
              </button>
            )}
          </div>

          {/* Feedback */}
          {error && (
            <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          {/* Main split: recent (left) + form (right) */}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)]">
            {/* Recent appointments */}
            <section className="rounded-2xl bg-slate-50/80 border border-slate-100 p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">
                Your recent appointments
              </h2>

              {loadingRecent && (
                <div className="text-xs text-slate-500">
                  Loading recent appointments...
                </div>
              )}

              {!loadingRecent && recentAppointments.length === 0 && (
                <div className="text-xs text-slate-500">
                  No appointments yet. Your upcoming bookings will appear here.
                </div>
              )}

              {!loadingRecent && recentAppointments.length > 0 && (
                <div className="space-y-3 max-h-72 overflow-auto pr-1">
                  {recentAppointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="rounded-xl border border-slate-100 bg-white px-3 py-3 text-xs sm:text-sm flex flex-col gap-1 shadow-sm"
                    >
                      <div className="font-medium text-slate-900">
                        {(appt.doctor_name || appt.doctorName || "Doctor") +
                          " · " +
                          (appt.department || "Department")}
                      </div>
                      <div className="text-slate-600">
                        {(appt.appointment_date || appt.date || "").toString()} ·{" "}
                        {(appt.appointment_time || appt.time || "").toString()}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Patient: {appt.full_name || appt.fullName || "-"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Booking form */}
            {showForm && (
              <section className="rounded-2xl bg-white border border-slate-100 p-4 sm:p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900 mb-3">
                  Appointment details
                </h2>
                <form onSubmit={handleSubmit} className="space-y-5 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        id: "fullName",
                        label: "Full Name",
                        type: "text",
                        placeholder: "Your full name",
                      },
                      {
                        id: "age",
                        label: "Age",
                        type: "number",
                        placeholder: "Age in years",
                        min: 0,
                      },
                      {
                        id: "phone",
                        label: "Phone",
                        type: "tel",
                        placeholder: "Phone number",
                      },
                      {
                        id: "gender",
                        label: "Gender",
                        type: "select",
                        options: genders,
                        placeholder: "Select Gender",
                      },
                      {
                        id: "department",
                        label: "Department",
                        type: "select",
                        options: departments,
                        placeholder: "Select Department",
                      },
                      {
                        id: "doctorName",
                        label: "Doctor Name",
                        type: "text",
                        placeholder: "Enter doctor's name",
                      },
                      {
                        id: "symptoms",
                        label: "Symptoms",
                        type: "text",
                        placeholder: "Briefly describe your symptoms",
                      },
                      { id: "date", label: "Date", type: "date" },
                      { id: "time", label: "Time", type: "time" },
                    ].map(({ id, label, type, placeholder, options, min }) =>
                      type === "select" ? (
                        <div key={id}>
                          <label
                            htmlFor={id}
                            className="block mb-1 font-medium text-slate-800 text-xs"
                          >
                            {label}
                          </label>
                          <select
                            id={id}
                            name={id}
                            value={form[id]}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
                          >
                            <option value="">{placeholder}</option>
                            {options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div key={id}>
                          <label
                            htmlFor={id}
                            className="block mb-1 font-medium text-slate-800 text-xs"
                          >
                            {label}
                          </label>
                          <input
                            id={id}
                            name={id}
                            type={type}
                            min={min}
                            placeholder={placeholder}
                            value={form[id]}
                            onChange={handleChange}
                            required={id !== "symptoms"}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
                          />
                        </div>
                      )
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 text-white text-xs font-semibold shadow-sm hover:brightness-110 disabled:opacity-60"
                    >
                      {loading ? "Booking..." : "Submit"}
                    </button>
                  </div>
                </form>
              </section>
            )}
          </div>
        </div>
      </main>

      <PatientFooter />
    </div>
  );
};

export default Appointments;
