import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const DoctorHeader = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const user = useMemo(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('user');
    navigate('/');
  }, [navigate]);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const goToDashboard = () => {
    navigate('/doctor/dashboard');
    setMenuOpen(false);
  };

  return (
    <header className="w-full bg-white shadow-md fixed top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={goToDashboard}
          tabIndex={0}
          role="button"
          onKeyPress={(e) => { if (e.key === 'Enter') goToDashboard(); }}
          aria-label="Go to Dashboard"
        >
          <img
            src="/logo.png"
            alt="MedSync Logo"
            className="w-10 h-10 object-contain"
          />
          <span className="text-2xl font-extrabold text-blue-700 tracking-wide select-none">
            MedSync
          </span>
        </div>

        {/* Hamburger Icon */}
        <button
          onClick={toggleMenu}
          aria-label="Toggle menu"
          className="md:hidden !bg-transparent !border-none text-gray-700 focus:outline-none"
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
        <nav
          className={`md:flex md:items-center text-black  md:space-x-6 ${
            menuOpen ? "flex flex-col space-y-2 absolute top-full left-0 right-0 bg-white p-6 shadow-md rounded-b-lg"
                     : "hidden md:flex"
          }`}
        >
          <button
            onClick={() => {
              navigate('/doctor/todays-appointments');
              setMenuOpen(false);
            }}
            className="text-lg font-semibold !bg-transparent !border-none hover:text-blue-600 transition py-1"
          >
            Today's Appointments
          </button>
          <button
            onClick={() => {
              navigate('/doctor/inventory');
              setMenuOpen(false);
            }}
            className="text-lg font-semibold !bg-transparent !border-none hover:text-blue-600 transition py-1"
          >
            Inventory
          </button>
          {/* <button
            onClick={() => {
              navigate('/doctor/schedule');
              setMenuOpen(false);
            }}
            className="text-lg font-semibold !bg-transparent !border-none hover:text-blue-600 transition py-1"
          >
            Schedule
          </button> */}
          <button
            onClick={() => {
              navigate('/doctor/prescriptions');
              setMenuOpen(false);
            }}
            className="text-lg font-semibold !bg-transparent !border-none hover:text-blue-600 transition py-1"
          >
            Prescriptions
          </button>
          <button
            onClick={() => {
              handleLogout();
              setMenuOpen(false);
            }}
            className="text-lg font-semibold text-red-600 !bg-transparent !border-none hover:text-red-700 transition py-1"
          >
            Logout➜🚪
          </button>
        </nav>
      </div>
    </header>
  );
};

export default DoctorHeader;
