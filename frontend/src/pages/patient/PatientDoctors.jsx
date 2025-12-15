import React, { useEffect, useState } from "react";
import PatientHeader from "../../Components/PatientHeader";
import PatientFooter from "../../Components/PatientFooter";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// IMPROVED: stronger logic to find your token wherever it is hiding
function getAuthToken() {
  // 1. Check for direct keys
  const directToken = 
    localStorage.getItem("authToken") || 
    localStorage.getItem("token") || 
    localStorage.getItem("access_token");
    
  if (directToken) return directToken;

  // 2. Check inside "user" object (common in MERN/Flask apps)
  try {
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const user = JSON.parse(rawUser);
      return (
        user.token || 
        user.access_token || 
        user.data?.token || 
        user.session?.access_token || // Supabase style
        null
      );
    }
  } catch (e) {
    console.error("Error parsing 'user' from localStorage:", e);
  }

  // 3. Check inside "patient" object
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

      // 1. Get Token
      const token = getAuthToken();
      
      // DEBUG LOGGING: Open your browser console (F12) to see this
      console.log("🔍 DEBUG: Attempting to fetch doctors...");
      console.log("🔍 DEBUG: Token found?", token ? "YES" : "NO");
      if(token) console.log("🔍 DEBUG: Token starts with:", token.substring(0, 10) + "...");

      if (!token) {
        setError("You are not logged in. (Token missing from storage)");
        setLoading(false);
        return;
      }

      try {
        // 2. Fetch with Bearer Header
        const res = await fetch(`${API_BASE}/api/doctor/all`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();

        // 3. Handle Errors
        if (!res.ok) {
          console.error("❌ API Error:", res.status, data);
          if (res.status === 401) {
             setError("Session expired or invalid. Please login again.");
             // Optional: Auto-logout
             // localStorage.clear();
             // window.location.href = "/login";
          } else if (res.status === 403) {
             setError("Access denied: Only patients can view this list.");
          } else {
             throw new Error(data.error || data.message || "Failed to fetch doctors");
          }
          return;
        }

        // 4. Success
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

  // Filter Logic
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
    <div className="min-h-screen w-screen flex flex-col bg-slate-50 text-gray-900">
      <PatientHeader />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Our Doctors
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Browse specialists available in the hospital.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filter:</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              {allDepartments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="w-full flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
          </div>
        )}

        {/* ERROR STATE */}
        {error && !loading && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex flex-col gap-2">
            <p className="font-bold">⚠️ Error: {error}</p>
            {error.includes("Token missing") && (
              <p className="text-xs text-red-500">
                Tip: Try logging out and logging back in to save a fresh token.
              </p>
            )}
          </div>
        )}

        {/* DOCTOR CARDS */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((doc) => (
              <div
                key={doc.id}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 p-5 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-lg shadow-md">
                    {(doc.full_name || "D").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg text-gray-900 group-hover:text-blue-700">
                      {doc.full_name}
                    </h2>
                    <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">
                      {doc.department}
                    </p>
                  </div>
                </div>

                <div className="flex-1 space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium text-gray-800">Email:</span> {doc.email}</p>
                  <p><span className="font-medium text-gray-800">Code:</span> {doc.user_code}</p>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 font-medium">
                    ● Available
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!loading && !error && filtered.length === 0 && (
           <div className="text-center text-gray-500 py-10">No doctors found.</div>
        )}
      </main>

      <PatientFooter />
    </div>
  );
};

export default PatientDoctors;
