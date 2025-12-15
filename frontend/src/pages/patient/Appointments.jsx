import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import PatientHeader from "../../Components/PatientHeader";
import PatientFooter from "../../Components/PatientFooter";

const departments = ["Cardiology", "Neurology", "Pediatrics", "Orthopedics", "OPD"];
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

  // API base
  const API_BASE = import.meta.env.VITE_API_BASE || "http://192.168.1.15:5000";

  useEffect(() => {
    if (initialDoctor.name) setShowForm(true);
  }, [initialDoctor]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // validations
    const Age = Number(form.age);
    if (!form.fullName.trim()) return setError("Full Name is required");
    if (!Number.isFinite(Age) || Age < 1 || Age > 120) return setError("Age must be a number between 1 and 120");
    if (!form.phone.trim()) return setError("Phone is required");
    if (!genders.includes(form.gender)) return setError("Gender must be Male, Female or Other");
    if (!departments.includes(form.department)) return setError("Please select a valid department");
    if (!form.doctorName.trim()) return setError("Doctor name is required");
    if (!form.date) return setError("Date is required");
    if (!form.time) return setError("Time is required");

    // prepare payload matching server exact keys
    const payload = {
      Full_Name: form.fullName.trim(),
      Age: Age,
      Phone: String(form.phone).trim(),
      Gender: form.gender,
      department: form.department,
      Doctor_name: form.doctorName.trim(),
      Date: form.date,
      Time: form.time,
    };

    setLoading(true);

    (async () => {
      try {
        const token = localStorage.getItem('jwtToken');
        const res = await fetch(`${API_BASE}/api/patient/appointments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (res.status === 201) {
          setSuccess(data.message || 'Appointment booked successfully.');
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
        } else if (res.status === 400) {
          setError(data?.error || data?.message || 'Validation error');
        } else {
          setError(data?.error || data?.message || 'Server error booking appointment');
        }
      } catch (err) {
        console.error('Appointment booking error', err);
        setError('Network error while booking appointment');
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <div
      className="min-h-screen w-screen flex flex-col !bg-[url('https://media.istockphoto.com/id/1319031310/photo/doctor-writing-a-medical-prescription.jpg?s=1024x1024&w=is&k=20&c=nChrkueWF_kh09Gsm_cjWYAY1BnyQ3XMt9ITykBiIYQ=')] bg-cover bg-center font-sans"
    >
      <div className="fixed top-0 left-0 right-0 z-50">
        <PatientHeader />
      </div>

      <main className="flex-grow pt-[72px] px-6 py-10 max-w-3xl w-full mx-auto bg-white bg-opacity-95 rounded-xl shadow-lg">
        <h1 className="text-4xl font-extrabold mb-8 text-blue-900 tracking-wide">
          Book Appointment
        </h1>

        {/* Feedback */}
        {error && <div className="mb-4 text-red-600 font-semibold">{error}</div>}
        {success && <div className="mb-4 text-green-600 font-semibold">{success}</div>}

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-10 py-3 rounded-lg shadow hover:bg-blue-700 transition"
          >
            Book Appointment
          </button>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { id: "fullName", label: "Full Name", type: "text", placeholder: "Your full name" },
                { id: "age", label: "Age", type: "number", placeholder: "Age in years", min: 0 },
                { id: "phone", label: "Phone", type: "tel", placeholder: "Phone number" },
                { id: "gender", label: "Gender", type: "select", options: genders, placeholder: "Select Gender" },
                { id: "department", label: "Department", type: "select", options: departments, placeholder: "Select Department" },
                { id: "doctorName", label: "Doctor Name", type: "text", placeholder: "Enter doctor's name" },
                { id: "date", label: "Date", type: "date" },
                { id: "time", label: "Time", type: "time" },
              ].map(({ id, label, type, placeholder, options, min }) =>
                type === "select" ? (
                  <div key={id}>
                    <label htmlFor={id} className="block mb-2 font-semibold text-blue-900">
                      {label}
                    </label>
                    <select
                      id={id}
                      name={id}
                      value={form[id]}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded px-4 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                    <label htmlFor={id} className="block mb-2 font-semibold text-blue-900">
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
                      required
                      className="w-full border border-gray-300 rounded px-4 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                )
              )}
            </div>
            <div className="text-right">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-700 text-white px-10 py-3 rounded-lg shadow hover:bg-blue-800 transition"
              >
                {loading ? "Booking..." : "Submit"}
              </button>
            </div>
          </form>
        )}
      </main>

      <PatientFooter />
    </div>
  );
};

export default Appointments;
