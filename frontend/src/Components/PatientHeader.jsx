import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const PatientHeader = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <header className="w-full bg-sky-100 flex items-center justify-between px-2 py-2 shadow-md sticky top-0 z-50">
      {/* Logo and Brand Name (clickable) */}
      <button
        className="flex items-center gap-2 !bg-transparent !border-none focus:outline-none"
        onClick={() => navigate("/patient/dashboard")}
        aria-label="Go to Patient Dashboard"
      >
        <img src="/logo.png" alt="MedSync Logo" className="w-10 h-10 object-contain" />
        <span className="text-2xl font-extrabold text-black tracking-wide">MedSync</span>
      </button>

      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center gap-5">
        <button
          onClick={() => navigate("/patient/appointments")}
          className="!bg-transparent !border-none text-black hover:text-blue-600 px-4 py-2 rounded transition font-semibold"
        >
          Appointments
        </button>

        {/* NEW: Available Doctors link for patients */}
        <button
          onClick={() => navigate("/patient/doctors")}
          className="!bg-transparent !border-none text-black hover:text-blue-600 px-4 py-2 rounded transition font-semibold"
        >
          Our Doctors
        </button>

        <button
          onClick={() => navigate("/patient/profile")}
          className="!bg-transparent !border-none text-black hover:text-blue-600 px-4 py-2 rounded transition font-semibold"
        >
          Profile
        </button>
        <button
          onClick={handleLogout}
          className="!bg-transparent !border-none hover:!text-black text-red-600 px-4 py-2 rounded transition font-semibold"
        >
          Logout➜🚪
        </button>
      </nav>

      {/* Hamburger for Mobile */}
      <button
        className="md:hidden !bg-transparent !border-none flex items-center px-2 py-1"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Open patient menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>

      {/* Mobile Menu Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[999] md:hidden bg-black/30">
          <div className="fixed top-0 right-0 h-full w-64 bg-white shadow-xl px-6 py-10 flex flex-col gap-4">
            <button
              className="self-end text-2xl text-blue-500 mb-4"
              onClick={() => setMenuOpen(false)}
            >
              &times;
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate("/patient/appointments");
              }}
              className="text-black hover:text-blue-600 text-lg font-semibold px-2 py-2 !bg-transparent !border-none rounded transition text-left"
            >
              Appointments
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate("/patient/doctors");
              }}
              className="text-black hover:text-blue-600 text-lg font-semibold px-2 py-2 !bg-transparent !border-none rounded transition text-left"
            >
             Doctors
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate("/patient/profile");
              }}
              className="text-black hover:text-blue-600 text-lg font-semibold px-2 py-2 !bg-transparent !border-none rounded transition text-left"
            >
              Profile
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                handleLogout();
              }}
              className="hover:text-black text-red-600 text-lg font-semibold px-2 py-2 !bg-transparent !border-none rounded transition text-left"
            >
              Logout➜🚪
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default PatientHeader;
