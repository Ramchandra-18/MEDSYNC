import React from "react";
import { Link } from "react-router-dom";

const DoctorFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 border-t border-sky-500 py-10 px-6 md:px-10 text-slate-100 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* 1. Name & Mission */}
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
          <ul className="space-y-2 text-sm text-slate-300 font-medium">
            <li>
              <Link
                to="/doctor/todays-appointments"
                className="hover:text-sky-400 transition"
              >
                Today&apos;s Appointments
              </Link>
            </li>
            <li>
              <Link
                to="/doctor/inventory"
                className="hover:text-sky-400 transition"
              >
                Inventory
              </Link>
            </li>
            <li>
              <Link
                to="/doctor/prescriptions"
                className="hover:text-sky-400 transition"
              >
                Prescriptions
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
        &copy; {year} MedSync Hospital. All rights reserved.
      </div>
    </footer>
  );
};

export default DoctorFooter;
