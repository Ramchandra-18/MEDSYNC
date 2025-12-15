import React from "react";
import { Link } from "react-router-dom";

const PharmacyFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-100 border-t border-emerald-600">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 md:py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Name and Mission */}
        <div>
          <h2 className="text-2xl font-bold text-emerald-400 mb-3">
            MedSync Pharmacy
          </h2>
          <p className="text-sm leading-relaxed text-slate-300">
            Delivering secure, transparent pharmaceutical services with
            blockchain‑backed processes and real‑time inventory management for
            safer medication workflows.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold text-emerald-300 mb-4">
            Quick Links
          </h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>
              <Link
                to="/pharmacy/inventory"
                className="hover:text-emerald-400 transition"
              >
                Medicine Inventory
              </Link>
            </li>
            <li>
              <Link
                to="/pharmacy/restock-alerts"
                className="hover:text-emerald-400 transition"
              >
                Restock Alerts
              </Link>
            </li>
            <li>
              <Link
                to="/pharmacy/prescriptions"
                className="hover:text-emerald-400 transition"
              >
                Prescriptions
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="text-lg font-semibold text-emerald-300 mb-4">
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
        &copy; {year} MedSync Pharmacy. All rights reserved.
      </div>
    </footer>
  );
};

export default PharmacyFooter;
