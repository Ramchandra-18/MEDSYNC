import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-100 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 md:py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* 1. Name & Motive */}
        <div>
          <h2 className="text-2xl font-bold text-sky-400 mb-3">
            MedSync Hospital
          </h2>
          <p className="text-sm leading-relaxed text-slate-300">
            At MedSync, the mission is to synchronize cutting‑edge medical
            expertise, innovation, and compassionate care to ensure the highest
            quality healthcare for every patient.
          </p>
        </div>

        {/* 2. Quick Links */}
        <div>
          <h3 className="text-lg font-semibold text-sky-300 mb-4">
            Quick Links
          </h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>
              <Link to="/" className="hover:text-sky-400 transition">
                Home
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-sky-400 transition">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-sky-400 transition">
                Contact Us
              </Link>
            </li>
            <li>
              <Link
                to="/login/patient"
                className="hover:text-sky-400 transition"
              >
                Patient Login
              </Link>
            </li>
            <li>
              <Link
                to="/login/doctor"
                className="hover:text-sky-400 transition"
              >
                Doctor Login
              </Link>
            </li>
            <li>
              <Link
                to="/login/staff"
                className="hover:text-sky-400 transition"
              >
                Staff Login
              </Link>
            </li>
            <li>
              <Link
                to="/login/pharmacy"
                className="hover:text-sky-400 transition"
              >
                Pharmacy Login
              </Link>
            </li>
          </ul>
        </div>

        {/* 3. Address & Contact */}
        <div>
          <h3 className="text-lg font-semibold text-sky-300 mb-4">
            Contact Us
          </h3>
          <div className="space-y-2 text-sm text-slate-300">
            <p>VTU&apos;s CPGS, Kalaburagi</p>
            <p>+91 8088237366</p>
            <p>work.medsync@gmail.com</p>
          </div>
        </div>
      </div>

      {/* Bottom line */}
      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        &copy; {year} MedSync Hospital. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
