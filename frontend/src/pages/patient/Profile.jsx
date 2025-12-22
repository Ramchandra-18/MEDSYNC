import React, { useEffect, useState } from "react";
import PatientHeader from "../../Components/PatientHeader";
import PatientFooter from "../../Components/PatientFooter";

const genders = ["Male", "Female", "Other"];
const requiredFields = ["name", "email", "phone", "dob", "address", "gender"];

// ✅ PER-USER PERSISTENT PROFILE STORAGE
const PROFILE_KEY_PREFIX = "medsync_patient_profile_v1_";
const COMPLETION_KEY_PREFIX = "medsync_profile_completed_";

const makeKeysForUser = (userIdOrCode) => {
  const suffix = userIdOrCode || "anonymous";
  return {
    profileKey: `${PROFILE_KEY_PREFIX}${suffix}`,
    completionKey: `${COMPLETION_KEY_PREFIX}${suffix}`,
  };
};

const Profile = () => {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    address: "",
    gender: "",
  });

  // ✅ LOAD FROM SEPARATE PERSISTENT STORAGE + MERGE WITH AUTH DATA
  useEffect(() => {
    const loadProfileData = () => {
      try {
        // 2️⃣ GET CURRENT USER/AUTH DATA
        const authSources = [
          () => localStorage.getItem("user"),
          () => localStorage.getItem("currentUser"),
          () => localStorage.getItem("patient"),
        ];

        let authUser = null;
        for (const getItem of authSources) {
          try {
            const raw = getItem();
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed && typeof parsed === "object") {
                authUser = parsed;
                break;
              }
            }
          } catch (e) {}
        }

        // no logged-in patient
        if (!authUser) {
          setLoading(false);
          return;
        }

        // 🔑 build per-user keys
        const patientId =
          authUser.user_code || authUser.id || authUser.email || "anonymous";
        const { profileKey, completionKey } = makeKeysForUser(patientId);

        // 1️⃣ ALWAYS LOAD PERSISTENT PROFILE FIRST (for this user)
        const persistentProfile = localStorage.getItem(profileKey);
        const profileCompleted = localStorage.getItem(completionKey) === "true";

        // 3️⃣ MERGE PERSISTENT PROFILE + AUTH DATA
        let completeProfile = {};

        if (persistentProfile) {
          completeProfile = JSON.parse(persistentProfile);
        } else if (authUser) {
          completeProfile = {
            ...authUser,
            name: authUser.name || authUser.full_name || "",
            email: authUser.email || "",
            phone: authUser.phone || "",
            dob: authUser.dob || authUser.date_of_birth || "",
            address: authUser.address || "",
            gender: authUser.gender || "",
          };
        }

        // 4️⃣ Add metadata
        completeProfile.profileCompleted = profileCompleted;
        completeProfile.user_code =
          authUser?.user_code || completeProfile.user_code || "N/A";
        completeProfile.profileSource = persistentProfile ? "persistent" : "auth";
        completeProfile._storageKeys = { profileKey, completionKey };

        if (Object.keys(completeProfile).length > 0) {
          setUser(completeProfile);
          setForm({
            name: completeProfile.name || "",
            email: completeProfile.email || "",
            phone: completeProfile.phone || "",
            dob: completeProfile.dob || "",
            address: completeProfile.address || "",
            gender: completeProfile.gender || "",
          });

          // Check completion status
          const incomplete = requiredFields.some(
            (field) =>
              !completeProfile[field] ||
              String(completeProfile[field]).trim() === ""
          );

          if (incomplete && !profileCompleted) {
            setEditMode(true);
          }
        }
      } catch (error) {
        console.error("Profile load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, []);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // ✅ SAVE TO SEPARATE PERSISTENT STORAGE (SURVIVES LOGOUT)
  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasEmptyRequired = requiredFields.some(
      (field) => !form[field]?.trim()
    );

    if (hasEmptyRequired) {
      alert("Please fill all required fields marked with *");
      return;
    }

    try {
      const completeProfile = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        dob: form.dob,
        address: form.address.trim(),
        gender: form.gender,
        profileCompleted: true,
        profileLastUpdated: new Date().toISOString(),
        profileVersion: "v1",
      };

      if (user) {
        completeProfile.user_code = user.user_code;
        completeProfile.id = user.id;
      }

      // 🔑 per-user keys (from metadata or recomputed)
      const patientId =
        user?.user_code || user?.id || user?.email || "anonymous";
      const keys = user?._storageKeys || makeKeysForUser(patientId);
      const { profileKey, completionKey } = keys;

      // 3️⃣ SAVE TO PERSISTENT STORAGE (PER USER)
      localStorage.setItem(profileKey, JSON.stringify(completeProfile));
      localStorage.setItem(completionKey, "true");

      // 4️⃣ ALSO UPDATE CURRENT USER (convenience)
      if (user) {
        const updatedUser = {
          ...user,
          ...completeProfile,
          _storageKeys: keys,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      }

      // 5️⃣ UPDATE STATE
      setUser((prev) => ({
        ...(prev || {}),
        ...completeProfile,
        _storageKeys: keys,
      }));
      alert("✅ Profile saved successfully! Data will persist across logins.");
      setEditMode(false);

      console.log("✅ Profile saved persistently:", completeProfile);
    } catch (error) {
      console.error("Save error:", error);
      alert("Error saving profile. Please try again.");
    }
  };

  // Rest of your JSX unchanged...

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <PatientHeader />
        <div className="flex-1 flex items-center justify-center text-slate-600">
          Loading profile...
        </div>
        <PatientFooter />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
        <div className="fixed top-0 left-0 right-0 z-40">
          <PatientHeader />
        </div>
        <main className="pt-24 flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-lg border border-slate-100 p-8 text-center">
            <h2 className="text-2xl font-semibold mb-3 text-sky-700">
              Profile not found
            </h2>
            <p className="text-sm text-slate-600 mb-2">
              User data is unavailable. Please log in again or contact support.
            </p>
          </div>
        </main>
        <PatientFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50 flex flex-col font-sans text-slate-900">
      {/* background accents */}
      <div className="pointer-events-none fixed inset-0 opacity-60 mix-blend-multiply">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-sky-200 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-emerald-200 blur-3xl" />
      </div>

      <div className="fixed top-0 left-0 right-0 z-40">
        <PatientHeader />
      </div>

      <main className="relative z-10 pt-24 pb-10 px-4 sm:px-8 lg:px-16 flex justify-center">
        <div className="w-full max-w-5xl rounded-3xl bg-white/80 backdrop-blur-xl border border-white/70 shadow-[0_16px_50px_rgba(15,23,42,0.10)] p-6 sm:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-sky-600">
                MedSync · Patient profile
              </p>
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
                Your Profile
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
                {user.profileCompleted ? (
                  `Profile complete • Last updated ${new Date(
                    user.profileLastUpdated
                  ).toLocaleDateString()}`
                ) : (
                  "Please complete your profile so your care team can reach you easily."
                )}
              </p>
            </div>
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="self-start sm:self-auto px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-sm hover:brightness-110"
              >
                {user.profileCompleted ? "Edit profile" : "Complete profile"}
              </button>
            )}
          </div>

          {/* Split layout */}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.8fr)]">
            {/* Profile card */}
            <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-sky-900 to-slate-900 text-slate-50 p-5 sm:p-6 shadow-[0_14px_40px_rgba(15,23,42,0.6)] flex flex-col items-center gap-4">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl bg-gradient-to-br from-sky-400 via-sky-300 to-emerald-300 flex items-center justify-center text-3xl sm:text-4xl font-semibold text-slate-900 shadow-xl">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">
                  {user.name || "Unknown"}
                </p>
                <p className="text-[11px] text-sky-200 mt-1">
                  Patient ID · {user.user_code || "N/A"}
                </p>
                {user.profileCompleted && (
                  <p className="text-[10px] text-emerald-300 mt-1 bg-emerald-800/30 px-2 py-1 rounded-full">
                    ✓ Profile Complete
                  </p>
                )}
              </div>
              <div className="w-full border-t border-slate-700/60 pt-3 mt-1 text-xs space-y-1">
                <p className="flex justify-between">
                  <span className="text-slate-300">Email</span>
                  <span className="text-slate-50 truncate max-w-[60%]">
                    {user.email || "-"}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-300">Phone</span>
                  <span className="text-slate-50">{user.phone || "-"}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-300">Gender</span>
                  <span className="text-slate-50">{user.gender || "-"}</span>
                </p>
              </div>
            </section>

            {/* Right side: view or edit */}
            {!editMode ? (
              <section className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ProfileItem label="Patient ID" value={user.user_code} />
                  <ProfileItem label="Name" value={user.name} />
                  <ProfileItem label="Email" value={user.email} />
                  <ProfileItem label="Phone" value={user.phone} />
                  <ProfileItem label="Date of birth" value={user.dob} />
                  <ProfileItem label="Gender" value={user.gender} />
                </div>
                <div>
                  <ProfileItem label="Address" value={user.address} fullWidth />
                </div>
              </section>
            ) : (
              <section className="rounded-2xl bg-slate-50/80 border border-slate-100 p-5 sm:p-6 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-5 text-sm">
                  <div>
                    <label
                      htmlFor="patientId"
                      className="block mb-1 font-medium text-slate-800 text-xs"
                    >
                      Patient ID
                    </label>
                    <input
                      id="patientId"
                      type="text"
                      value={user.user_code}
                      disabled
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 bg-slate-100 text-sm text-slate-600 cursor-not-allowed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      {
                        name: "name",
                        label: "Name *",
                        type: "text",
                        placeholder: "Enter your full name",
                      },
                      {
                        name: "email",
                        label: "Email *",
                        type: "email",
                        placeholder: "Enter your email",
                      },
                      {
                        name: "phone",
                        label: "Phone *",
                        type: "tel",
                        placeholder: "Enter your phone number",
                      },
                      {
                        name: "dob",
                        label: "Date of birth *",
                        type: "date",
                      },
                      {
                        name: "address",
                        label: "Address *",
                        type: "text",
                        placeholder: "Enter your address",
                      },
                    ].map(({ name, label, type, placeholder }) => (
                      <div key={name}>
                        <label
                          htmlFor={name}
                          className="block mb-1 font-medium text-slate-800 text-xs"
                        >
                          {label}
                        </label>
                        <input
                          id={name}
                          name={name}
                          type={type}
                          placeholder={placeholder}
                          value={form[name]}
                          onChange={handleChange}
                          required
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label
                      htmlFor="gender"
                      className="block mb-1 font-medium text-slate-800 text-xs"
                    >
                      Gender *
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                    >
                      <option value="">Select gender</option>
                      {genders.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 text-white text-xs font-semibold shadow-sm hover:brightness-110"
                    >
                      Save changes
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

const ProfileItem = ({ label, value, fullWidth }) => (
  <div
    className={`rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 text-xs sm:text-sm ${
      fullWidth ? "w-full" : ""
    }`}
  >
    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-1">
      {label}
    </p>
    <p className="text-sm font-medium text-slate-900">{value || "-"}</p>
  </div>
);

export default Profile;
