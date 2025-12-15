import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PharmacyHeader from "../../Components/PharmacyHeader";
import PharmacyFooter from "../../Components/PharmacyFooter";
import { getFullNameFromToken } from '../../utils/jwt';
import { FaUserMd, FaFilePrescription, FaCapsules, FaClipboardCheck, FaCashRegister, FaHistory, FaSyringe, FaPhone } from 'react-icons/fa';

const stats = [
  { value: 98, label: "Active Prescriptions", color: "from-green-200 to-green-100", icon: <FaFilePrescription /> },
  { value: 340, label: "Total Medicines", color: "from-cyan-200 to-blue-100", icon: <FaCapsules /> },
  { value: 15, label: "Pending Orders", color: "from-orange-200 to-red-100", icon: <FaClipboardCheck /> },
];

const links = [
  { label: "Medication Inventory", color: "from-cyan-100 to-blue-100", icon: <FaCapsules />, desc: "Review & update in-stock, expiry, reorder levels" },
  { label: "Prescribe Medication", color: "from-green-100 to-lime-100", icon: <FaFilePrescription />, desc: "Issue prescriptions and renewals quickly" },
  { label: "Sales/Billing History", color: "from-yellow-100 to-orange-100", icon: <FaCashRegister />, desc: "View, print or export pharmacy invoices" },
  { label: "Vaccination Records", color: "from-blue-100 to-purple-100", icon: <FaSyringe />, desc: "Log & look up patient vaccine data" },
  { label: "Order Processing", color: "from-pink-100 to-purple-100", icon: <FaClipboardCheck />, desc: "Process, fulfill, and track medicine orders" },
  { label: "Pharmacist Support", color: "from-gray-100 to-sky-100", icon: <FaPhone />, desc: "Direct hotline for pharmacist queries & guidance" }
];

const PharmacyDashboard = () => {
  const navigate = useNavigate();
  const [animateIn, setAnimateIn] = useState(false);

  const user = JSON.parse(localStorage.getItem("currentUser")) || JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('jwtToken');
  const fullNameFromToken = getFullNameFromToken(token);
  const displayName = fullNameFromToken || user?.full_name || user?.name || "Pharmacy Staff";

  useEffect(() => {
    const userRole = (user?.role || "").toString().toLowerCase();
    if (!user || userRole !== "pharmacy") {
      navigate("/login/pharmacy", { state: { message: "Access denied. Please login with the correct role." } });
    }
    // Animation trigger
    setTimeout(() => setAnimateIn(true), 250); // slight delay for effect
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen w-screen flex flex-col bg-gradient-to-br from-green-50 to-cyan-100 font-sans">
      <PharmacyHeader />
      <main className={`flex-grow w-full py-12 px-2 md:px-8 flex flex-col items-center transition-all duration-700 ease-out
        ${animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        {/* USER GREETING & LOGOUT */}
        <div className="w-full max-w-4xl flex flex-col md:flex-row md:justify-between md:items-center mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-green-700 drop-shadow mb-2">
              Welcome, {displayName}!
            </h2>
            <div className="text-gray-600">Pharmacy Control Center • Real-time Inventory, Orders, & Care</div>
          </div>
          {/* <button
            className="mt-4 md:mt-0 bg-gradient-to-r from-green-500 to-cyan-600 text-white px-5 py-2 rounded-lg shadow hover:from-cyan-600 hover:to-green-700 transition font-semibold"
            onClick={handleLogout}
          >
            Logout
          </button> */}
        </div>

        {/* PHARMACY STATS */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {stats.map((card, idx) => (
            <div key={idx} className={`rounded-2xl shadow-xl p-6 flex flex-col items-start bg-gradient-to-br ${card.color}
              transition-all duration-1000 ${animateIn ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
              <div className="flex items-center justify-between w-full">
                <div className="text-green-800 text-3xl font-bold">{card.value}</div>
                <div className="text-4xl text-green-600">{card.icon}</div>
              </div>
              <div className="text-base text-gray-700 font-medium mt-3">{card.label}</div>
            </div>
          ))}
        </div>

        {/* PHARMACY QUICK LINKS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
          {links.map((card, idx) => (
            <div key={idx} className={`rounded-2xl shadow-lg p-6 bg-gradient-to-br ${card.color} flex flex-col items-center
              transition-all duration-1000 ${animateIn ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
              <div className="text-3xl mb-2 text-green-700">{card.icon}</div>
              <div className="font-bold text-lg text-gray-900 text-center mb-2">{card.label}</div>
              <div className="text-gray-600 text-sm text-center">{card.desc}</div>
            </div>
          ))}
        </div>
      </main>
      <PharmacyFooter />
    </div>
  );
};

export default PharmacyDashboard;
