import React, { useEffect, useState } from 'react';
import { FiUser, FiRefreshCw, FiMail, FiCalendar, FiEye } from 'react-icons/fi';

const Avatar = ({ name, large }) => (
  <div className={`flex items-center justify-center rounded-full shadow-inner font-bold text-blue-700 ${large ? 'w-16 h-16 text-3xl bg-indigo-100' : 'w-10 h-10 text-xl bg-blue-200'}`}>
    {name ? name.match(/\b(\w)/g).join('') : <FiUser className={large ? 'text-3xl' : 'text-2xl'} />}
  </div>
);

const StatusBadge = ({ status }) => (
  <span
    className={`inline-block px-3 py-1 rounded-lg font-semibold text-xs tracking-wide ${
      status === 'Confirmed'
        ? 'bg-green-100 text-green-700'
        : status === 'Canceled'
        ? 'bg-red-100 text-red-700'
        : 'bg-yellow-100 text-yellow-700'
    }`}
  >
    {status}
  </span>
);

const Skeleton = () => (
  <div className="animate-pulse flex justify-between items-center py-4 px-2">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gray-200 rounded-full" />
      <div className="h-4 w-36 bg-gray-200 rounded mb-1" />
    </div>
    <div className="h-6 w-24 bg-gray-200 rounded" />
  </div>
);

const TodaysAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [date, setDate] = useState(null);
  const [doctorName, setDoctorName] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('jwtToken');
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://10.134.68.186:5000';
  const getApiBase = () => {
    if (!API_BASE) return null;
    let base = API_BASE.replace(/\/+$/g, '');
    if (/\/api(\/|$)/i.test(base)) return base;
    return base + '/api';
  };
  const NORMALIZED_API_BASE = getApiBase();

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!token) throw new Error('Not authenticated');
      if (!NORMALIZED_API_BASE)
        throw new Error('VITE_API_BASE is not set. Please add it to your .env and restart the dev server.');
      const url = `${NORMALIZED_API_BASE}/doctor/todays-appointments`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `Request failed with status ${res.status}`);
      }
      const data = await res.json();
      setAppointments(Array.isArray(data.appointments) ? data.appointments : []);
      setDate(data.date || null);
      setDoctorName(data.doctor_name || null);
      setTotal(typeof data.total === 'number' ? data.total : (data.appointments || []).length);
    } catch (err) {
      const msg = err?.message || 'Failed to load appointments';
      if (
        msg.toLowerCase().includes('failed to fetch') ||
        msg.toLowerCase().includes('networkrequest failed') ||
        msg.toLowerCase().includes('networkerror')
      ) {
        setError(
          `Failed to fetch from ${NORMALIZED_API_BASE || API_BASE}. Possible causes: backend not running, incorrect VITE_API_BASE, or CORS blocking the request. Check the API server and CORS settings.`
        );
      } else {
        setError(msg);
      }
      setAppointments([]);
      setDate(null);
      setDoctorName(null);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Example of a handler - customize as needed (e.g., open modal, navigate)
  const handleViewClick = (appointment) => {
    alert(`Viewing appointment for ${appointment.full_name}\n\nYou can replace this alert with your modal or navigation logic.`);
  };

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-indigo-100 via-sky-50 to-blue-100 flex flex-col font-sans">
      <header className="w-full py-8 px-4 md:px-12 bg-white/70 flex flex-col md:flex-row md:items-center md:justify-between shadow-lg">
        <div className="flex items-center gap-6">
          <Avatar name={doctorName} large />
          <div>
            <div className="text-2xl font-semibold text-indigo-900">
              Hello, {doctorName ? doctorName.split(' ')[0] : 'Doctor'}!
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
              <FiCalendar />
              <span>
                {date
                  ? new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
                  : new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={fetchAppointments}
          className="flex items-center gap-2 px-5 py-2 !bg-blue-600 text-white rounded-lg shadow-md hover:bg-indigo-800 mt-8 md:mt-0 transition"
        >
          <FiRefreshCw /> Refresh
        </button>
      </header>

      <main className="flex-1 w-full flex justify-center items-stretch py-6 md:py-10">
        <div className="bg-white/90 border border-blue-100 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-4xl h-full flex flex-col mx-2 md:mx-auto p-0 md:p-0 overflow-hidden">
          <div className="flex items-center justify-between px-8 py-4 border-b">
            <div className="text-lg font-bold text-blue-700">
              Today's Appointments
            </div>
            <div className="text-blue-900 font-semibold">
              {total} {total === 1 ? 'appointment' : 'appointments'}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 md:px-7 md:py-6 space-y-6">
            {loading && (
              <div>
                {Array(4)
                  .fill(0)
                  .map((_, idx) => (
                    <Skeleton key={idx} />
                  ))}
              </div>
            )}
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">{error}</div>
            )}
            {!loading && !error && appointments.length === 0 && (
              <div className="text-gray-700 text-center py-16 text-lg font-medium">
                No appointments scheduled for today.
              </div>
            )}
            {!loading &&
              appointments.length > 0 &&
              appointments.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-col md:flex-row md:items-center justify-between bg-white/90 border border-blue-100 shadow rounded-2xl px-5 py-4 transition hover:shadow-lg"
                >
                  <div className="flex items-center gap-4 mb-3 md:mb-0">
                    <Avatar name={a.full_name} />
                    <div>
                      <div className="font-bold text-indigo-900 text-xl">{a.full_name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        <span className="inline-block">{a.department}</span> • <span>{a.patient_id}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <FiMail /> {a.patient_email}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Created: {a.created_at ? new Date(a.created_at).toLocaleString() : '—'}</div>
                    </div>
                  </div>
                  <div className="flex flex-col md:items-end space-y-2 md:space-y-0 md:gap-3">
                    <div className="flex gap-2 items-center mb-2 md:mb-0">
                      <StatusBadge status={a.status} />
                      <button
                        className="flex items-center gap-1 px-3 py-1 !bg-indigo-600 text-white rounded-lg font-medium shadow hover:bg-indigo-800 transition text-xs"
                        onClick={() => handleViewClick(a)}
                        title="View Details"
                      >
                        <FiEye /> View
                      </button>
                    </div>
                    <div className="font-semibold text-blue-800 text-lg text-right">{a.appointment_time}</div>
                    <div className="text-xs text-gray-500 text-right">{a.appointment_date}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TodaysAppointments;
