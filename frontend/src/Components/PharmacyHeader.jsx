import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const PharmacyHeader = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const goToDashboard = () => {
    navigate("/pharmacy/dashboard");
    setMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
    setMenuOpen(false);
  };

  return (
    <header className="w-full bg-white/90 shadow flex items-center justify-between px-5 py-3 sticky top-0 z-50">
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={goToDashboard}
        role="button"
        tabIndex={0}
        aria-label="Go to Pharmacy Dashboard"
        onKeyPress={(e) => {
          if (e.key === "Enter") goToDashboard();
        }}
      >
        <img src="/logo.png"
            alt="MedSync Logo"
            className="w-10 h-10 object-contain" />
        <span className="text-2xl font-extrabold text-gray-900 select-none">MedSync</span>
      </div>

      {/* Hamburger button */}
      <button
        onClick={toggleMenu}
        aria-label="Toggle menu"
        className="md:hidden text-gray-700"
      >
        {menuOpen ? (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      <nav
        className={`${
          menuOpen ? "block" : "hidden"
        } md:flex md:items-center space-y-2 md:space-y-0 md:space-x-6 md:static absolute top-full left-0 right-0 bg-white md:bg-transparent rounded-b-lg md:rounded-none shadow-md md:shadow-none p-4 md:p-0`}
      >
        <button
          className="text-black px-4 py-2 rounded-md font-semibold hover:text-blue-600 transition !bg-transparent !border-none"
          onClick={() => {
            navigate("/pharmacy/inventory");
            setMenuOpen(false);
          }}
        >
          Medicine Inventory
        </button>
        <button
          className="text-black px-4 py-2 rounded-md font-semibold hover:text-green-700 transition !bg-transparent !border-none"
          onClick={() => {
            navigate("/pharmacy/restock-alerts");
            setMenuOpen(false);
          }}
        >
          Restock Alerts
        </button>
        <button
          className="text-black px-4 py-2 rounded-md font-semibold hover:text-blue-600 transition !bg-transparent !border-none"
          onClick={() => {
            navigate("/pharmacy/prescriptions");
            setMenuOpen(false);
          }}
        >
          Prescriptions
        </button>
        <button
          className="text-red-600 px-4 py-2 rounded-md font-semibold hover:text-black transition !bg-transparent !border-none"
          onClick={handleLogout}
        >
          Logout ➜
        </button>
      </nav>
    </header>
  );
};

export default PharmacyHeader;
