import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PatientHeader from "../../Components/PatientHeader";
import PatientFooter from "../../Components/PatientFooter";
import { getFullNameFromToken } from '../../utils/jwt';
import { FaCalendarAlt, FaFilePrescription, FaClipboardCheck, FaHistory, FaBell, FaHeart, FaMobileAlt } from 'react-icons/fa';

const stats = [
  { value: 2, label: "Upcoming Appointments", color: "from-sky-200 to-blue-100", icon: <FaCalendarAlt /> },
  { value: 1, label: "Active Prescription", color: "from-blue-200 to-cyan-100", icon: <FaFilePrescription /> },
  { value: 0, label: "Pending Payments", color: "from-pink-100 to-blue-100", icon: <FaClipboardCheck /> },
];

const actions = [
  { label: "Book Appointment", icon: <FaCalendarAlt />, color: "from-green-100 to-blue-100", desc: "Schedule visits with your doctor" },
  { label: "View Prescriptions", icon: <FaFilePrescription />, color: "from-sky-100 to-blue-100", desc: "Check your current medications" },
  { label: "Medical Records", icon: <FaHistory />, color: "from-cyan-100 to-blue-100", desc: "Access lab results & documents" },
  { label: "Notifications", icon: <FaBell />, color: "from-yellow-100 to-blue-100", desc: "Read health alerts & reminders" },
  { label: "Health Tips", icon: <FaHeart />, color: "from-pink-100 to-blue-100", desc: "Wellness insights just for you" },
  { label: "Contact Support", icon: <FaMobileAlt />, color: "from-blue-100 to-sky-100", desc: "Reach out for help and info" },
];

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [animateIn, setAnimateIn] = useState(false);

  const user = JSON.parse(localStorage.getItem("user")) || JSON.parse(localStorage.getItem('currentUser') || 'null');
  const token = localStorage.getItem('jwtToken');
  const fullNameFromToken = getFullNameFromToken(token);
  const displayName = fullNameFromToken || user?.full_name || user?.name || "Patient";

  useEffect(() => {
    setTimeout(() => setAnimateIn(true), 200);
  }, []);

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-blue-50 via-sky-100 to-blue-200 font-sans flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50">
        <PatientHeader />
      </div>

      <main className={`flex-grow w-full pt-[72px] px-4 sm:px-10 lg:px-24 transition-all duration-700 ${animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        {/* Welcome */}
        <h2 className="text-4xl font-bold mb-6 text-blue-700">
          Welcome, {displayName}!
        </h2>
        <p className="mb-8 text-gray-700 text-xl max-w-4xl leading-relaxed">
          Your personalized patient portal for MedSync Hospital:  
          Track appointments, prescriptions, and securely manage your health records in one place.  
          Instant alerts, health tips, and access to your care team anytime.
        </p>

        {/* Patient Stats Cards */}
        <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mx-auto">
          {stats.map((card, idx) => (
            <div key={idx} className={`rounded-2xl shadow-xl p-6 flex flex-col items-start bg-gradient-to-br ${card.color}
              transition duration-700 ${animateIn ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
              <div className="flex items-center justify-between w-full">
                <div className="text-blue-800 text-3xl font-bold">{card.value}</div>
                <div className="text-3xl text-blue-600">{card.icon}</div>
              </div>
              <div className="text-base text-gray-700 font-medium mt-3">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Pure Patient Actions Grid */}
        <div className="mb-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-5xl mx-auto">
          {actions.map((card, idx) => (
            <div key={idx} className={`rounded-2xl shadow-lg p-7 bg-gradient-to-br ${card.color} flex flex-col items-center transition duration-700 ${animateIn ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
              <div className="text-3xl mb-3 text-blue-700">{card.icon}</div>
              <div className="font-bold text-base text-gray-900 text-center mb-2">{card.label}</div>
              <div className="text-gray-600 text-sm text-center">{card.desc}</div>
            </div>
          ))}
        </div>

        {/* About Section */}
        <section className="mb-16 max-w-5xl mx-auto bg-white/50 rounded-xl p-8 shadow-md">
          <h3 className="text-xl font-bold text-blue-700 mb-5">About MedSync Patient Portal</h3>
          <p className="text-gray-700 text-lg max-w-6xl leading-relaxed">
            Get the care, transparency, and convenience you deserve—from secure health record access to easy bookings and reminders, your MedSync journey is built for patients first.
          </p>
        </section>
      </main>
      <PatientFooter />
    </div>
  );
};

export default PatientDashboard;
