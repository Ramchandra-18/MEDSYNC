import React from "react";
import { Link } from "react-router-dom";

const PharmacyFooter = () => {
  return (
    <footer className="bg-gray-900 border-t border-green-300 py-12 px-8 text-white font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">

        {/* Name and Mission */}
        <div>
          <h2 className="text-2xl font-bold text-green-700 mb-4">MedSync Pharmacy</h2>
          <p className="text-sm leading-relaxed">
            Delivering secure, transparent pharmaceutical services with blockchain-backed processes and real-time inventory management.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold text-green-700 mb-4">Quick Links</h3>
          <ul className="space-y-3 text-sm font-semibold">
            <li>
              <Link to="/pharmacy/inventory" className="text-black hover:text-green-600 transition px-2 py-1 rounded">
                Medicine Inventory
              </Link>
            </li>
            <li>
              <Link to="/pharmacy/restock-alerts" className="text-black hover:text-green-600 transition px-2 py-1 rounded">
                Restock Alerts
              </Link>
            </li>
            <li>
              <Link to="/pharmacy/prescriptions" className="text-black hover:text-green-600 transition px-2 py-1 rounded">
                Prescriptions
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="text-lg font-semibold text-green-700 mb-4">Contact Us</h3>
          <div className="space-y-2 text-sm">
           <p>📍 VTU's CPGS KALABURAGI</p>
            <p>📞 +91 8088237366</p>
            <p>📧 work.medsync@gmail.com</p>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="mt-12 border-t border-green-300 pt-6 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} MedSync Pharmacy. All rights reserved.
      </div>
    </footer>
  );
};

export default PharmacyFooter;
