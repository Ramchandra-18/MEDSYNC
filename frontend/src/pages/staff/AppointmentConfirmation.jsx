import React, { useState, useEffect } from "react";
import StaffHeader from "../../Components/StaffHeader";



const mockAppointments = [
  { id: 1, patient: "John Doe", doctor: "Dr. Alice Smith", date: "2025-08-22", time: "10:00", status: "Pending" },
  { id: 2, patient: "Mary Jane", doctor: "Dr. Bob Johnson", date: "2025-08-23", time: "13:00", status: "Pending" },
  { id: 3, patient: "Paul Adams", doctor: "Dr. Alice Smith", date: "2025-08-24", time: "09:00", status: "Pending" },
];

const AppointmentConfirmation = () => {
  const [appointments, setAppointments] = useState([]);
  const [loadingIds, setLoadingIds] = useState([]); // keep track of appointments being processed
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState("");

  // list params
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sort, setSort] = useState("date");
  const [dir, setDir] = useState("asc");
  const [filters, setFilters] = useState({ date: "", from_date: "", to_date: "", status: "", doctor_name: "", department: "", patient_name: "" });
  const [count, setCount] = useState(0);

  const API_BASE = import.meta.env.VITE_API_BASE || "http://192.168.1.15:5000";

  const getAuthHeaders = () => {
    const token = localStorage.getItem("jwtToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const setLoading = (id, isLoading) => {
    setLoadingIds((prev) => (isLoading ? [...prev, id] : prev.filter((x) => x !== id)));
  };

  const postJson = async (url, body) => {
    const headers = { "Content-Type": "application/json", ...getAuthHeaders() };
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, data };
  };

  // map server appointment shape to local display shape
  const mapServerToLocal = (s) => {
    return {
      id: s.id || s.appointment_id || s.appointmentId || s.uuid || s._id || s.appointment_id,
      patient: s.full_name || s.patient_name || s.patient || s.Full_Name || "",
      doctor: s.doctor_name || s.doctor || s.Doctor_name || "",
      date: s.appointment_date || s.Date || s.date || "",
      time: (s.appointment_time || s.Time || s.time || "").slice(0,5),
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
        setError(data?.error || data?.message || `Failed to load appointments (status ${res.status})`);
        setAppointments([]);
        setCount(0);
      } else {
        const items = Array.isArray(data.items) ? data.items.map(mapServerToLocal) : [];
        setAppointments(items);
        setCount(data.count || (items.length));
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
      const { status, ok, data } = await postJson(`${API_BASE}/api/staff/appointments/confirm`, { appointment_id: String(id) });
      if (ok) {
        setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "Confirmed" } : a)));
      } else {
        alert(data?.message || data?.error || `Failed to confirm (status ${status})`);
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
      const { status, ok, data } = await postJson(`${API_BASE}/api/staff/appointments/cancel`, { appointment_id: String(id), reason });
      if (ok) {
        setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "Canceled" } : a)));
      } else {
        alert(data?.message || data?.error || `Failed to cancel (status ${status})`);
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
      const { status, ok, data } = await postJson(`${API_BASE}/api/staff/appointments/reschedule`, { appointment_id: String(id), Date: newDate, Time: newTime });
      if (ok) {
        setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, date: newDate, time: newTime, status: "Rescheduled" } : a)));
      } else {
        alert(data?.message || data?.error || `Failed to reschedule (status ${status})`);
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
    <div
      className="h-screen w-screen mt-10 mx-auto p-10 font-sans bg-[url('https://images.pexels.com/photos/6129043/pexels-photo-6129043.jpeg')] bg-cover bg-center rounded-3xl shadow-lg space-y-10 overflow-auto"
      style={{ maxHeight: "100vh" }}
    >
     {/* Fixed Header */}
     <header className="fixed top-0 left-0 right-0 z-50">
        <StaffHeader />
      </header>
      {/* Appointment Confirmation Section */}
      <section>
        <h1 className="text-3xl font-bold mb-6 bg-white/70 text-blue-700">Appointment Confirmation</h1>
        {/* Filters and controls */}
        <div className="mb-6 bg-white/70 p-4 rounded shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">Date</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
                className="mt-1 block w-full border rounded px-2 py-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Doctor (name)</label>
              <input
                type="text"
                placeholder="Doctor substring"
                value={filters.doctor_name}
                onChange={(e) => setFilters((f) => ({ ...f, doctor_name: e.target.value }))}
                className="mt-1 block w-full border rounded px-2 py-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Department</label>
              <input
                type="text"
                placeholder="Department"
                value={filters.department}
                onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}
                className="mt-1 block w-full border rounded px-2 py-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium">Patient name</label>
              <input
                type="text"
                placeholder="Patient substring"
                value={filters.patient_name}
                onChange={(e) => setFilters((f) => ({ ...f, patient_name: e.target.value }))}
                className="mt-1 block w-full border rounded px-2 py-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                className="mt-1 block w-full border rounded px-2 py-1"
              >
                <option value="">All</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Canceled">Canceled</option>
                <option value="Rescheduled">Rescheduled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Sort</label>
              <div className="flex gap-2 mt-1">
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="border rounded px-2 py-1">
                  <option value="date">Date</option>
                  <option value="created">Created</option>
                </select>
                <select value={dir} onChange={(e) => setDir(e.target.value)} className="border rounded px-2 py-1">
                  <option value="asc">Asc</option>
                  <option value="desc">Desc</option>
                </select>
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="border rounded px-2 py-1">
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => { setPage(1); fetchAppointments(); }}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Apply
            </button>
            <button
              onClick={() => { setFilters({ date: "", from_date: "", to_date: "", status: "", doctor_name: "", department: "", patient_name: "" }); setPage(1); fetchAppointments(); }}
              className="bg-gray-200 px-4 py-2 rounded"
            >
              Clear
            </button>
            <button
              onClick={() => fetchAppointments()}
              className="bg-white border px-4 py-2 rounded"
            >
              Refresh
            </button>
            <div className="ml-auto text-sm text-gray-600 self-center">{loadingList ? 'Loading...' : `${count} results`}</div>
          </div>
        </div>
        {appointments.length === 0 ? (
          <p className="text-black">No appointment requests at the moment.</p>
        ) : (
          <ul className="space-y-4">
            {appointments.map(({ id, patient, doctor, date, time, status }) => (
              <li
                key={id}
                className="border p-4 rounded shadow bg-gray-50 flex flex-col text-black md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <p><strong>Patient:</strong> {patient}</p>
                  <p><strong>Doctor:</strong> {doctor}</p>
                  <p><strong>Date & Time:</strong> {date} at {time}</p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      className={`font-semibold ${
                        status === "Confirmed"
                          ? "text-green-600"
                          : status === "Canceled"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {status}
                    </span>
                  </p>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleConfirm(id)}
                    disabled={status === "Confirmed" || status === "Canceled" || loadingIds.includes(id)}
                    className="px-3 py-1 !bg-green-600 text-white rounded hover:text-black disabled:bg-gray-300"
                  >
                    {loadingIds.includes(id) ? 'Processing...' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => handleCancel(id)}
                    disabled={status === "Canceled" || loadingIds.includes(id)}
                    className="px-3 py-1 !bg-red-600 text-white rounded hover:text-black disabled:bg-gray-300"
                  >
                    {loadingIds.includes(id) ? 'Processing...' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => handleReschedule(id)}
                    disabled={status === "Canceled" || loadingIds.includes(id)}
                    className="px-3 py-1 !bg-yellow-500 text-white rounded hover:text-black disabled:bg-gray-300"
                  >
                    {loadingIds.includes(id) ? 'Processing...' : 'Reschedule'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {/* Pagination controls */}
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <div className="text-sm text-gray-700">Page {page} {count ? `of ${Math.max(1, Math.ceil(count / pageSize))}` : ''}</div>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 bg-gray-200 rounded"
          >
            Next
          </button>
          <div className="ml-auto text-sm text-gray-600">Total: {count}</div>
        </div>
      </section>
  
    </div>
  );
};

export default AppointmentConfirmation;
