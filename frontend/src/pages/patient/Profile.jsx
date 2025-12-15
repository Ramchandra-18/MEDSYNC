import React, { useEffect, useState } from "react";
import PatientHeader from "../../Components/PatientHeader";
import PatientFooter from "../../Components/PatientFooter";

const genders = ["Male", "Female", "Other"];
const requiredFields = ["name", "email", "phone", "dob", "address", "gender"];

const Profile = () => {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    patientId: "",
    name: "",
    email: "",
    phone: "",
    dob: "",
    address: "",
    gender: "",
  });

  useEffect(() => {
    // Try both keys for maximum compatibility
    const storedUser =
      JSON.parse(localStorage.getItem("user")) ||
      JSON.parse(localStorage.getItem("currentUser") || "null");

    if (storedUser && typeof storedUser === "object") {
      setUser(storedUser);
      setForm({
        patientId: storedUser.patientId || "",
        name: storedUser.name || "",
        email: storedUser.email || "",
        phone: storedUser.phone || "",
        dob: storedUser.dob || "",
        address: storedUser.address || "",
        gender: storedUser.gender || "",
      });

      const incomplete = requiredFields.some(
        (field) => !storedUser[field] || storedUser[field].trim() === ""
      );

      if (incomplete) {
        alert("Please complete your profile.");
        setEditMode(true);
      }
    }
    setLoading(false);
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedUser = { ...user, ...form };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setEditMode(false);
  };

  if (loading) {
    return <div className="text-center p-16 text-lg">Loading profile...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 font-sans">
        <PatientHeader />
        <div className="mt-32 text-center bg-white rounded shadow p-10">
          <h2 className="text-2xl font-bold mb-4 text-blue-600">Profile Not Found</h2>
          <p className="text-gray-700 mb-4">
            User data is unavailable. Please log in again or contact support.
          </p>
        </div>
        <PatientFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-indigo-100 via-white to-blue-100 flex flex-col font-sans">
      <div className="fixed top-0 left-0 right-0 z-50">
        <PatientHeader />
      </div>

      <main className="pt-[72px] flex-grow px-4 py-10 max-w-3xl mx-auto w-full">
        <h1 className="text-4xl font-extrabold mb-10 border-b text-gray-900 pb-4">
          Your Profile
        </h1>
        {!editMode ? (
          <>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="bg-gradient-to-br from-blue-400 via-white to-indigo-300 rounded-full shadow-lg w-36 h-36 flex items-center justify-center overflow-hidden">
                <span className="text-5xl font-light text-blue-700 capitalize select-none">
                  {user.name?.charAt(0) || "U"}
                </span>
              </div>
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ProfileItem icon="🆔" label="Patient ID" value={user.patientId} />
                  <ProfileItem icon="👤" label="Name" value={user.name} />
                  <ProfileItem icon="✉️" label="Email" value={user.email} />
                  <ProfileItem icon="📞" label="Phone" value={user.phone} />
                  <ProfileItem icon="🎂" label="Date of Birth" value={user.dob} />
                  <ProfileItem icon="🏠" label="Address" value={user.address} />
                  <ProfileItem icon="⚧" label="Gender" value={user.gender} />
                </div>
                <button
                  onClick={() => setEditMode(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white p-8 text-black rounded-xl shadow-lg space-y-6"
          >
            {[
              { name: "patientId", label: "Patient ID", type: "text", disabled: true },
              { name: "name", label: "Name", type: "text", placeholder: "Enter your full name" },
              { name: "email", label: "Email", type: "email", placeholder: "Enter your email" },
              { name: "phone", label: "Phone", type: "tel", placeholder: "Enter your phone number" },
              { name: "dob", label: "Date of Birth", type: "date" },
              { name: "address", label: "Address", type: "text", placeholder: "Enter your address" },
            ].map(({ name, label, type, disabled, placeholder }) => (
              <div key={name}>
                <label htmlFor={name} className="block mb-2 font-semibold text-gray-700">
                  {label}
                </label>
                <input
                  id={name}
                  name={name}
                  type={type}
                  disabled={disabled}
                  placeholder={placeholder}
                  value={form[name]}
                  onChange={handleChange}
                  required={!disabled}
                  className={`w-full rounded border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                  }`}
                />
              </div>
            ))}
            <div>
              <label htmlFor="gender" className="block mb-2 font-semibold text-gray-700">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                required
                className="w-full rounded border px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Gender</option>
                {genders.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="px-6 py-2 text-white rounded border border-gray-300 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Save
              </button>
            </div>
          </form>
        )}
      </main>
      <PatientFooter />
    </div>
  );
};

const ProfileItem = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded shadow-sm select-none">
    <span className="text-2xl">{icon}</span>
    <div>
      <div className="text-xs font-medium text-gray-600">{label}</div>
      <div className="text-lg font-semibold text-gray-900">{value || "-"}</div>
    </div>
  </div>
);

export default Profile;
