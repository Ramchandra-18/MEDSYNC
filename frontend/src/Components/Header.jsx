import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleGo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <header className="w-full sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <button
            onClick={() => handleGo("/")}
            className="flex items-center gap-3 !bg-transparent !border-none hover:opacity-90 transition "
            aria-label="Go to Home"
          >
            <img
              src="/logo.png"
              alt="MedSync Logo"
              className="w-9 h-9 object-contain"
            />
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Med<span className="text-sky-500">Sync</span>
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => handleGo("/")}
              className="!bg-transparent !border-none text-sm font-medium text-slate-700 hover:text-sky-600 hover:underline underline-offset-4 transition"
            >
              Home
            </button>
            <button
              onClick={() => handleGo("/about")}
              className="!bg-transparent !border-none text-sm font-medium text-slate-700 hover:text-sky-600 hover:underline underline-offset-4 transition"
            >
              About Us
            </button>
            <button
              onClick={() => handleGo("/contact")}
              className="!bg-transparent !border-none text-sm font-medium text-slate-700 hover:text-sky-600 hover:underline underline-offset-4 transition"
            >
              Contact Us
            </button>
            <button
              onClick={() => handleGo("/login")}
              className=" !border-none text-sm font-semibold text-white !bg-sky-600 hover:bg-sky-700 px-4 py-2 rounded-full shadow-sm transition"
            >
              Login
            </button>
          </nav>

          {/* Mobile toggle */}
          <button
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-slate-700 hover:bg-slate-100 transition"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
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

      {/* Mobile menu (slide down) */}
      {menuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 shadow-sm">
          <nav className="px-4 pb-4 pt-2 space-y-1">
            <button
              onClick={() => handleGo("/")}
              className="block w-full text-left text-sm font-medium text-slate-800 px-2 py-2 rounded-md hover:bg-slate-100 transition !bg-transparent !border-none"
            >
              Home
            </button>
            <button
              onClick={() => handleGo("/about")}
              className="block w-full text-left text-sm font-medium text-slate-800 px-2 py-2 rounded-md hover:bg-slate-100 transition !bg-transparent !border-none"
            >
              About Us
            </button>
            <button
              onClick={() => handleGo("/contact")}
              className="block w-full text-left text-sm font-medium text-slate-800 px-2 py-2 rounded-md hover:bg-slate-100 transition !bg-transparent !border-none"
            >
              Contact Us
            </button>
            <button
              onClick={() => handleGo("/login")}
              className="mt-1 block w-full text-left text-sm font-semibold text-white !bg-sky-600 hover:bg-sky-700 px-2 py-2 rounded-md transition !border-none"
            >
              Login
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
