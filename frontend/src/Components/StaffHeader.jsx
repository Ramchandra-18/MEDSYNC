import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const StaffHeader = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
    setMenuOpen(false);
  };

  const handleGo = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <header className="w-full sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">
          {/* Logo + brand */}
          <button
            className="flex items-center gap-3 cursor-pointer !bg-transparent !border-none hover:opacity-90 transition"
            onClick={() => handleGo("/staff/dashboard")}
            aria-label="Go to staff dashboard"
          >
            <img
              src="/logo.png"
              alt="MedSync Logo"
              className="w-9 h-9 object-contain"
            />
            <div className="flex flex-col items-start leading-tight">
              <span className="text-lg font-extrabold text-slate-900 select-none">
                MedSync
              </span>
              <span className="text-[11px] font-medium text-sky-700 tracking-wide uppercase">
                Staff Panel
              </span>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            <button
              className="text-sm font-medium text-slate-700 hover:text-sky-600 px-3 py-1.5 rounded-full transition !bg-transparent !border-none"
              onClick={() => handleGo("/staff/appointment-confirmation")}
            >
              Appointment Confirmation
            </button>
            <button
              className="text-sm font-medium text-slate-700 hover:text-sky-600 px-3 py-1.5 rounded-full transition !bg-transparent !border-none"
              onClick={() => handleGo("/staff/patients-records")}
            >
              Patients Records
            </button>
            <button
              onClick={handleLogout}
              className="text-sm font-semibold text-white px-3 py-1.5 rounded-full transition !bg-rose-400 !border-none"
            >
              Logout
            </button>
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((m) => !m)}
            aria-label={menuOpen ? "Close menu" : "Toggle menu"}
            className="md:hidden text-slate-700 focus:outline-none inline-flex items-center justify-center rounded-md p-2 hover:bg-slate-100 transition"
          >
            {menuOpen ? (
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 shadow-sm">
          <nav className="px-4 pb-4 pt-2 space-y-1">
            <button
              className="block w-full text-left text-sm font-medium text-slate-800 px-2 py-2 rounded-md hover:bg-slate-100 transition !bg-transparent !border-none"
              onClick={() => handleGo("/staff/appointment-confirmation")}
            >
              Appointment Confirmation
            </button>
            <button
              className="block w-full text-left text-sm font-medium text-slate-800 px-2 py-2 rounded-md hover:bg-slate-100 transition !bg-transparent !border-none"
              onClick={() => handleGo("/staff/patients-records")}
            >
              Patients Records
            </button>
            <button
              onClick={handleLogout}
              className="block w-full text-left text-sm font-semibold text-white px-2 py-2 rounded-md hover:bg-rose-50 transition !bg-rose-400 !border-none"
            >
              Logout
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default StaffHeader;
