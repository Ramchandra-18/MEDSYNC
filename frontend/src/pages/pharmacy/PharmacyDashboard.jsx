import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PharmacyHeader from "../../Components/PharmacyHeader";
import PharmacyFooter from "../../Components/PharmacyFooter";
import { getFullNameFromToken } from "../../utils/jwt";
import {
  FaFilePrescription,
  FaCapsules,
  FaClipboardCheck,
  FaCashRegister,
  FaSyringe,
  FaPhone,
} from "react-icons/fa";

const stats = [
  {
    value: 98,
    label: "Active Prescriptions",
    chip: "Live sync",
    color: "from-emerald-400/20 via-emerald-300/10 to-emerald-400/5",
    iconColor: "text-emerald-500",
    icon: <FaFilePrescription />,
  },
  {
    value: 340,
    label: "Total Medicines",
    chip: "Inventory",
    color: "from-sky-400/20 via-sky-300/10 to-cyan-400/5",
    iconColor: "text-sky-500",
    icon: <FaCapsules />,
  },
  {
    value: 15,
    label: "Pending Orders",
    chip: "Action needed",
    color: "from-amber-400/20 via-amber-300/10 to-orange-400/5",
    iconColor: "text-amber-500",
    icon: <FaClipboardCheck />,
  },
];

const links = [
  {
    label: "Medication Inventory",
    icon: <FaCapsules />,
    iconColor: "text-sky-500",
    bg: "from-sky-50/80 to-slate-50/80",
    desc: "Track stock, expiries, and reorder levels with one glance.",
  },
  {
    label: "Prescribe Medication",
    icon: <FaFilePrescription />,
    iconColor: "text-emerald-500",
    bg: "from-emerald-50/80 to-lime-50/80",
    desc: "Generate, renew, and digitally sign prescriptions.",
  },
  {
    label: "Sales & Billing",
    icon: <FaCashRegister />,
    iconColor: "text-amber-500",
    bg: "from-amber-50/80 to-orange-50/80",
    desc: "Review invoices, payments, and daily revenue.",
  },
  {
    label: "Vaccination Records",
    icon: <FaSyringe />,
    iconColor: "text-indigo-500",
    bg: "from-indigo-50/80 to-blue-50/80",
    desc: "Quickly log and retrieve vaccine history.",
  },
  {
    label: "Order Processing",
    icon: <FaClipboardCheck />,
    iconColor: "text-rose-500",
    bg: "from-rose-50/80 to-pink-50/80",
    desc: "Process, dispatch, and track all pharmacy orders.",
  },
  {
    label: "Pharmacist Support",
    icon: <FaPhone />,
    iconColor: "text-sky-500",
    bg: "from-slate-50/80 to-sky-50/80",
    desc: "Call or message support for instant assistance.",
  },
];

const PharmacyDashboard = () => {
  const navigate = useNavigate();
  const [animateIn, setAnimateIn] = useState(false);

  const user =
    JSON.parse(localStorage.getItem("currentUser")) ||
    JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("jwtToken");
  const fullNameFromToken = getFullNameFromToken(token);
  const displayName =
    fullNameFromToken || user?.full_name || user?.name || "Pharmacy Staff";

  useEffect(() => {
    const userRole = (user?.role || "").toString().toLowerCase();
    if (!user || userRole !== "pharmacy") {
      navigate("/login/pharmacy", {
        state: {
          message: "Access denied. Please login with the correct role.",
        },
      });
    }
    const t = setTimeout(() => setAnimateIn(true), 250);
    return () => clearTimeout(t);
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen w-screen flex flex-col bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50 text-slate-900">
      {/* Subtle global gradient backdrop */}
      <div className="pointer-events-none fixed inset-0 opacity-60 mix-blend-multiply">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-200 blur-3xl" />
        <div className="absolute -bottom-16 right-0 h-72 w-72 rounded-full bg-emerald-200 blur-3xl" />
      </div>

      <PharmacyHeader />

      <main
        className={`relative flex-grow w-full py-10 px-3 md:px-8 flex flex-col items-center transition-all duration-700 ease-out ${
          animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {/* Main glass panel */}
        <div className="w-full max-w-6xl rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_18px_60px_rgba(15,23,42,0.12)] px-4 sm:px-8 py-8 space-y-10">
          {/* Header row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-[11px] font-medium text-emerald-700 tracking-wide">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Pharmacy Operations · Live
              </div>
              <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-900">
                Welcome back,{" "}
                <span className="bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent">
                  {displayName}
                </span>
              </h2>
              <p className="mt-1 text-sm sm:text-base text-slate-600">
                Control prescriptions, inventory, and billing in one clean dashboard.
              </p>
            </div>

            {/* Optional avatar / role card */}
            <div className="self-start md:self-end">
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50/80 border border-slate-100 px-4 py-3 shadow-sm">
                <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 text-white text-xl">
                  {displayName?.[0] || "P"}
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-slate-800">Pharmacy Role</p>
                  <p className="text-slate-500">Secure MedSync workspace</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {stats.map((card, idx) => (
              <div
                key={card.label}
                className={`rounded-2xl bg-gradient-to-br ${card.color} border border-white/80 shadow-sm hover:shadow-md transition transform ${
                  animateIn
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${150 + idx * 80}ms` }}
              >
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        {card.chip}
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900">
                        {card.value}
                      </p>
                    </div>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 border border-white/80 ${card.iconColor}`}
                    >
                      {card.icon}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600">{card.label}</p>
                </div>
              </div>
            ))}
          </section>

          {/* Quick actions header */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-[0.18em]">
                Quick actions
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Jump straight into your most common pharmacy workflows.
              </p>
            </div>
          </div>

          {/* Quick links cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {links.map((card, idx) => (
              <button
                key={card.label}
                type="button"
                className={`group text-left rounded-2xl bg-gradient-to-br ${card.bg} border border-slate-100/80 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-400/70`}
                style={{ transitionDelay: `${180 + idx * 60}ms` }}
              >
                <div className="p-4 flex flex-col h-full gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 border border-slate-100 ${card.iconColor}`}
                      >
                        {card.icon}
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {card.label}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 group-hover:text-emerald-500">
                      View
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </button>
            ))}
          </section>
        </div>
      </main>

      <PharmacyFooter />
    </div>
  );
};

export default PharmacyDashboard;
