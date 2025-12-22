import React, { useEffect, useState } from "react";
import { FiUser, FiRefreshCw, FiMail, FiCalendar, FiEye, FiCreditCard, FiCheckCircle, FiSmartphone, FiShield, FiClock } from "react-icons/fi";

// Avatar, StatusBadge, Skeleton components remain exactly the same...
const Avatar = ({ name, large }) => (
  <div
    className={`flex items-center justify-center rounded-full shadow-inner font-bold text-sky-700 ${
      large
        ? "w-16 h-16 text-3xl bg-sky-100"
        : "w-10 h-10 text-xl bg-sky-200"
    }`}
  >
    {name && name.match(/\b(\w)/g)
      ? name.match(/\b(\w)/g).join("")
      : <FiUser className={large ? "text-3xl" : "text-2xl"} />}
  </div>
);

const StatusBadge = ({ status }) => (
  <span
    className={`inline-block px-3 py-1 rounded-lg font-semibold text-[11px] tracking-wide ${
      status === "Confirmed"
        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
        : status === "Canceled"
        ? "bg-rose-50 text-rose-700 border border-rose-100"
        : status === "paid"
        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
        : "bg-amber-50 text-amber-700 border border-amber-100"
    }`}
  >
    {status}
  </span>
);

const Skeleton = () => (
  <div className="animate-pulse flex justify-between items-center py-4 px-2">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-slate-200 rounded-full" />
      <div className="h-4 w-36 bg-slate-200 rounded mb-1" />
    </div>
    <div className="h-6 w-24 bg-slate-200 rounded" />
  </div>
);

const TodaysAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [date, setDate] = useState(null);
  const [doctorName, setDoctorName] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  // 🚀 OTP PAYMENT STATES
  const [paymentStep, setPaymentStep] = useState(null); // 'initiate', 'otp_sent', 'verify', 'success'
  const [paymentLoading, setPaymentLoading] = useState(null);
  const [otpTimer, setOtpTimer] = useState(null);
  const [recentlyPaid, setRecentlyPaid] = useState(null);

  const token = localStorage.getItem("jwtToken");
  const API_BASE = import.meta.env.VITE_API_BASE;

  const getApiBase = () => {
    if (!API_BASE) return null;
    let base = API_BASE.replace(/\/+$/g, "");
    if (/\/api(\/|$)/i.test(base)) return base;
    return base + "/api";
  };
  const NORMALIZED_API_BASE = getApiBase();

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!token) throw new Error("Not authenticated");
      if (!NORMALIZED_API_BASE)
        throw new Error(
          "VITE_API_BASE is not set. Please add it to your .env and restart the dev server."
        );
      const url = `${NORMALIZED_API_BASE}/doctor/todays-appointments`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `Request failed with status ${res.status}`);
      }
      const data = await res.json();
      setAppointments(
        Array.isArray(data.appointments) ? data.appointments : []
      );
      setDate(data.date || null);
      setDoctorName(data.doctor_name || null);
      setTotal(
        typeof data.total === "number"
          ? data.total
          : (data.appointments || []).length
      );
    } catch (err) {
      const msg = err?.message || "Failed to load appointments";
      if (
        msg.toLowerCase().includes("failed to fetch") ||
        msg.toLowerCase().includes("networkrequest failed") ||
        msg.toLowerCase().includes("networkerror")
      ) {
        setError(
          `Failed to fetch from ${
            NORMALIZED_API_BASE || API_BASE
          }. Backend may be down, VITE_API_BASE may be wrong, or CORS may be blocking the request.`
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

  // 🚀 STEP 1: Send OTP to patient
  const initiatePaymentOtp = async (appointment) => {
    setPaymentLoading(appointment.id);
    setPaymentStep('initiate');
    
    try {
      const res = await fetch(`${NORMALIZED_API_BASE}/doctor/appointment/${appointment.id}/payment-otp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setPaymentStep('otp_sent');
        setOtpTimer(300); // 5 minutes
        
        // Start OTP countdown
        const interval = setInterval(() => {
          setOtpTimer(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              setPaymentStep('expired');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        alert(`✅ OTP sent to ${appointment.full_name}! Ask patient to check email/SMS and enter OTP.`);
      } else {
        throw new Error(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('OTP initiation error:', err);
      alert(`❌ Failed to send OTP: ${err.message}`);
      setPaymentStep(null);
    } finally {
      setPaymentLoading(null);
    }
  };

  // 🚀 STEP 2: Verify patient OTP (doctor enters patient's OTP)
  const verifyPatientOtp = async (appointment) => {
    const patientOtp = window.prompt('Enter the 6-digit OTP patient received:');
    
    if (!patientOtp || patientOtp.length !== 6 || !/^\d{6}$/.test(patientOtp)) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }
    
    setPaymentLoading(appointment.id);
    setPaymentStep('verify');
    
    try {
      const res = await fetch(`${NORMALIZED_API_BASE}/doctor/appointment/${appointment.id}/verify-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ otp: patientOtp })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setPaymentStep('success');
        setRecentlyPaid(appointment.id);
        
        // Optimistically update UI
        setAppointments(prev => prev.map(a => 
          a.id === appointment.id 
            ? {...a, status: 'paid', payment_status: 'paid'}
            : a
        ));
        
        // Auto-refresh after success
        setTimeout(() => {
          fetchAppointments();
          setPaymentStep(null);
          setRecentlyPaid(null);
        }, 2000);
        
        alert('✅ Payment CONFIRMED! Appointment marked as PAID.');
      } else {
        throw new Error(data.error || 'Invalid OTP');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      alert(`❌ ${err.message}. Ask patient to check email for correct OTP.`);
      setPaymentStep('otp_sent'); // Back to waiting for OTP
    } finally {
      setPaymentLoading(null);
    }
  };

  // 🚀 Reset payment flow
  const resetPaymentFlow = () => {
    setPaymentStep(null);
    setOtpTimer(null);
    setPaymentLoading(null);
  };

  const handleViewClick = (appointment) => {
    setSelectedAppointment(appointment);
    setPaymentStep(null); // Reset payment flow when viewing
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const todayLabel = date
    ? new Date(date).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50 flex flex-col font-sans text-slate-900">
      {/* background accents */}
      <div className="pointer-events-none fixed inset-0 opacity-60 mix-blend-multiply">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-sky-200 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-emerald-200 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full py-6 px-4 md:px-10 bg-white/80 backdrop-blur-xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100">
        <div className="flex items-center gap-4">
          <Avatar name={doctorName} large />
          <div>
            <div className="text-xl sm:text-2xl font-semibold text-slate-900">
              Hello, {doctorName ? doctorName.split(" ")[0] : "Doctor"}!
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mt-1">
              <FiCalendar />
              <span>{todayLabel}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Today's appointment overview from your MedSync schedule.
            </p>
          </div>
        </div>
        <button
          onClick={fetchAppointments}
          className="mt-4 md:mt-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-sm hover:brightness-110"
        >
          <FiRefreshCw /> Refresh
        </button>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 w-full flex flex-col py-6 md:py-8">
        <div className="w-full max-w-4xl mx-2 md:mx-auto rounded-3xl bg-white/85 backdrop-blur-xl border border-white/70 shadow-[0_16px_50px_rgba(15,23,42,0.10)] flex flex-col overflow-hidden">
          {/* List header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="text-sm sm:text-base font-semibold text-slate-900">
              Today's appointments
            </div>
            <div className="text-xs sm:text-sm font-semibold text-sky-700">
              {total} {total === 1 ? "appointment" : "appointments"}
            </div>
          </div>

          {/* List body */}
          <div className="flex-1 overflow-y-auto px-3 py-3 md:px-6 md:py-5 space-y-4">
            {loading && (
              <div>
                {Array(4)
                  .fill(0)
                  .map((_, idx) => (
                    <Skeleton key={idx} />
                  ))}
              </div>
            )}

            {error && !loading && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm p-3 rounded-xl">
                {error}
              </div>
            )}

            {!loading && !error && appointments.length === 0 && (
              <div className="text-slate-500 text-center py-12 text-sm sm:text-base font-medium">
                No appointments scheduled for today.
              </div>
            )}

            {!loading &&
              !error &&
              appointments.length > 0 &&
              appointments.map((a) => (
                <div
                  key={a.id}
                  className={`flex flex-col md:flex-row md:items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 shadow-sm hover:shadow-md transition ${
                    // ✅ HIGHLIGHT RECENTLY PAID APPOINTMENTS
                    recentlyPaid === a.id 
                      ? 'ring-4 ring-emerald-200 bg-emerald-50/50 animate-pulse' 
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2 md:mb-0">
                    <Avatar name={a.full_name} />
                    <div>
                      <div className="font-semibold text-slate-900 text-sm sm:text-base">
                        {a.full_name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {a.department || "Department"} · {a.patient_id || "ID"}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <FiMail className="text-[11px]" />{" "}
                        {a.patient_email || "No email"}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Created:{" "}
                        {a.created_at
                          ? new Date(a.created_at).toLocaleString()
                          : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-1">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={a.status} />
                      {/* ✅ FEE DISPLAY IN LIST */}
                      {a.fee && (
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full shadow-sm">
                          ₹{a.fee}
                        </span>
                      )}
                      <button
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg !bg-sky-600 text-white text-[11px] font-semibold shadow hover:bg-sky-700"
                        onClick={() => handleViewClick(a)}
                        title="View details"
                      >
                        <FiEye /> View
                      </button>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 text-right">
                      {a.appointment_time}
                    </div>
                    <div className="text-[11px] text-slate-500 text-right">
                      {a.appointment_date}
                    </div>
                  </div>
                </div>
              ))}

            {/* ✅ NEW: Recent Payment Celebration Banner */}
            {recentlyPaid && (
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-4 rounded-2xl shadow-2xl animate-bounce">
                <div className="flex items-center gap-3">
                  <FiCheckCircle className="text-2xl" />
                  <div>
                    <div className="font-semibold text-lg">Payment Confirmed!</div>
                    <div className="text-sm opacity-90">List refreshed successfully...</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 🚀 PERFECTED OTP PAYMENT SECTION */}
        {selectedAppointment && (
          <section className="w-full max-w-4xl mx-2 md:mx-auto mt-4">
            <div className="rounded-3xl bg-white/95 border border-slate-100 shadow-[0_12px_40px_rgba(15,23,42,0.18)] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                  Appointment details
                </h2>
                <button
                  onClick={() => {
                    setSelectedAppointment(null);
                    resetPaymentFlow();
                  }}
                  className="text-[11px] text-rose-600 hover:text-rose-700 !bg-transparent font-semibold"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
                {/* Patient */}
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-100">
                  <div className="text-[11px] font-semibold text-slate-500">Patient</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {selectedAppointment.full_name}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    ID: {selectedAppointment.patient_id || "—"}
                  </div>
                </div>

                {/* Contact */}
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="text-[11px] font-semibold text-slate-500">Contact</div>
                  <div className="flex items-center gap-1 text-xs text-slate-700">
                    <FiMail /> {selectedAppointment.patient_email || "—"}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    Phone: {selectedAppointment.phone || "—"}
                  </div>
                </div>

                {/* Appointment */}
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                  <div className="text-[11px] font-semibold text-slate-500">Appointment</div>
                  <div className="text-xs text-slate-800">
                    {selectedAppointment.appointment_date} ·{" "}
                    {selectedAppointment.appointment_time}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    Department: {selectedAppointment.department || "—"}
                  </div>
                </div>

                {/* Status */}
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="text-[11px] font-semibold text-slate-500">Status</div>
                  <StatusBadge status={selectedAppointment.status} />
                  <div className="text-[11px] text-slate-600 mt-1">
                    Created:{" "}
                    {selectedAppointment.created_at
                      ? new Date(
                          selectedAppointment.created_at
                        ).toLocaleString()
                      : "—"}
                  </div>
                </div>

                {selectedAppointment.symptoms && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 md:col-span-2">
                    <div className="text-[11px] font-semibold text-slate-500">Symptoms / notes</div>
                    <div className="text-xs text-slate-800 mt-1 whitespace-pre-line">
                      {selectedAppointment.symptoms}
                    </div>
                  </div>
                )}
              </div>

              {/* 🚀 ULTIMATE OTP PAYMENT FLOW */}
              <div className={`p-6 rounded-3xl border-4 shadow-2xl transition-all md:col-span-2 ${
                selectedAppointment.status === 'paid' 
                  ? 'bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 border-emerald-300 ring-4 ring-emerald-200/50'
                  : paymentStep 
                  ? 'bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-300 ring-2 ring-blue-200/50'
                  : 'bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 border-orange-300 hover:border-orange-400'
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="text-xl font-black text-slate-900 flex items-center gap-3">
                    {selectedAppointment.status === 'paid' ? (
                      <FiCheckCircle className="text-emerald-600 text-2xl animate-ping" />
                    ) : paymentStep ? (
                      <FiShield className="text-blue-600 text-2xl" />
                    ) : (
                      <FiCreditCard className="text-orange-600 text-2xl" />
                    )}
                    <span>Payment Status</span>
                  </div>
                  <div className="text-3xl font-black text-emerald-700 drop-shadow-lg">
                    ₹{selectedAppointment.fee || 500}
                  </div>
                </div>

                {selectedAppointment.status === 'paid' ? (
                  // ✅ PAID STATE
                  <div className="flex flex-col items-center justify-center gap-6 p-8 bg-gradient-to-r from-emerald-100/70 to-green-100/70 rounded-3xl border-4 border-emerald-200/60 shadow-2xl">
                    <div className="w-24 h-24 bg-white/90 rounded-3xl flex items-center justify-center shadow-xl">
                      <FiCheckCircle className="text-5xl text-emerald-600 drop-shadow-2xl animate-bounce" />
                    </div>
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-black text-emerald-800 tracking-tight">
                        Payment Confirmed ✓
                      </div>
                      <div className="text-lg font-semibold text-emerald-700 bg-emerald-200/60 px-6 py-3 rounded-2xl shadow-lg">
                        ₹{selectedAppointment.fee || 500} collected successfully
                      </div>
                    </div>
                  </div>

                ) : paymentStep === 'otp_sent' ? (
                  // ✅ OTP SENT - WAITING FOR PATIENT
                  <div className="flex flex-col items-center justify-center gap-6 p-8 bg-gradient-to-r from-blue-100/60 to-indigo-100/60 rounded-3xl border-4 border-blue-200/50 shadow-2xl animate-pulse">
                    <FiSmartphone className="text-6xl text-blue-600 drop-shadow-lg" />
                    <div className="text-center space-y-3">
                      <div className="text-xl font-black text-blue-800">
                        OTP Sent to Patient! 📧
                      </div>
                      <div className="text-lg font-semibold text-blue-700 bg-blue-200/50 px-6 py-3 rounded-2xl">
                        {selectedAppointment.full_name}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-blue-600 font-mono bg-white/80 px-4 py-2 rounded-xl shadow-md">
                        <FiClock />
                        {otpTimer ? (
                          <>
                            Expires in: <span className="text-2xl font-black text-blue-700">{Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}</span>
                          </>
                        ) : 'Expired'}
                      </div>
                      <button
                        onClick={() => verifyPatientOtp(selectedAppointment)}
                        disabled={!otpTimer || paymentLoading === selectedAppointment.id}
                        className="w-full max-w-md flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black rounded-2xl shadow-2xl hover:from-emerald-600 hover:shadow-3xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                      >
                        {paymentLoading === selectedAppointment.id ? (
                          <>
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/80 border-t-transparent" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <FiShield className="text-xl" />
                            Patient Entered OTP
                          </>
                        )}
                      </button>
                      <button
                        onClick={resetPaymentFlow}
                        className="text-sm text-blue-600 hover:text-blue-700 font-semibold px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                ) : paymentStep === 'success' ? (
                  // ✅ SUCCESS STATE
                  <div className="flex flex-col items-center justify-center gap-6 p-8 bg-gradient-to-r from-emerald-100/80 to-green-100/80 rounded-3xl border-4 border-emerald-200 shadow-2xl animate-pulse">
                    <FiCheckCircle className="text-6xl text-emerald-600 drop-shadow-2xl animate-bounce" />
                    <div className="text-center space-y-3">
                      <div className="text-2xl font-black text-emerald-800">
                        Payment Verified! ✅
                      </div>
                      <div className="text-lg font-semibold text-emerald-700 bg-emerald-200/70 px-6 py-3 rounded-2xl shadow-lg">
                        Status updated to PAID
                      </div>
                    </div>
                  </div>

                ) : (
                  // ✅ INITIAL PAYMENT BUTTON
                  <button
                    onClick={() => initiatePaymentOtp(selectedAppointment)}
                    disabled={paymentLoading === selectedAppointment.id || selectedAppointment.status === 'paid'}
                    className="w-full flex flex-col items-center justify-center gap-4 p-8 bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 text-white font-black rounded-3xl shadow-2xl hover:from-orange-600 hover:to-emerald-600 hover:shadow-3xl hover:scale-[1.02] transition-all duration-500 group disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none text-xl tracking-tight"
                  >
                    {paymentLoading === selectedAppointment.id ? (
                      <>
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-white/80 border-t-transparent" />
                        <span className="font-bold">Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <FiCreditCard className="text-4xl group-hover:rotate-12 group-hover:scale-110 transition-all duration-500" />
                        <div>
                          <span className="block font-black text-2xl tracking-wide">Receive Payment</span>
                          <span className="text-emerald-200 font-bold text-lg">₹{selectedAppointment.fee || 500}</span>
                          <div className="text-xs opacity-90 mt-1">Secure 2FA via patient OTP</div>
                        </div>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default TodaysAppointments;
