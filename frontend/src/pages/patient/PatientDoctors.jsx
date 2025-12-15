import React, { useEffect, useState } from "react";
import PatientHeader from "../../Components/PatientHeader";
import PatientFooter from "../../Components/PatientFooter";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// token helper
function getAuthToken() {
  const directToken =
    localStorage.getItem("authToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("access_token");

  if (directToken) return directToken;

  try {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const user = JSON.parse(rawUser);
      return (
        user.token ||
        user.access_token ||
        user.data?.token ||
        user.session?.access_token ||
        null
      );
    }
  } catch (e) {
    console.error("Error parsing 'user' from localStorage:", e);
  }

  try {
    const rawPatient = localStorage.getItem("patient");
    if (rawPatient) {
      const patient = JSON.parse(rawPatient);
      return patient.token || patient.access_token || null;
    }
  } catch (e) {}

  return null;
}

const PatientDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      setError("");

      const token = getAuthToken();

      console.log("🔍 DEBUG: Attempting to fetch doctors...");
      console.log("🔍 DEBUG: Token found?", token ? "YES" : "NO");
      if (token)
        console.log(
          "🔍 DEBUG: Token starts with:",
          token.substring(0, 10) + "..."
        );

      if (!token) {
        setError("You are not logged in. (Token missing from storage)");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/doctor/all`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("❌ API Error:", res.status, data);
          if (res.status === 401) {
            setError("Session expired or invalid. Please login again.");
          } else if (res.status === 403) {
            setError("Access denied: Only patients can view this list.");
          } else {
            throw new Error(
              data.error || data.message || "Failed to fetch doctors"
            );
          }
          return;
        }

        const list = Array.isArray(data.doctors) ? data.doctors : [];
        setDoctors(list);
        setFiltered(list);
      } catch (err) {
        console.error("❌ Network/Parse Error:", err);
        setError(err.message || "Failed to connect to server.");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  useEffect(() => {
    if (departmentFilter === "all") {
      setFiltered(doctors);
    } else {
      setFiltered(
        doctors.filter((d) =>
          (d.department || "")
            .toLowerCase()
            .includes(departmentFilter.toLowerCase())
        )
      );
    }
  }, [departmentFilter, doctors]);

  const allDepartments = Array.from(
    new Set(doctors.map((d) => d.department).filter(Boolean))
  );

  return (
    <div className="min-h-screen w-screen flex flex-col bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50 text-slate-900">
      {/* background accents */}
      <div className="pointer-events-none fixed inset-0 opacity-60 mix-blend-multiply">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-sky-200 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-emerald-200 blur-3xl" />
      </div>

      <div className="fixed top-0 left-0 right-0 z-40">
        <PatientHeader />
      </div>

      <main className="relative z-10 flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10">
        <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/70 shadow-[0_16px_50px_rgba(15,23,42,0.10)] px-5 sm:px-8 py-7">
          {/* Header and filter */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-sky-600">
                MedSync · Doctor directory
              </p>
              <h1 className="text-2xl sm:text-3xl font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                Our Specialists
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md">
                Browse hospital doctors by department and find the right specialist
                for your care.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs sm:text-sm font-medium text-slate-700">
                Department:
              </label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                <option value="all">All departments</option>
                {allDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="w-full flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-sky-500 border-t-transparent" />
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex flex-col gap-2">
              <p className="font-semibold">⚠️ {error}</p>
              {error.includes("Token missing") && (
                <p className="text-[11px] text-rose-500">
                  Tip: Try logging out and logging back in to save a fresh token.
                </p>
              )}
            </div>
          )}

          {/* Doctor cards */}
          {!loading && !error && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((doc) => (
                <div
                  key={doc.id}
                  className="group rounded-2xl bg-gradient-to-br from-slate-50 via-white to-sky-50 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 p-5 flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-lg shadow-md">
                      {(doc.full_name || "D").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="font-semibold text-sm sm:text-base text-slate-900 group-hover:text-sky-700">
                        {doc.full_name}
                      </h2>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-sky-600 font-semibold">
                        {doc.department || "Department"}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 space-y-1 text-xs sm:text-sm text-slate-600">
                    <p>
                      <span className="font-medium text-slate-800">Email:</span>{" "}
                      {doc.email || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-slate-800">Code:</span>{" "}
                      {doc.user_code || "-"}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-[11px] sm:text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">
                      ● Available
                    </span>
                    <span className="text-sky-600 group-hover:text-emerald-500 cursor-default">
                      Patient view
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="text-center text-sm text-slate-500 py-10">
              No doctors found for this filter.
            </div>
          )}
        </div>
      </main>

      <PatientFooter />
    </div>
  );
};

export default PatientDoctors;
