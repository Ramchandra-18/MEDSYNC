import React from "react";
import { Link } from "react-router-dom";

const PatientFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-100 border-t border-sky-500">
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
            Patient Links
          </h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>
              <Link
                to="/patient/appointments"
                className="hover:text-sky-400 transition"
              >
                Appointments
              </Link>
            </li>
            <li>
              <Link
                to="/patient/doctors"
                className="hover:text-sky-400 transition"
              >
                Our Doctors
              </Link>
            </li>
            <li>
              <Link
                to="/patient/profile"
                className="hover:text-sky-400 transition"
              >
                Profile
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
      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        &copy; {year} MedSync Hospital. All rights reserved.
      </div>
    </footer>
  );
};

export default PatientFooter;
