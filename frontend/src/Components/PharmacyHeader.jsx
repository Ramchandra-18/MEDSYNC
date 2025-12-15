import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const PharmacyHeader = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const goToDashboard = () => {
    navigate("/pharmacy/dashboard");
    setMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
    setMenuOpen(false);
  };

  const handleNav = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <header className="w-full sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">
          {/* Brand */}
          <button
            onClick={goToDashboard}
            className="flex items-center gap-3 hover:opacity-90 transition !bg-transparent !border-0"
            aria-label="Go to Pharmacy Dashboard"
          >
            <img
              src="/logo.png"
              alt="MedSync Logo"
              className="w-9 h-9 object-contain"
            />
            <div className="flex flex-col items-start leading-tight">
              <span className="text-lg font-extrabold text-slate-900">
                MedSync
              </span>
              <span className="text-[11px] font-medium text-emerald-600 tracking-wide uppercase">
                Pharmacy Panel
              </span>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            <button
              onClick={() => handleNav("/pharmacy/inventory")}
              className="text-sm font-medium text-slate-700 hover:text-sky-600 px-3 py-1.5 rounded-full transition !bg-transparent !border-none"
            >
              Medicine Inventory
            </button>
            <button
              onClick={() => handleNav("/pharmacy/restock-alerts")}
              className="text-sm font-medium text-slate-700 hover:text-emerald-600 px-3 py-1.5 rounded-full transition !bg-transparent !border-none"
            >
              Restock Alerts
            </button>
            <button
              onClick={() => handleNav("/pharmacy/prescriptions")}
              className="text-sm font-medium text-slate-700 hover:text-sky-600 px-3 py-1.5 rounded-full transition !bg-transparent !border-none"
            >
              Prescriptions
            </button>
            <button
              onClick={handleLogout}
              className="text-sm font-semibold text-white !bg-rose-400 hover:bg-rose-600 px-4 py-2 rounded-full shadow-sm transition  !border-none"
            >
              Logout
            </button>
          </nav>

          {/* Mobile toggle */}
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-slate-700 hover:bg-slate-100 transition"
          >
            {menuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 shadow-sm">
          <nav className="px-4 pb-4 pt-2 space-y-1">
            <button
              onClick={goToDashboard}
              className="block w-full text-left text-sm font-medium text-slate-800 px-2 py-2 rounded-md hover:bg-slate-100 transition"
            >
              Dashboard
            </button>
            <button
              onClick={() => handleNav("/pharmacy/inventory")}
              className="block w-full text-left text-sm font-medium text-slate-800 px-2 py-2 rounded-md hover:bg-slate-100 transition"
            >
              Medicine Inventory
            </button>
            <button
              onClick={() => handleNav("/pharmacy/restock-alerts")}
              className="block w-full text-left text-sm font-medium text-slate-800 px-2 py-2 rounded-md hover:bg-slate-100 transition"
            >
              Restock Alerts
            </button>
            <button
              onClick={() => handleNav("/pharmacy/prescriptions")}
              className="block w-full text-left text-sm font-medium text-slate-800 px-2 py-2 rounded-md hover:bg-slate-100 transition"
            >
              Prescriptions
            </button>
            <button
              onClick={handleLogout}
              className="mt-1 block w-full text-left text-sm font-semibold text-rose-600 px-2 py-2 rounded-md hover:bg-rose-50 transition"
            >
              Logout
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default PharmacyHeader;
