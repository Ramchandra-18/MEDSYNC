import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const DoctorHeader = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const user = useMemo(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("user");
    navigate("/");
  }, [navigate]);

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const goToDashboard = () => {
    navigate("/doctor/dashboard");
    setMenuOpen(false);
  };

  return (
    <header className="w-full sticky top-0 left-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Brand */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={goToDashboard}
          tabIndex={0}
          role="button"
          onKeyPress={(e) => {
            if (e.key === "Enter") goToDashboard();
          }}
          aria-label="Go to Dashboard"
        >
          <img
            src="/logo.png"
            alt="MedSync Logo"
            className="w-9 h-9 object-contain"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-extrabold text-slate-900 tracking-wide select-none">
              MedSync
            </span>
            <span className="text-[11px] font-medium text-sky-700 tracking-wide uppercase">
              Doctor Panel
            </span>
          </div>
        </div>

        {/* Hamburger Icon */}
        <button
          onClick={toggleMenu}
          aria-label={menuOpen ? "Close menu" : "Toggle menu"}
          className="md:hidden !bg-transparent !border-none text-slate-700 focus:outline-none inline-flex items-center justify-center rounded-md p-2 hover:bg-slate-100 transition"
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

        {/* Navigation */}
        <nav
          className={`md:flex md:items-center md:space-x-6 text-slate-900 ${
            menuOpen
              ? "flex flex-col space-y-2 absolute top-full left-0 right-0 bg-white p-5 shadow-md rounded-b-lg"
              : "hidden md:flex"
          }`}
        >
          <button
            onClick={() => {
              navigate("/doctor/todays-appointments");
              setMenuOpen(false);
            }}
            className="text-sm md:text-base font-medium !bg-transparent !border-none hover:text-sky-600 transition py-1"
          >
            Today&apos;s Appointments
          </button>
          <button
            onClick={() => {
              navigate("/doctor/inventory");
              setMenuOpen(false);
            }}
            className="text-sm md:text-base font-medium !bg-transparent !border-none hover:text-sky-600 transition py-1"
          >
            Inventory
          </button>
          <button
            onClick={() => {
              navigate("/doctor/prescriptions");
              setMenuOpen(false);
            }}
            className="text-sm md:text-base font-medium !bg-transparent !border-none hover:text-sky-600 transition py-1"
          >
            Prescriptions
          </button>
          <button
            onClick={() => {
              handleLogout();
              setMenuOpen(false);
            }}
            className="text-sm md:text-base font-semibold text-white !bg-rose-400 !border-none transition py-1"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
};

export default DoctorHeader;
