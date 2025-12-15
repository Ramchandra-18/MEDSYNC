import React, { useState, useEffect } from "react";
import StaffHeader from "../../Components/StaffHeader";

const mockAppointments = [
  { id: 1, patient: "John Doe", doctor: "Dr. Alice Smith", date: "2025-08-22", time: "10:00", status: "Pending" },
  { id: 2, patient: "Mary Jane", doctor: "Dr. Bob Johnson", date: "2025-08-23", time: "13:00", status: "Pending" },
  { id: 3, patient: "Paul Adams", doctor: "Dr. Alice Smith", date: "2025-08-24", time: "09:00", status: "Pending" },
];

const AppointmentConfirmation = () => {
  const [appointments, setAppointments] = useState([]);
  const [loadingIds, setLoadingIds] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState("");

  // list params
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sort, setSort] = useState("date");
  const [dir, setDir] = useState("asc");
  const [filters, setFilters] = useState({
    date: "",
    from_date: "",
    to_date: "",
    status: "",
    doctor_name: "",
    department: "",
    patient_name: "",
  });
  const [count, setCount] = useState(0);

  const API_BASE = import.meta.env.VITE_API_BASE || "http://192.168.1.15:5000";

  const getAuthHeaders = () => {
    const token = localStorage.getItem("jwtToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const setLoading = (id, isLoading) => {
    setLoadingIds((prev) =>
      isLoading ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  const postJson = async (url, body) => {
    const headers = { "Content-Type": "application/json", ...getAuthHeaders() };
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, data };
  };

  // map server appointment shape to local display shape
  const mapServerToLocal = (s) => {
    return {
      id:
        s.id ||
        s.appointment_id ||
        s.appointmentId ||
        s.uuid ||
        s._id ||
        s.appointment_id,
      patient: s.full_name || s.patient_name || s.patient || s.Full_Name || "",
      doctor: s.doctor_name || s.doctor || s.Doctor_name || "",
      date: s.appointment_date || s.Date || s.date || "",
      time: (s.appointment_time || s.Time || s.time || "").slice(0, 5),
      status: s.status || s.appointment_status || "Pending",
      raw: s,
    };
  };

  const fetchAppointments = async () => {
    setLoadingList(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters.date) params.set("date", filters.date);
      if (filters.from_date) params.set("from_date", filters.from_date);
      if (filters.to_date) params.set("to_date", filters.to_date);
      if (filters.status) params.set("status", filters.status);
      if (filters.doctor_name) params.set("doctor_name", filters.doctor_name);
      if (filters.department) params.set("department", filters.department);
      if (filters.patient_name) params.set("patient_name", filters.patient_name);
      params.set("page", String(page));
      params.set("page_size", String(pageSize));
      params.set("sort", sort);
      params.set("dir", dir);

      const url = `${API_BASE}/api/staff/appointments?${params.toString()}`;
      const res = await fetch(url, { headers: { ...getAuthHeaders() } });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data?.error ||
            data?.message ||
            `Failed to load appointments (status ${res.status})`
        );
        setAppointments([]);
        setCount(0);
      } else {
        const items = Array.isArray(data.items)
          ? data.items.map(mapServerToLocal)
          : [];
        setAppointments(items);
        setCount(data.count || items.length);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError("Network error while fetching appointments");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sort, dir, JSON.stringify(filters)]);

  // handlers for actions
  const handleConfirm = async (id) => {
    setLoading(id, true);
    try {
      const { status, ok, data } = await postJson(
        `${API_BASE}/api/staff/appointments/confirm`,
        { appointment_id: String(id) }
      );
      if (ok) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: "Confirmed" } : a))
        );
      } else {
        alert(
          data?.message || data?.error || `Failed to confirm (status ${status})`
        );
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      alert("Network error while confirming appointment");
    } finally {
      setLoading(id, false);
    }
  };

  const handleCancel = async (id) => {
    const reason = prompt("Enter cancellation reason (optional):");
    setLoading(id, true);
    try {
      const { status, ok, data } = await postJson(
        `${API_BASE}/api/staff/appointments/cancel`,
        { appointment_id: String(id), reason }
      );
      if (ok) {
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: "Canceled" } : a))
        );
      } else {
        alert(
          data?.message || data?.error || `Failed to cancel (status ${status})`
        );
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      alert("Network error while canceling appointment");
    } finally {
      setLoading(id, false);
    }
  };

  const handleReschedule = async (id) => {
    const newDate = prompt("Enter new date (YYYY-MM-DD):");
    if (!newDate) return;
    const newTime = prompt("Enter new time (HH:mm or HH:mm:ss):");
    if (!newTime) return;
    setLoading(id, true);
    try {
      const { status, ok, data } = await postJson(
        `${API_BASE}/api/staff/appointments/reschedule`,
        { appointment_id: String(id), Date: newDate, Time: newTime }
      );
      if (ok) {
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === id
              ? { ...a, date: newDate, time: newTime, status: "Rescheduled" }
              : a
          )
        );
      } else {
        alert(
          data?.message ||
            data?.error ||
            `Failed to reschedule (status ${status})`
        );
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      alert("Network error while rescheduling appointment");
    } finally {
      setLoading(id, false);
    }
  };

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
        <div className="w-full max-w-6xl rounded-3xl bg-white/85 backdrop-blur-xl border border-white/70 shadow-[0_16px_50px_rgba(15,23,42,0.12)] px-5 sm:px-7 py-6 space-y-6">
          {/* title */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
                Appointment confirmation
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                Review requests, confirm, cancel, or reschedule from this queue.
              </p>
            </div>
            <span className="text-[11px] sm:text-xs px-3 py-1 rounded-full bg-sky-50 text-sky-700 font-medium">
              {loadingList ? "Loading..." : `${count} results`}
            </span>
          </div>

          {/* filters */}
          <section className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Date
                </label>
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, date: e.target.value }))
                  }
                  className="mt-1 block w-full border border-slate-200 rounded px-2 py-1 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Doctor (name)
                </label>
                <input
                  type="text"
                  placeholder="Doctor substring"
                  value={filters.doctor_name}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, doctor_name: e.target.value }))
                  }
                  className="mt-1 block w-full border border-slate-200 rounded px-2 py-1 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Department
                </label>
                <input
                  type="text"
                  placeholder="Department"
                  value={filters.department}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, department: e.target.value }))
                  }
                  className="mt-1 block w-full border border-slate-200 rounded px-2 py-1 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Patient name
                </label>
                <input
                  type="text"
                  placeholder="Patient substring"
                  value={filters.patient_name}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, patient_name: e.target.value }))
                  }
                  className="mt-1 block w-full border border-slate-200 rounded px-2 py-1 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, status: e.target.value }))
                  }
                  className="mt-1 block w-full border border-slate-200 rounded px-2 py-1 text-sm"
                >
                  <option value="">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Canceled">Canceled</option>
                  <option value="Rescheduled">Rescheduled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Sort / page
                </label>
                <div className="flex gap-2 mt-1">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="border border-slate-200 rounded px-2 py-1 text-sm"
                  >
                    <option value="date">Date</option>
                    <option value="created">Created</option>
                  </select>
                  <select
                    value={dir}
                    onChange={(e) => setDir(e.target.value)}
                    className="border border-slate-200 rounded px-2 py-1 text-sm"
                  >
                    <option value="asc">Asc</option>
                    <option value="desc">Desc</option>
                  </select>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="border border-slate-200 rounded px-2 py-1 text-sm"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-2 items-center">
              <button
                onClick={() => {
                  setPage(1);
                  fetchAppointments();
                }}
                className="!bg-sky-600 text-white px-4 py-2 rounded text-xs sm:text-sm"
              >
                Apply
              </button>
              <button
                onClick={() => {
                  setFilters({
                    date: "",
                    from_date: "",
                    to_date: "",
                    status: "",
                    doctor_name: "",
                    department: "",
                    patient_name: "",
                  });
                  setPage(1);
                  fetchAppointments();
                }}
                className="!bg-slate-200 px-4 py-2 rounded text-xs sm:text-sm"
              >
                Clear
              </button>
              <button
                onClick={fetchAppointments}
                className="!bg-slate-200 border border-slate-200 px-4 py-2 rounded text-xs sm:text-sm"
              >
                Refresh
              </button>
              <div className="ml-auto text-[11px] sm:text-xs text-slate-600">
                {loadingList ? "Loading..." : `${count} results`}
              </div>
            </div>
          </section>

          {error && (
            <div className="text-xs sm:text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-2xl px-4 py-2">
              {error}
            </div>
          )}

          {/* appointments list as cards */}
          {appointments.length === 0 && !loadingList ? (
            <p className="text-sm text-slate-600">
              No appointment requests at the moment.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {appointments.map(({ id, patient, doctor, date, time, status }) => {
                const isLoading = loadingIds.includes(id);
                return (
                  <div
                    key={id}
                    className="border border-slate-100 rounded-2xl shadow-sm bg-slate-50 px-4 py-3 flex flex-col justify-between gap-2 text-xs sm:text-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900 truncate">
                          {patient}
                        </p>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            status === "Confirmed"
                              ? "bg-emerald-50 text-emerald-700"
                              : status === "Canceled"
                              ? "bg-rose-50 text-rose-700"
                              : status === "Rescheduled"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-sky-50 text-sky-700"
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                      <p className="text-slate-700">
                        <span className="font-medium">Doctor:</span> {doctor}
                      </p>
                      <p className="text-slate-700">
                        <span className="font-medium">When:</span> {date} ·{" "}
                        {time}
                      </p>
                    </div>

                    <div className="flex gap-2 flex-wrap mt-2">
                      <button
                        onClick={() => handleConfirm(id)}
                        disabled={
                          status === "Confirmed" ||
                          status === "Canceled" ||
                          isLoading
                        }
                        className="px-3 py-1 rounded !bg-emerald-700 text-white text-[11px] font-semibold hover:bg-emerald-700 disabled:bg-slate-300"
                      >
                        {isLoading ? "Processing..." : "Confirm"}
                      </button>
                      <button
                        onClick={() => handleCancel(id)}
                        disabled={status === "Canceled" || isLoading}
                        className="px-3 py-1 rounded !bg-rose-500 text-white text-[11px] font-semibold hover:bg-rose-700 disabled:bg-slate-300"
                      >
                        {isLoading ? "Processing..." : "Cancel"}
                      </button>
                      <button
                        onClick={() => handleReschedule(id)}
                        disabled={status === "Canceled" || isLoading}
                        className="px-3 py-1 rounded !bg-amber-300 text-white text-[11px] font-semibold hover:bg-amber-600 disabled:bg-slate-300"
                      >
                        {isLoading ? "Processing..." : "Reschedule"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* pagination */}
          {count > 0 && (
            <div className="mt-4 flex items-center gap-3 text-xs sm:text-sm">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 !bg-slate-200 rounded disabled:opacity-50"
              >
                Prev
              </button>
              <div className="text-slate-700 ">
                Page {page}
                {count
                  ? ` of ${Math.max(1, Math.ceil(count / pageSize))}`
                  : ""}
              </div>
              <button
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 !bg-slate-200 rounded"
              >
                Next
              </button>
              <div className="ml-auto text-[11px] sm:text-xs text-slate-600">
                Total: {count}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AppointmentConfirmation;
