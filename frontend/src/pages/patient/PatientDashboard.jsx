import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PatientHeader from "../../Components/PatientHeader";
import PatientFooter from "../../Components/PatientFooter";
import { getFullNameFromToken } from "../../utils/jwt";
import {
  FaCalendarAlt,
  FaFilePrescription,
  FaClipboardCheck,
  FaHistory,
  FaBell,
  FaHeart,
  FaMobileAlt,
} from "react-icons/fa";

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [animateIn, setAnimateIn] = useState(false);

  const user =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(localStorage.getItem("currentUser") || "null");
  const token = localStorage.getItem("jwtToken");
  const fullNameFromToken = getFullNameFromToken(token);
  const displayName =
    fullNameFromToken || user?.full_name || user?.name || "Patient";

  // In real app, fetch these
  const wellnessScore = 82; // /100
  const nextAppointment = {
    time: "Thu, 19 Dec · 10:30 AM",
    dept: "Cardiology",
    doctor: "Dr. Arjun Rao",
  };

  useEffect(() => {
    const t = setTimeout(() => setAnimateIn(true), 180);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50 text-slate-900 flex flex-col">
      {/* soft background accents */}
      <div className="pointer-events-none fixed inset-0 opacity-60 mix-blend-multiply">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-sky-200 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-emerald-200 blur-3xl" />
      </div>

      <div className="fixed top-0 left-0 right-0 z-40">
        <PatientHeader />
      </div>

      <main
        className={`relative z-10 flex-grow pt-24 pb-10 px-4 sm:px-8 lg:px-16 transition-all duration-700 ${
          animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Hero wellness strip */}
          <section className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/70 shadow-[0_16px_50px_rgba(15,23,42,0.10)] px-5 sm:px-8 py-6 flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.18em] text-sky-600">
                MedSync patient space
              </p>
              <h1 className="text-2xl sm:text-3xl font-semibold">
                Hello,{" "}
                <span className="bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">
                  {displayName}
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-xl">
                This is your personal dashboard. See your upcoming visit, current
                prescriptions, and simple guidance to stay on top of your health.
              </p>
            </div>

            {/* Wellness score + next appointment */}
            <div className="flex flex-col gap-4 w-full lg:w-80">
              <div className="rounded-2xl bg-slate-900 text-slate-50 px-4 py-3 shadow-lg">
                <p className="text-[11px] uppercase tracking-[0.18em] text-sky-300 mb-2">
                  Wellness score
                </p>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-3xl font-semibold">{wellnessScore}</p>
                    <p className="text-xs text-slate-300">
                      Based on activity, vitals, and recent visits.
                    </p>
                  </div>
                  <div className="h-14 w-14 rounded-full border border-sky-400/40 flex items-center justify-center">
                    <FaHeart className="text-sky-300 text-xl" />
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 text-xs sm:text-sm">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-1">
                  Next appointment
                </p>
                <p className="font-medium text-slate-900">
                  {nextAppointment.time}
                </p>
                <p className="text-slate-600 mt-1">
                  {nextAppointment.dept} · {nextAppointment.doctor}
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/patient/appointments")}
                  className="mt-2 text-[11px] font-semibold text-sky-600 hover:text-emerald-600"
                >
                  View all appointments →
                </button>
              </div>
            </div>
          </section>

          {/* Two-column main area */}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.2fr)]">
            {/* LEFT: quick access and shortcuts */}
            <div className="space-y-5">
              {/* Quick access row */}
              <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/patient/appointments")}
                  className="rounded-2xl bg-sky-50 border border-sky-100 px-3 py-3 text-left text-xs sm:text-sm flex flex-col gap-2 hover:-translate-y-1 hover:shadow-sm transition"
                >
                  <div className="flex items-center gap-2 text-sky-700">
                    <FaCalendarAlt />
                    <span className="font-semibold">Appointments</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Book or reschedule visits.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/patient/prescriptions")}
                  className="rounded-2xl bg-emerald-50 border border-emerald-100 px-3 py-3 text-left text-xs sm:text-sm flex flex-col gap-2 hover:-translate-y-1 hover:shadow-sm transition"
                >
                  <div className="flex items-center gap-2 text-emerald-700">
                    <FaFilePrescription />
                    <span className="font-semibold">Prescriptions</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    See your current medicines.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/patient/records")}
                  className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-3 text-left text-xs sm:text-sm flex flex-col gap-2 hover:-translate-y-1 hover:shadow-sm transition"
                >
                  <div className="flex items-center gap-2 text-slate-800">
                    <FaHistory />
                    <span className="font-semibold">Records</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Lab reports & history.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/patient/notifications")}
                  className="rounded-2xl bg-amber-50 border border-amber-100 px-3 py-3 text-left text-xs sm:text-sm flex flex-col gap-2 hover:-translate-y-1 hover:shadow-sm transition"
                >
                  <div className="flex items-center gap-2 text-amber-700">
                    <FaBell />
                    <span className="font-semibold">Alerts</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Reminders & updates.
                  </p>
                </button>
              </section>

              {/* Health journey (timeline style list) */}
              <section className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/70 shadow-sm px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Recent health journey
                  </h3>
                  <span className="text-[11px] text-sky-600 cursor-pointer hover:text-emerald-600">
                    View full history
                  </span>
                </div>
                <ol className="relative border-l border-slate-200 ml-2 text-xs sm:text-sm space-y-4">
                  <li className="ml-3">
                    <div className="absolute -left-2.5 mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <p className="font-medium text-slate-900">
                      Cardiology follow-up
                    </p>
                    <p className="text-slate-500">
                      25 Nov 2025 · ECG and consultation, medication adjusted.
                    </p>
                  </li>
                  <li className="ml-3">
                    <div className="absolute -left-2.5 mt-1 h-2.5 w-2.5 rounded-full bg-sky-500" />
                    <p className="font-medium text-slate-900">
                      Lab tests completed
                    </p>
                    <p className="text-slate-500">
                      18 Nov 2025 · Blood work and lipid profile.
                    </p>
                  </li>
                  <li className="ml-3">
                    <div className="absolute -left-2.5 mt-1 h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <p className="font-medium text-slate-900">
                      Initial consultation
                    </p>
                    <p className="text-slate-500">
                      05 Nov 2025 · First visit to MedSync Hospital.
                    </p>
                  </li>
                </ol>
              </section>

              {/* Support card */}
              <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-sky-900 to-slate-900 text-slate-50 px-5 py-4 shadow-[0_12px_40px_rgba(15,23,42,0.50)] flex items-center justify-between gap-4">
                <div className="space-y-1 text-xs sm:text-sm">
                  <p className="uppercase tracking-[0.18em] text-sky-300 text-[10px]">
                    Need assistance?
                  </p>
                  <p className="font-medium">
                    Talk to support or your care team directly.
                  </p>
                  <p className="text-slate-300">
                    For emergencies, always contact local emergency services.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/patient/support")}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition"
                >
                  <FaMobileAlt />
                  Contact support
                </button>
              </section>
            </div>

            {/* RIGHT: cards focused on the patient experience */}
            <aside className="space-y-4">
              {/* “My day” card */}
              <section className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/70 shadow-sm px-5 py-5 text-xs sm:text-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-3">
                  My day with MedSync
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 h-2 w-2 rounded-full bg-emerald-500" />
                    <div>
                      <p className="font-medium text-slate-900">
                        Morning check-in
                      </p>
                      <p className="text-slate-600">
                        Take prescribed meds and log how you feel in your
                        notes.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 h-2 w-2 rounded-full bg-sky-500" />
                    <div>
                      <p className="font-medium text-slate-900">
                        Activity reminder
                      </p>
                      <p className="text-slate-600">
                        Aim for at least 20–30 minutes of light activity.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 h-2 w-2 rounded-full bg-amber-500" />
                    <div>
                      <p className="font-medium text-slate-900">
                        Evening review
                      </p>
                      <p className="text-slate-600">
                        Note any unusual symptoms to discuss in your next visit.
                      </p>
                    </div>
                  </li>
                </ul>
              </section>

              {/* Simple highlights */}
              <section className="rounded-3xl bg-slate-50/80 border border-slate-100 px-5 py-4 text-xs sm:text-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-2">
                  Highlights
                </p>
                <div className="space-y-2">
                  <p className="text-slate-700">
                    • No pending hospital bills right now.
                  </p>
                  <p className="text-slate-700">
                    • 1 prescription is active and synced with MedSync pharmacy.
                  </p>
                  <p className="text-slate-700">
                    • You have 2 upcoming visits scheduled.
                  </p>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>

      <PatientFooter />
    </div>
  );
};

export default PatientDashboard;
