import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const StaffHeader = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <header className="w-full bg-sky-100 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-5 py-2 flex items-center justify-between gap-10">
        <div
          className="flex items-center gap-4 cursor-pointer"
          onClick={() => { navigate('/staff/dashboard'); setMenuOpen(false); }}
          role="button"
          tabIndex={0}
          aria-label="Go to staff dashboard"
          onKeyPress={e => { if (e.key === "Enter") navigate('/staff/dashboard'); }}
        >
          <img
            src="/logo.png"
            alt="MedSync Logo"
            className="w-10 h-10 object-contain"
          />
          <span className="text-2xl font-extrabold text-gray-900 select-none">
            MedSync
          </span>
        </div>
        {/* Hamburger for mobile */}
        <button
          onClick={() => setMenuOpen(m => !m)}
          aria-label="Toggle menu"
          className="md:hidden text-gray-700 focus:outline-none"
        >
          {menuOpen ? (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
        {/* Navigation */}
        <nav className={`${menuOpen ? 'flex' : 'hidden'} flex-col absolute top-full left-0 right-0 bg-sky-100 shadow-md rounded-b-lg py-3 px-4 space-y-2 md:space-y-0 md:flex md:flex-row md:items-center md:space-x-6 md:static md:bg-inherit md:shadow-none md:rounded-none md:py-0 md:px-0`}>
          <button
            className="text-black px-5 py-2 rounded-md font-semibold hover:text-blue-600 transition flex items-center gap-2 !bg-transparent !border-none"
            onClick={() => { navigate('/staff/appointment-confirmation'); setMenuOpen(false); }}
          >
            Appointment Confirmation
          </button>
          {/* <button
            className="text-black px-5 py-2 rounded-md font-semibold hover:text-blue-600 transition flex items-center gap-2 !bg-transparent !border-none"
            onClick={() => { navigate('/staff/doctor-schedule'); setMenuOpen(false); }}
          >
            Doctor Schedule
          </button> */}
          <button
            className="text-black px-5 py-2 rounded-md font-semibold hover:text-blue-600 transition flex items-center gap-2 !bg-transparent !border-none"
            onClick={() => { navigate('/staff/patients-records'); setMenuOpen(false); }}
          >
            Patients Records
          </button>
          <button
            onClick={handleLogout}
            className="text-red-600 px-4 py-2 rounded-md font-semibold transition hover:!text-black !bg-transparent !border-none"
          >
            Logout ➜ 🚪
          </button>
        </nav>
      </div>
    </header>
  );
};

export default StaffHeader;
