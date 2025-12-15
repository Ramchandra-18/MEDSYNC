import React from "react";
import { Link } from "react-router-dom";

const DoctorFooter = () => {
  return (
    <footer className="bg-gray-900 border-t border-sky-300 py-12 px-8 text-white font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">

        {/* 1. Name & Mission */}
        <div>
          <h2 className="text-2xl font-bold text-blue-700 mb-4">MedSync Hospital</h2>
          <p className="text-sm leading-relaxed">
            At MedSync, our mission is to synchronize cutting-edge medical expertise, innovation, and compassionate care ensuring the highest quality healthcare for our patients.
          </p>
        </div>

        {/* 2. Quick Links */}
        <div>
          <h3 className="text-lg font-semibold text-blue-700 mb-4">Quick Links</h3>
          <ul className="space-y-3 text-sm font-semibold">
            <li>
              <Link to="/doctor/todays-appointments" className="text-white hover:text-blue-600 transition px-2 py-1 rounded">
                Today's Appointments
              </Link>
            </li>
            <li>
              <Link to="/doctor/inventory" className="text-white hover:text-blue-600 transition px-2 py-1 rounded">
                Inventory
              </Link>
            </li>
            <li>
              <Link to="/doctor/prescriptions" className="text-white hover:text-blue-600 transition px-2 py-1 rounded">
                Prescriptions
              </Link>
            </li>
          </ul>
        </div>

        {/* 3. Contact Info */}
        <div>
          <h3 className="text-lg font-semibold text-blue-700 mb-4">Contact Us</h3>
          <div className="space-y-2 text-sm">
           <p>📍 VTU's CPGS KALABURAGI</p>
            <p>📞 +91 8088237366</p>
            <p>📧 work.medsync@gmail.com</p>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="mt-12 border-t border-sky-300 pt-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} MedSync Hospital. All rights reserved.
      </div>
    </footer>
  );
};

export default DoctorFooter;
