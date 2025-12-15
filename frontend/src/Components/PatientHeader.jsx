import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const PatientHeader = () => {
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
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">
          {/* Logo and Brand */}
          <button
            className="flex items-center gap-2 !bg-transparent !border-none hover:opacity-90 transition"
            onClick={() => handleGo("/patient/dashboard")}
            aria-label="Go to Patient Dashboard"
          >
            <img
              src="/logo.png"
              alt="MedSync Logo"
              className="w-9 h-9 object-contain"
            />
            <div className="flex flex-col items-start leading-tight">
              <span className="text-lg font-extrabold text-slate-900 tracking-wide">
                MedSync
              </span>
              <span className="text-[11px] font-medium text-sky-600 tracking-wide uppercase">
                Patient Portal
              </span>
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            <button
              onClick={() => handleGo("/patient/appointments")}
              className="!bg-transparent !border-none text-sm font-medium text-slate-700 hover:text-sky-600 px-3 py-1.5 rounded-full transition"
            >
              Appointments
            </button>
            <button
              onClick={() => handleGo("/patient/doctors")}
              className="!bg-transparent !border-none text-sm font-medium text-slate-700 hover:text-sky-600 px-3 py-1.5 rounded-full transition"
            >
              Our Doctors
            </button>
            <button
              onClick={() => handleGo("/patient/profile")}
              className="!bg-transparent !border-none text-sm font-medium text-slate-700 hover:text-sky-600 px-3 py-1.5 rounded-full transition"
            >
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="!bg-rose-400 !border-none text-sm font-semibold text-white  px-3 py-1.5 rounded-full transition"
            >
              Logout
            </button>
          </nav>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden !bg-transparent !border-none inline-flex items-center justify-center rounded-md p-2 text-slate-700 hover:bg-slate-100 transition"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? "Close patient menu" : "Open patient menu"}
          >
            {menuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[999] md:hidden bg-black/30">
          <div className="fixed top-0 right-0 h-full w-64 bg-white shadow-xl px-6 py-8 flex flex-col gap-3">
            <button
              className="self-end text-2xl text-sky-600 mb-3"
              onClick={() => setMenuOpen(false)}
              aria-label="Close patient menu"
            >
              &times;
            </button>
            <button
              onClick={() => handleGo("/patient/appointments")}
              className="text-slate-900 hover:text-sky-600 text-sm font-medium px-2 py-2 !bg-transparent !border-none rounded-md transition text-left"
            >
              Appointments
            </button>
            <button
              onClick={() => handleGo("/patient/doctors")}
              className="text-slate-900 hover:text-sky-600 text-sm font-medium px-2 py-2 !bg-transparent !border-none rounded-md transition text-left"
            >
              Our Doctors
            </button>
            <button
              onClick={() => handleGo("/patient/profile")}
              className="text-slate-900 hover:text-sky-600 text-sm font-medium px-2 py-2 !bg-transparent !border-none rounded-md transition text-left"
            >
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="text-rose-600 hover:text-rose-700 text-sm font-semibold px-2 py-2 !bg-transparent !border-none rounded-md transition text-left bg-rose-400"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default PatientHeader;
