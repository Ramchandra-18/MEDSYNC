import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StaffHeader from "../../Components/StaffHeader";
import StaffFooter from "../../Components/StaffFooter";
import { getFullNameFromToken } from "../../utils/jwt";
import {
  FaCalendarPlus,
  FaClipboardList,
  FaUsers,
  FaUserMd,
  FaFileAlt,
  FaBell,
} from "react-icons/fa";

const stats = [
  {
    value: 12,
    label: "Today's appointments",
    color: "from-sky-400/15 via-sky-300/10 to-sky-400/5",
    icon: <FaCalendarPlus />,
  },
  {
    value: 5,
    label: "Doctors on duty",
    color: "from-indigo-400/15 via-indigo-300/10 to-indigo-400/5",
    icon: <FaUserMd />,
  },
  {
    value: 38,
    label: "Registered patients",
    color: "from-emerald-400/15 via-emerald-300/10 to-emerald-400/5",
    icon: <FaUsers />,
  },
];

const actions = [
  {
    label: "Manage appointments",
    icon: <FaClipboardList />,
    color: "from-sky-50 to-blue-50",
    desc: "View, reschedule, or cancel patient bookings.",
  },
  {
    label: "Doctor schedules",
    icon: <FaUserMd />,
    color: "from-indigo-50 to-sky-50",
    desc: "Keep track of doctor shifts and timings.",
  },
  {
    label: "Patient records",
    icon: <FaFileAlt />,
    color: "from-emerald-50 to-lime-50",
    desc: "Access, update, or archive medical records.",
  },
  {
    label: "Notifications",
    icon: <FaBell />,
    color: "from-amber-50 to-orange-50",
    desc: "Review alerts, reminders, and urgent messages.",
  },
];

const StaffDashboardMain = () => {
  const user =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(localStorage.getItem("currentUser") || "null");
  const token = localStorage.getItem("jwtToken");
  const fullNameFromToken = getFullNameFromToken(token);
  const displayName =
    fullNameFromToken ||
    user?.full_name ||
    user?.name ||
    user?.email ||
    "Staff";

  const navigate = useNavigate();
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  // toast state
  const [toast, setToast] = useState({
    visible: false,
    message: "",
  });

  const showComingSoon = () => {
    setToast({
      visible: true,
      message: "This feature is coming soon!!!!!.",
    });

    setTimeout(() => {
      setToast({
        visible: false,
        message: "",
      });
    }, 2500);
  };

  useEffect(() => {
    const t = setTimeout(() => setAnimateIn(true), 200);
    return () => clearTimeout(t);
  }, []);

  const toggleBookingForm = () => {
    setShowBookingForm((prev) => !prev);
  };

  const handleStaffBook = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const prefill = {
      fullName: formData.get("fullName") || "",
      date: formData.get("date") || "",
      doctorName: formData.get("doctorName") || "",
    };

    navigate("/patient/appointments", {
      state: { prefill, fromStaff: true },
    });
    setShowBookingForm(false);
  };

  return (
    <div className="min-h-screen w-screen font-sans bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50 flex flex-col text-slate-900">
      {/* background accents */}
      <div className="pointer-events-none fixed inset-0 opacity-60 mix-blend-multiply">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-sky-200 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-emerald-200 blur-3xl" />
      </div>

      <div className="fixed top-0 left-0 right-0 z-40">
        <StaffHeader />
      </div>

      <main
        className={`relative z-10 flex-grow pt-24 pb-10 px-4 sm:px-8 lg:px-16 flex justify-center transition-all duration-700 ${
          animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="w-full max-w-6xl rounded-3xl bg-white/85 backdrop-blur-xl border border-white/70 shadow-[0_16px_50px_rgba(15,23,42,0.10)] px-5 sm:px-8 py-7">
          {/* Top text */}
          <section className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900">
              Welcome,{" "}
              <span className="bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">
                {displayName}
              </span>
              !
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-3xl">
              Manage appointments, coordinate doctors, and keep patient services
              running smoothly from this staff workspace.
            </p>
          </section>

          {/* Stats */}
          <section className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-5">
            {stats.map((card, idx) => (
              <div
                key={card.label}
                className={`rounded-2xl bg-gradient-to-br ${card.color} border border-white/70 shadow-sm hover:shadow-md transition-transform duration-700 ${
                  animateIn ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
                style={{ transitionDelay: `${120 + idx * 80}ms` }}
              >
                <div className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-semibold text-slate-900">
                        {card.value}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {card.label}
                      </p>
                    </div>
                    <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white/80 border border-slate-100 text-sky-600 text-xl">
                      {card.icon}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Actions + booking CTA row */}
          <section className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
            {/* Actions grid */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-3">
                Staff tools
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {actions.map((card, idx) => (
                  <button
                    key={card.label}
                    type="button"
                    onClick={showComingSoon}
                    className={`group rounded-2xl bg-gradient-to-br ${card.color} border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-700 flex flex-col items-stretch text-left ${
                      animateIn ? "opacity-100 scale-100" : "opacity-0 scale-95"
                    }`}
                    style={{ transitionDelay: `${160 + idx * 70}ms` }}
                  >
                    <div className="p-4 flex flex-col gap-2 h-full">
                      <div className="flex items-center justify-center text-sky-700 text-2xl mb-1">
                        {card.icon}
                      </div>
                      <p className="text-xs font-semibold text-slate-900 text-center">
                        {card.label}
                      </p>
                      <p className="text-[11px] text-slate-600 text-center">
                        {card.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule new appointment card */}
            <div className="rounded-2xl bg-slate-50/80 border border-slate-100 p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  Schedule new appointment
                </h3>
                <p className="text-xs text-slate-600 mb-4">
                  Quickly create a new booking for walk‑in or phone patients.
                </p>
              </div>
              <button
                onClick={toggleBookingForm}
                className="mt-2 inline-flex justify-center items-center rounded-xl bg-gradient-to-r from-sky-600 to-emerald-600 text-white text-xs sm:text-sm font-semibold px-4 py-2 shadow-sm hover:brightness-110"
              >
                Open booking form
              </button>
            </div>
          </section>

          {/* Booking form (still commented as in your code) */}
          {/* {showBookingForm && (
            <section className="mt-4 rounded-2xl bg-white border border-slate-100 shadow-sm p-5 max-w-lg mx-auto">
              ...
            </section>
          )} */}
        </div>
      </main>

      {/* Toast - top-right glassmorph */}
      {toast.visible && (
        <div className="fixed top-20 right-5 z-50">
          <div className="rounded-2xl bg-green-100 text-slate-900 px-4 py-2 text-sm">
            {toast.message}
          </div>
        </div>
      )}

      <StaffFooter />
    </div>
  );
};

export default StaffDashboardMain;
