import React, { useState } from "react";
import DoctorHeader from "../../Components/DoctorHeader";
import DoctorFooter from "../../Components/DoctorFooter";

const API_BASE = import.meta.env.VITE_API_BASE;
const genders = ["Male", "Female", "Other"];

const PrescriptionPage = () => {
  const [form, setForm] = useState({
    searchEmail: "",
    fullName: "",
    age: "",
    phone: "",
    gender: "",
    disease: "",
    date: "",
    time: "",
    medicine: "",
  });

  const [medicines, setMedicines] = useState([
    { medication: "", dosage: "", frequency: "" },
  ]);
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [patientError, setPatientError] = useState(null);

  const handleEmailSearchChange = (e) => {
    setForm((f) => ({ ...f, searchEmail: e.target.value.trim() }));
    setPatientError(null);
  };

  const handleGetData = async () => {
    const email = form.searchEmail.trim();
    if (!email) {
      setPatientError("Please enter a patient email.");
      return;
    }
    setLoading(true);
    setPatientError(null);
    try {
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("jwtToken");
      if (!token)
        throw new Error("Authorization token required. Please login again.");
      const res = await fetch(`${API_BASE}/api/doctor/patient-info`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ patient_email: email }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.error || data?.message || "No patient record found."
        );
      const info = data.patient_info;
      if (!info) throw new Error("No patient found with this email.");
      setForm((f) => ({
        ...f,
        searchEmail: email,
        fullName: info.full_name || "",
        age: info.age ? String(info.age) : "",
        phone: info.phone || "",
        gender: "",
        disease: "",
        medicine: "",
      }));
    } catch (e) {
      setPatientError(e.message);
      setForm((f) => ({
        ...f,
        fullName: "",
        age: "",
        phone: "",
        gender: "",
        disease: "",
        medicine: "",
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleMedicineChange = (idx, field, value) => {
    setMedicines((prev) =>
      prev.map((row, rowIdx) =>
        rowIdx === idx ? { ...row, [field]: value } : row
      )
    );
  };

  const handleAddMedicineRow = () => {
    setMedicines((prev) => [
      ...prev,
      { medication: "", dosage: "", frequency: "" },
    ]);
  };

  const handleRemoveMedicineRow = (idx) => {
    setMedicines((prev) => prev.filter((_, rowIdx) => rowIdx !== idx));
  };

  const generatePrescriptionText = () => {
    const { fullName, age, date, time, disease, phone } = form;
    const medList = medicines
      .map(
        (med, i) =>
          `#${i + 1}  ${med.medication} | Dosage: ${med.dosage} | Frequency: ${
            med.frequency
          }`
      )
      .join("\n");
    return (
      `Prescription for ${fullName} (Age: ${age}, Phone: ${phone}):\n` +
      `Date: ${date} at ${time}\n` +
      `Disease: ${disease}\n` +
      `Medications:\n${medList}\n\n` +
      `Please follow the prescribed treatment and consult your doctor regularly.`
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = generatePrescriptionText();
    setPrescription(text);

    try {
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("jwtToken");
      if (!token) {
        alert("Authorization token required. Please login again.");
        return;
      }

      const payload = {
        full_name: form.fullName,
        age: Number(form.age),
        phone: form.phone,
        gender: form.gender,
        disease: form.disease,
        date: form.date,
        time: form.time,
        patient_email: form.searchEmail,
        medicines,
      };

      const res = await fetch(`${API_BASE}/api/doctor/prescription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || "Failed to create prescription"
        );
      }

      alert("Prescription created and sent to pharmacy.");
      console.log("Prescription API response:", data);
    } catch (err) {
      console.error("Prescription error", err);
      alert(err.message || "Failed to send prescription.");
    }
  };

  return (
    <div className="min-h-screen w-screen font-sans flex flex-col bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50 text-slate-900">
      {/* background accents */}
      <div className="pointer-events-none fixed inset-0 opacity-60 mix-blend-multiply">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-sky-200 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-emerald-200 blur-3xl" />
      </div>

      <div className="fixed top-0 left-0 right-0 z-40">
        <DoctorHeader />
      </div>

      <main className="relative z-10 flex-grow pt-24 pb-10 px-4 sm:px-8 lg:px-16 flex justify-center">
        <div className="max-w-3xl w-full rounded-3xl bg-white/85 backdrop-blur-xl border border-white/70 shadow-[0_16px_50px_rgba(15,23,42,0.10)] p-6 sm:p-8">
          <div className="mb-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-sky-600">
              MedSync · e‑prescription
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
              Create prescription
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Search patient by email, confirm details, and add medications to
              send the prescription to pharmacy.
            </p>
          </div>

          {/* Email search */}
          <section className="mb-6 rounded-2xl bg-slate-50/80 border border-slate-100 p-4 sm:p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-3">
              Patient lookup
            </h2>
            <div className="space-y-2">
              <label
                htmlFor="searchEmail"
                className="block text-xs font-medium text-slate-800"
              >
                Patient email
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  name="searchEmail"
                  id="searchEmail"
                  value={form.searchEmail}
                  onChange={handleEmailSearchChange}
                  placeholder="Enter patient email"
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                  autoComplete="off"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={handleGetData}
                  className={`px-4 py-2 rounded-lg bg-sky-600 text-white text-xs sm:text-sm font-semibold shadow-sm hover:bg-sky-700 ${
                    loading ? "opacity-60 cursor-wait" : ""
                  }`}
                  disabled={loading}
                >
                  {loading ? "Searching..." : "Get data"}
                </button>
              </div>
              {patientError && (
                <div className="text-xs text-rose-600 mt-1">{patientError}</div>
              )}
            </div>
          </section>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 text-sm">
            <section className="rounded-2xl bg-white border border-slate-100 p-4 sm:p-5 space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Patient details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Full name"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                />
                <InputField
                  label="Age"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  type="number"
                  min="0"
                  required
                />
                <InputField
                  label="Phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  type="text"
                  required
                  placeholder="Phone number"
                />
                <SelectField
                  label="Gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  options={genders}
                  required
                />
                <InputField
                  label="Disease / diagnosis"
                  name="disease"
                  value={form.disease}
                  onChange={handleChange}
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    type="date"
                    required
                  />
                  <InputField
                    label="Time"
                    name="time"
                    value={form.time}
                    onChange={handleChange}
                    type="time"
                    required
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-white border border-slate-100 p-4 sm:p-5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-3">
                Medicines
              </h2>
              <div className="relative overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/60">
                <table className="min-w-full text-xs sm:text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="py-2 px-3 text-left font-semibold">
                        Medication
                      </th>
                      <th className="py-2 px-3 text-left font-semibold">
                        Dosage
                      </th>
                      <th className="py-2 px-3 text-left font-semibold">
                        Frequency
                      </th>
                      <th className="py-2 px-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {medicines.map((row, idx) => (
                      <tr key={idx} className="border-t border-slate-100">
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={row.medication}
                            onChange={(e) =>
                              handleMedicineChange(
                                idx,
                                "medication",
                                e.target.value
                              )
                            }
                            required
                            className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs sm:text-sm"
                            placeholder="Name"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={row.dosage}
                            onChange={(e) =>
                              handleMedicineChange(
                                idx,
                                "dosage",
                                e.target.value
                              )
                            }
                            required
                            className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs sm:text-sm"
                            placeholder="Dosage"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={row.frequency}
                            onChange={(e) =>
                              handleMedicineChange(
                                idx,
                                "frequency",
                                e.target.value
                              )
                            }
                            required
                            className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs sm:text-sm"
                            placeholder="Frequency"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          {medicines.length > 1 && (
                            <button
                              type="button"
                              className="text-xs font-semibold text-rose-600 px-2 py-1 rounded-md hover:bg-rose-50"
                              onClick={() => handleRemoveMedicineRow(idx)}
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={handleAddMedicineRow}
                className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
              >
                + Add medicine
              </button>
            </section>

            <button
              type="submit"
              className="w-full mt-2 rounded-xl bg-gradient-to-r from-sky-600 via-slate-900 to-sky-700 text-white py-3 text-sm font-semibold shadow-sm hover:brightness-110"
            >
              Generate & send prescription
            </button>
          </form>

          {prescription && (
            <div className="mt-6 p-4 rounded-2xl bg-slate-900 text-slate-50 text-xs sm:text-sm whitespace-pre-wrap font-mono">
              <h2 className="font-semibold text-sm mb-2">
                Generated prescription (preview)
              </h2>
              <pre className="whitespace-pre-wrap">{prescription}</pre>
            </div>
          )}
        </div>
      </main>

      <DoctorFooter />
    </div>
  );
};

const InputField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
  min,
}) => (
  <div>
    <label
      htmlFor={name}
      className="block text-xs font-medium text-slate-800 mb-1"
    >
      {label}
    </label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      min={min}
      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
    />
  </div>
);

const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
}) => (
  <div>
    <label
      htmlFor={name}
      className="block text-xs font-medium text-slate-800 mb-1"
    >
      {label}
    </label>
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
    >
      <option value="">{`Select ${label.toLowerCase()}`}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

export default PrescriptionPage;
