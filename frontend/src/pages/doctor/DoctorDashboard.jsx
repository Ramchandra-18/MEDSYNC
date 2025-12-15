import React, { useEffect, useState } from "react";
import DoctorHeader from "../../Components/DoctorHeader";
import DoctorFooter from "../../Components/DoctorFooter";
import { getFullNameFromToken } from "../../utils/jwt";
import {
  FaUserMd,
  FaCalendarAlt,
  FaUserInjured,
  FaNotesMedical,
  FaBell,
  FaClipboardList,
  FaFilePrescription,
  FaComments,
} from "react-icons/fa";

const stats = [
  {
    value: 27,
    label: "Today's queue",
    color: "from-sky-400/15 via-sky-300/10 to-sky-400/5",
    icon: <FaCalendarAlt />,
  },
  {
    value: 9,
    label: "Upcoming appointments",
    color: "from-emerald-400/15 via-emerald-300/10 to-emerald-400/5",
    icon: <FaClipboardList />,
  },
  {
    value: 4,
    label: "Critical alerts",
    color: "from-rose-400/15 via-rose-300/10 to-rose-400/5",
    icon: <FaBell />,
  },
];

const actions = [
  {
    label: "Patient records",
    color: "from-sky-50 to-blue-50",
    icon: <FaUserInjured />,
    desc: "Access and update medical history securely.",
  },
  {
    label: "Prescribe medication",
    color: "from-emerald-50 to-sky-50",
    icon: <FaFilePrescription />,
    desc: "Write prescriptions and review pharmacy status.",
  },
  {
    label: "Consultation notes",
    color: "from-indigo-50 to-sky-50",
    icon: <FaNotesMedical />,
    desc: "Document treatment details, symptoms, and progress.",
  },
  {
    label: "Messages",
    color: "from-sky-50 to-white",
    icon: <FaComments />,
    desc: "Communicate with patients and staff.",
  },
  {
    label: "Schedule manager",
    color: "from-cyan-50 to-blue-50",
    icon: <FaCalendarAlt />,
    desc: "Plan and manage weekly work hours.",
  },
  {
    label: "Collaboration board",
    color: "from-rose-50 to-sky-50",
    icon: <FaUserMd />,
    desc: "Coordinate with pharmacy, nursing, and admin.",
  },
];

const DoctorDashboardContent = () => {
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
    "Doctor";

  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimateIn(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen w-screen flex flex-col bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50 font-sans text-slate-900">
      {/* background accents */}
      <div className="pointer-events-none fixed inset-0 opacity-60 mix-blend-multiply">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-sky-200 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-emerald-200 blur-3xl" />
      </div>

      <div className="fixed top-0 left-0 right-0 z-40">
        <DoctorHeader />
      </div>

      <main
        className={`relative z-10 pt-24 pb-10 px-4 sm:px-8 lg:px-16 max-w-6xl mx-auto w-full flex-grow transition-all duration-700 ${
          animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Hero strip */}
        <section className="mb-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/70 shadow-[0_16px_50px_rgba(15,23,42,0.10)] px-5 sm:px-7 py-6 flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.18em] text-sky-600">
              MedSync · Doctor workspace
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-900">
              Welcome,{" "}
              <span className="bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">
                Dr. {displayName}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
              View today's queue, upcoming visits, and critical alerts at a
              glance, with one place to start each consultation.
            </p>
            <p className="text-xs sm:text-sm italic text-slate-500 mt-1">
              “Wherever the art of medicine is loved, there is also a love of
              humanity.” – Hippocrates
            </p>
          </div>
          <div className="flex items-center gap-3 self-start lg:self-auto">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 text-white flex items-center justify-center text-2xl shadow-lg">
              <FaUserMd />
            </div>
            <div className="text-xs text-slate-600">
              <p className="font-semibold text-slate-900">
                Today at a glance
              </p>
              <p>27 in queue · 9 upcoming · 4 critical alerts</p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl">
          {stats.map((card, idx) => (
            <div
              key={card.label}
              className={`rounded-2xl bg-gradient-to-br ${card.color} border border-white/70 shadow-sm hover:shadow-md transition-transform duration-700 ${
                animateIn ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
              style={{ transitionDelay: `${120 + idx * 80}ms` }}
            >
              <div className="p-4 flex flex-col gap-3">
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

        {/* Actions grid */}
        <section className="mb-10">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-3">
            Tools for your day
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
            {actions.map((card, idx) => (
              <button
                key={card.label}
                type="button"
                className={`group rounded-2xl bg-gradient-to-br ${card.color} border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-700 flex flex-col items-stretch text-left ${
                  animateIn ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
                style={{ transitionDelay: `${160 + idx * 70}ms` }}
              >
                <div className="p-5 flex flex-col gap-3 h-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/80 border border-slate-100 text-sky-600 text-lg">
                        {card.icon}
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {card.label}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 group-hover:text-emerald-500">
                      Open
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{card.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Schedule placeholder */}
        <section className="mt-6 rounded-2xl bg-slate-50/80 border border-slate-100 px-5 py-4 max-w-5xl">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            Schedule
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            Manage your weekly schedule here. Detailed scheduling and calendar
            features will be available soon.
          </p>
        </section>
      </main>

      <DoctorFooter />
    </div>
  );
};

export default DoctorDashboardContent;
