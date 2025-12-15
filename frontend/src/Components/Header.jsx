import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="w-full bg-white/90 shadow-md px-6 py-2 flex items-center justify-between z-50 sticky top-0">
      {/* Logo & Brand */}
      <button
        className="flex items-center gap-3 !bg-transparent !border-0 hover:opacity-80"
        onClick={() => navigate("/")}
        aria-label="Go to Home"
      >
        <img src="/logo.png" alt="MedSync Logo" className="w-10 h-10 object-contain" />
        <h2 className="text-2xl font-extrabold text-blue-500 tracking-wide select-none">
          Med<span className="text-sky-300">S</span>ync
        </h2>
      </button>

      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center space-x-6">
        <button
          onClick={() => navigate("/")}
          className="text-black hover:text-blue-600 text-xl font-serif !bg-transparent !border-0 px-2 py-1 rounded transition"
        >
          Home
        </button>
        <button
          onClick={() => navigate("/login")}
          className="text-black hover:text-blue-600 text-xl font-semibold !bg-transparent !border-0 px-2 py-1 rounded transition"
        >
          Login
        </button>
        <button
          onClick={() => navigate("/about")}
          className="text-black hover:text-blue-600 text-xl !bg-transparent !border-0 font-semibold px-2 py-1 rounded transition"
        >
          About Us
        </button>
        <button
          onClick={() => navigate("/contact")}
          className="text-black hover:text-blue-600 text-xl !bg-transparent !border-0 font-semibold px-2 py-1 rounded transition"
        >
          Contact Us
        </button>
      </nav>

      {/* Mobile Hamburger */}
      <button
        className="md:hidden flex items-center px-2 py-1"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Open menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 bg-white/30 z-[999]">
          <div className="fixed top-0 right-0 w-72 h-full bg-white shadow-lg px-6 py-10 flex flex-col gap-4">
            <button className="self-end text-2xl text-blue-500 mb-4" onClick={() => setMenuOpen(false)}>
              &times;
            </button>
            <button
              onClick={() => { setMenuOpen(false); navigate("/"); }}
              className="text-black hover:text-blue-600 !bg-transparent !border-0 text-lg font-semibold px-2 py-2 rounded transition text-left"
            >
              Home
            </button>
            <button
              onClick={() => { setMenuOpen(false); navigate("/login"); }}
              className="text-black hover:text-blue-600 !bg-transparent !border-0 text-lg font-semibold px-2 py-2 rounded transition text-left"
            >
              Login
            </button>
            <button
              onClick={() => { setMenuOpen(false); navigate("/about"); }}
              className="text-black hover:text-blue-600 text-lg !bg-transparent !border-0 font-semibold px-2 py-2 rounded transition text-left"
            >
              About Us
            </button>
            <button
              onClick={() => { setMenuOpen(false); navigate("/contact"); }}
              className="text-black hover:text-blue-600 !bg-transparent !border-0 text-lg font-semibold px-2 py-2 rounded transition text-left"
            >
              Contact Us
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
