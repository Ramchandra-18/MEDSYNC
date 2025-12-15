import React from "react";
import { Link } from "react-router-dom";

const StaffFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 border-t border-sky-500 py-10 px-6 md:px-10 text-slate-100 font-sans w-full">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* 1. Name & Mission */}
        <div>
          <h2 className="text-2xl font-bold text-sky-400 mb-3">
            MedSync Staff Portal
          </h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Empowering hospital staff with seamless tools and real‑time data to
            optimize patient care and streamline daily workflows across the
            hospital.
          </p>
        </div>

        {/* 2. Quick Links */}
        <div>
          <h3 className="text-lg font-semibold text-sky-300 mb-4">
            Quick Links
          </h3>
          <ul className="space-y-2 text-sm text-slate-300 font-medium">
            <li>
              <Link
                to="/staff/dashboard"
                className="hover:text-sky-400 transition"
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/staff/appointment-confirmation"
                className="hover:text-sky-400 transition"
              >
                Appointment Confirmation
              </Link>
            </li>
            <li>
              <Link
                to="/staff/doctor-schedule"
                className="hover:text-sky-400 transition"
              >
                Doctor Schedule
              </Link>
            </li>
            <li>
              <Link
                to="/staff/patients-records"
                className="hover:text-sky-400 transition"
              >
                Patients Records
              </Link>
            </li>
          </ul>
        </div>

        {/* 3. Contact Info */}
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

      {/* Copyright */}
      <div className="mt-10 border-t border-slate-800 pt-4 text-center text-xs text-slate-500">
        &copy; {year} MedSync Staff Portal. All rights reserved.
      </div>
    </footer>
  );
};

export default StaffFooter;
