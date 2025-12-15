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

  // Medicine table state
  const [medicines, setMedicines] = useState([{ medication: "", dosage: "", frequency: "" }]);
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [patientError, setPatientError] = useState(null);

  const handleEmailSearchChange = (e) => {
    setForm((f) => ({ ...f, searchEmail: e.target.value.trim() }));
    setPatientError(null);
  };

  // Fetch patient info by email via /api/doctor/patient-info (POST)
  const handleGetData = async () => {
    const email = form.searchEmail.trim();
    if (!email) {
      setPatientError("Please enter a patient email.");
      return;
    }
    setLoading(true);
    setPatientError(null);
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("jwtToken");
      if (!token) throw new Error("Authorization token required. Please login again.");
      const res = await fetch(`${API_BASE}/api/doctor/patient-info`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ patient_email: email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.message || "No patient record found.");
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

  // Medicine table handlers
  const handleMedicineChange = (idx, field, value) => {
    setMedicines((prev) =>
      prev.map((row, rowIdx) => (rowIdx === idx ? { ...row, [field]: value } : row))
    );
  };

  const handleAddMedicineRow = () => {
    setMedicines((prev) => [...prev, { medication: "", dosage: "", frequency: "" }]);
  };

  const handleRemoveMedicineRow = (idx) => {
    setMedicines((prev) => prev.filter((_, rowIdx) => rowIdx !== idx));
  };

  const generatePrescriptionText = () => {
    const { fullName, age, date, time, disease, phone } = form;
    const medList = medicines
      .map(
        (med, i) => `#${i + 1}  ${med.medication} | Dosage: ${med.dosage} | Frequency: ${med.frequency}`
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = generatePrescriptionText();
    setPrescription(text);
  };

  return (
    <div className="min-h-screen w-screen font-sans flex flex-col">
      <DoctorHeader />
      <main className="flex-grow !bg-[url('https://media.istockphoto.com/id/175426342/photo/prescription-blanks.jpg?s=1024x1024&w=is&k=20&c=UaDw6J69iuONI3fE4_X6YzMWp-EWZJy0nLJaT_FaoCQ=')] bg-cover bg-center mt-10 p-8 flex justify-center">
        <div className="max-w-xl w-full bg-white rounded-xl p-10 shadow-lg">
          <h1 className="text-center text-3xl font-bold mb-8 text-blue-700">
            Generate Prescription
          </h1>
          {/* Email search for patient */}
          <div className="mb-6 text-black">
            <label htmlFor="searchEmail" className="block font-semibold text-black mb-1">
              Patient Email
            </label>
            <input
              type="email"
              name="searchEmail"
              id="searchEmail"
              value={form.searchEmail}
              onChange={handleEmailSearchChange}
              placeholder="Enter patient email"
              className="w-full text-black border rounded px-3 py-2"
              autoComplete="off"
              disabled={loading}
            />
            <button
              type="button"
              onClick={handleGetData}
              className={`mt-2 px-4 py-2 !bg-blue-600 text-white rounded !hover:bg-blue-700 transition ${loading ? 'opacity-60' : ''}`}
              disabled={loading}
            >
              {loading ? "Searching..." : "Get Data"}
            </button>
            {patientError && (
              <div className="mt-2 text-red-600 text-sm">{patientError}</div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 text-black">
            <InputField label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} required />
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
              placeholder="Enter phone number"
            />
            <SelectField label="Gender" name="gender" value={form.gender} onChange={handleChange} options={genders} required />
            <InputField label="Disease" name="disease" value={form.disease} onChange={handleChange} required />

            <div className="grid grid-cols-2 gap-4">
              <InputField label="Date" name="date" value={form.date} onChange={handleChange} type="date" required />
              <InputField label="Time" name="time" value={form.time} onChange={handleChange} type="time" required />
            </div>

            <div>
              <label className="block font-semibold mb-2">Medicines</label>
              <table className="min-w-full border bg-white rounded">
                <thead>
                  <tr>
                    <th className="py-2 px-4 font-bold text-black text-left border">Medication</th>
                    <th className="py-2 px-4 font-bold text-black text-left border">Dosage</th>
                    <th className="py-2 px-4 font-bold text-black text-left border">Frequency</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((row, idx) => (
                    <tr key={idx} className="border-b">
                      <td>
                        <input
                          type="text"
                          value={row.medication}
                          onChange={(e) => handleMedicineChange(idx, "medication", e.target.value)}
                          required
                          className="border rounded px-2 py-1 w-full"
                          placeholder="Name"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={row.dosage}
                          onChange={(e) => handleMedicineChange(idx, "dosage", e.target.value)}
                          required
                          className="border rounded px-2 py-1 w-full"
                          placeholder="Dosage"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={row.frequency}
                          onChange={(e) => handleMedicineChange(idx, "frequency", e.target.value)}
                          required
                          className="border rounded px-2 py-1 w-full"
                          placeholder="Frequency"
                        />
                      </td>
                      <td>
                        {medicines.length > 1 && (
                          <button
                            type="button"
                            className="text-red-700 !px-2 !py-1 text-xl font-bold !bg-transparent hover:!bg-red-100 rounded"
                            onClick={() => handleRemoveMedicineRow(idx)}
                          >
                            ×
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                type="button"
                onClick={handleAddMedicineRow}
                className="mt-2 px-3 py-1 !bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                + Add Medicine
              </button>
            </div>

            <button type="submit" className="w-full !bg-gradient-to-r from-blue-700 via-gray-900 to-blue-700  text-white py-3 rounded">
              Generate &amp; Show Prescription
            </button>
          </form>

          {prescription && (
            <div className="mt-6 p-4 bg-blue-50 rounded text-sm whitespace-pre-wrap font-mono text-gray-800">
              <h2 className="font-bold text-lg mb-2">Generated Prescription</h2>
              <pre>{prescription}</pre>
            </div>
          )}
        </div>
      </main>
      <DoctorFooter />
    </div>
  );
};

const InputField = ({ label, name, value, onChange, type = "text", required = false, placeholder, min }) => (
  <div>
    <label htmlFor={name} className="block text-black font-semibold mb-1">
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
      className="w-full border rounded px-3 py-2 text-black"
    />
  </div>
);

const SelectField = ({ label, name, value, onChange, options, required = false }) => (
  <div>
    <label htmlFor={name} className="block text-black font-semibold mb-1">
      {label}
    </label>
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full border rounded px-3 py-2 text-black"
    >
      <option value="">{`Select ${label}`}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

export default PrescriptionPage;
