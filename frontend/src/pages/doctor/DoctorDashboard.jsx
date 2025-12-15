import React, { useEffect, useState } from "react";
import DoctorHeader from '../../Components/DoctorHeader';
import DoctorFooter from '../../Components/DoctorFooter';
import { getFullNameFromToken } from '../../utils/jwt';
import { FaUserMd, FaCalendarAlt, FaUserInjured, FaNotesMedical, FaBell, FaClipboardList, FaFilePrescription, FaComments } from 'react-icons/fa';

const stats = [
  { value: 27, label: "Today's Queue", color: "from-sky-200 to-blue-100", icon: <FaCalendarAlt /> },
  { value: 9, label: "Upcoming Appointments", color: "from-blue-200 to-sky-100", icon: <FaClipboardList /> },
  { value: 4, label: "Critical Alerts", color: "from-red-100 to-pink-100", icon: <FaBell /> },
];

const actions = [
  { label: "Patient Records", color: "from-sky-100 to-blue-100", icon: <FaUserInjured />, desc: "Access and update medical history securely" },
  { label: "Prescribe Medication", color: "from-blue-100 to-cyan-100", icon: <FaFilePrescription />, desc: "Write prescriptions and review pharmacy status" },
  { label: "Consultation Notes", color: "from-indigo-100 to-sky-100", icon: <FaNotesMedical />, desc: "Document treatment, symptoms, progress" },
  { label: "Messages", color: "from-blue-100 to-white", icon: <FaComments />, desc: "Communicate with patients and staff" },
  { label: "Schedule Manager", color: "from-cyan-100 to-blue-50", icon: <FaCalendarAlt />, desc: "Plan & manage weekly work hours" },
  { label: "Collaboration Board", color: "from-pink-100 to-blue-100", icon: <FaUserMd />, desc: "Coordinate with pharmacy, nursing, admin" },
];

const DoctorDashboardContent = () => {
  const user = JSON.parse(localStorage.getItem('user')) || JSON.parse(localStorage.getItem('currentUser') || 'null');
  const token = localStorage.getItem('jwtToken');
  const fullNameFromToken = getFullNameFromToken(token);
  const displayName = fullNameFromToken || user?.full_name || user?.name || user?.email || 'Doctor';
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimateIn(true), 200);
  }, []);

  return (
    <div className="min-h-screen w-screen flex flex-col bg-gradient-to-br from-sky-100 via-sky-200 to-sky-300 font-sans">
      <DoctorHeader />

      <main className={`pt-20 px-6 max-w-7xl mx-auto w-full flex-grow transition-all duration-700 ${animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
        {/* Title & Quote */}
        <div className="mb-10">
          <h2 className="text-5xl sm:text-6xl font-extrabold mb-7 text-blue-800 tracking-wide select-text">
            Welcome, Dr. {displayName}!
          </h2>
          <p className="text-gray-600 text-xl sm:text-2xl italic mb-8 select-text max-w-2xl">
            “Wherever the art of medicine is loved, there is also a love of humanity.” – Hippocrates
          </p>
        </div>
        
        {/* Quick Doctor Stats */}
        <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
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

        {/* Action/Tools Grid */}
        <div className="mb-16 grid grid-cols-1 md:grid-cols-3 gap-10 w-full max-w-5xl">
          {actions.map((card, idx) => (
            <div key={idx} className={`rounded-2xl shadow-lg p-6 bg-gradient-to-br ${card.color} flex flex-col items-center
              transition duration-700 ${animateIn ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
              <div className="text-3xl mb-2 text-blue-700">{card.icon}</div>
              <div className="font-bold text-lg text-gray-900 text-center mb-2">{card.label}</div>
              <div className="text-gray-600 text-sm text-center">{card.desc}</div>
            </div>
          ))}
        </div>

        {/* Schedule Section */}
        <section className="mt-10">
          <h3 className="text-3xl font-semibold text-blue-700 mb-6">Schedule</h3>
          <p className="text-gray-700 text-lg">
            Manage your weekly schedule here. (Scheduling features coming soon)
          </p>
        </section>
      </main>
      <DoctorFooter />
    </div>
  );
};

export default DoctorDashboardContent;
