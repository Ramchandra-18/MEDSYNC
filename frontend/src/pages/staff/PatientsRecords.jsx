import React, { useEffect, useState } from "react";
import { FaPhone, FaEnvelope, FaIdCard, FaStethoscope } from "react-icons/fa";
import StaffHeader from "../../Components/StaffHeader";
import StaffFooter from "../../Components/StaffFooter";

const riskLevelColorsBg = {
  Low: "bg-emerald-50",
  Medium: "bg-amber-50",
  High: "bg-rose-50",
};

const riskLevelColorsText = {
  Low: "text-emerald-700",
  Medium: "text-amber-700",
  High: "text-rose-700",
};

const PatientsRecords = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/patient/records", {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body.error || `Request failed with status ${res.status}`
          );
        }

        const body = await res.json();
        setPatients(body.patients || []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load patients");
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const filtered = patients.filter((p) => {
    const q = search.trim().toLowerCase();
    if (q) {
      const n = p.name?.toLowerCase().includes(q);
      const e = p.email?.toLowerCase().includes(q);
      const ph = p.phone?.toLowerCase().includes(q);
      if (!n && !e && !ph) return false;
    }
    if (riskFilter && (p.riskLevel || "Low") !== riskFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
        Loading patients...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-rose-600">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen flex flex-col bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50 font-sans text-slate-900">
      {/* background accents */}
      <div className="pointer-events-none fixed inset-0 opacity-60 mix-blend-multiply">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-sky-200 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-emerald-200 blur-3xl" />
      </div>

      {/* fixed header */}
      <header className="fixed top-0 left-0 right-0 z-40">
        <StaffHeader />
      </header>

      <main className="relative z-10 flex-1 pt-24 pb-10 px-4 sm:px-8 lg:px-16 flex justify-center overflow-auto">
        <div className="w-full max-w-6xl rounded-3xl bg-white/90 backdrop-blur-xl border border-white/70 shadow-[0_16px_50px_rgba(15,23,42,0.12)] px-5 sm:px-7 py-6 space-y-5">
          {/* title + meta */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
                Patient records
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                Structured view of patients with demographics, contacts, and risk.
              </p>
            </div>
            <span className="text-[11px] sm:text-xs px-3 py-1 rounded-full bg-sky-50 text-sky-700 font-medium">
              {filtered.length} of {patients.length} patients
            </span>
          </div>

          {/* toolbar */}
          <section className="rounded-2xl bg-slate-50/80 border border-slate-100 px-3 sm:px-4 py-3 flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder="Search name / email / phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[180px] border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm bg-white"
            >
              <option value="">All risk levels</option>
              <option value="Low">Low risk</option>
              <option value="Medium">Medium risk</option>
              <option value="High">High risk</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setRiskFilter("");
              }}
              className="text-[11px] sm:text-xs px-3 py-2 rounded-lg border border-slate-200 text-slate-700 !bg-white hover:bg-slate-50"
            >
              Clear
            </button>
          </section>

          {/* records grid */}
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-600">
              No patients match the current filters.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p, idx) => {
                const risk = p.riskLevel || "Low";
                const lastVisit = p.lastVisit
                  ? new Date(p.lastVisit).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "N/A";

                return (
                  <article
                    key={p.id || idx}
                    className="relative bg-slate-50 border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                  >
                    {/* folder top edge */}
                    <div className="h-2 w-full bg-gradient-to-r from-sky-400 via-emerald-400 to-sky-500" />

                    <div className="px-4 py-3 flex flex-col gap-3">
                      {/* header row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <FaIdCard className="text-sky-500 text-xs" />
                            <p className="text-[11px] text-slate-400">
                              ID: {p.id || "N/A"}
                            </p>
                          </div>
                          <h2 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                            {p.name}
                          </h2>
                          <p className="text-[11px] sm:text-xs text-slate-500">
                            Last visit:{" "}
                            <span className="font-medium text-slate-700">
                              {lastVisit}
                            </span>
                          </p>
                        </div>
                        <div
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-semibold text-[10px] sm:text-[11px] ${
                            riskLevelColorsBg[risk] || "bg-slate-100"
                          } ${
                            riskLevelColorsText[risk] || "text-slate-800"
                          }`}
                        >
                          <FaStethoscope className="text-[10px]" />
                          <span>{risk} risk</span>
                        </div>
                      </div>

                      {/* divider */}
                      <div className="h-px bg-slate-100" />

                      {/* content rows */}
                      <div className="space-y-1.5 text-[11px] sm:text-xs text-slate-600">
                        <div className="flex justify-between gap-2">
                          <span className="font-medium text-slate-800">
                            Status:
                          </span>
                          <span>{p.status || "Active"}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="font-medium text-slate-800">
                            Age:
                          </span>
                          <span>{p.age ?? "N/A"}</span>
                        </div>
                        {p.department && (
                          <div className="flex justify-between gap-2">
                            <span className="font-medium text-slate-800">
                              Department:
                            </span>
                            <span>{p.department}</span>
                          </div>
                        )}
                      </div>

                      {/* contact row */}
                      <div className="mt-2 space-y-1.5 text-[11px] sm:text-xs text-slate-600">
                        <div className="flex items-center gap-2 truncate">
                          <FaPhone className="text-[10px] text-slate-400" />
                          <span>{p.phone || "No phone added"}</span>
                        </div>
                        <div className="flex items-center gap-2 truncate">
                          <FaEnvelope className="text-[10px] text-slate-400" />
                          <span>{p.email || "No email added"}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <footer className="relative z-10 mt-auto">
        <StaffFooter />
      </footer>
    </div>
  );
};

export default PatientsRecords;
