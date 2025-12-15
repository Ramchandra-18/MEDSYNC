import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffHeader from '../../Components/StaffHeader';
import StaffFooter from '../../Components/StaffFooter';
import { getFullNameFromToken } from '../../utils/jwt';
import { FaCalendarPlus, FaClipboardList, FaUsers, FaUserMd, FaFileAlt, FaBell } from 'react-icons/fa';

const stats = [
  { value: 12, label: "Today's Appointments", color: "from-blue-200 to-sky-100", icon: <FaCalendarPlus /> },
  { value: 5, label: "Doctors On Duty", color: "from-indigo-100 to-blue-100", icon: <FaUserMd /> },
  { value: 38, label: "Registered Patients", color: "from-cyan-100 to-lime-100", icon: <FaUsers /> },
];

const actions = [
  { label: "Manage Appointments", icon: <FaClipboardList />, color: "from-blue-100 to-sky-100", desc: "View, reschedule, or cancel patient bookings" },
  { label: "Doctor Schedules", icon: <FaUserMd />, color: "from-violet-100 to-blue-100", desc: "Keep track of doctor shifts and timings" },
  { label: "Patient Records", icon: <FaFileAlt />, color: "from-green-100 to-lime-100", desc: "Access, update, or archive medical records" },
  { label: "Notifications", icon: <FaBell />, color: "from-yellow-100 to-orange-100", desc: "Review alerts, reminders, and urgent messages" },
];

const StaffDashboardMain = () => {
  const user = JSON.parse(localStorage.getItem('user')) || JSON.parse(localStorage.getItem('currentUser') || 'null');
  const token = localStorage.getItem('jwtToken');
  const fullNameFromToken = getFullNameFromToken(token);
  const displayName = fullNameFromToken || user?.full_name || user?.name || user?.email || 'Staff';
  const navigate = useNavigate();
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimateIn(true), 200);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const toggleBookingForm = () => {
    setShowBookingForm(!showBookingForm);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Appointment booked successfully!");
    setShowBookingForm(false);
  };

  return (
    <div className="min-h-screen w-screen font-sans bg-gradient-to-br from-sky-50 via-blue-100 to-cyan-100 flex flex-col">
      <StaffHeader />

      <main className={`max-w-6xl mx-auto px-6 py-12 flex-grow transition-all duration-700 ${animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        {/* Title */}
        <h2 className="text-4xl font-extrabold mb-3 text-blue-700 select-text">
          Welcome, {displayName}!
        </h2>
        <p className="text-gray-700 text-lg mb-10 max-w-3xl leading-relaxed">
          Manage appointments, coordinate doctors, and keep patient services running smoothly. Stay organized and responsive from this single hub.
        </p>

        {/* Staff Stats Cards */}
        <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {stats.map((card, idx) => (
            <div key={idx} className={`rounded-2xl shadow-xl p-6 flex flex-col items-start bg-gradient-to-br ${card.color}
              transition duration-700 ${animateIn ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
              <div className="flex items-center justify-between w-full">
                <div className="text-blue-900 text-3xl font-bold">{card.value}</div>
                <div className="text-3xl text-blue-600">{card.icon}</div>
              </div>
              <div className="text-base text-gray-700 font-medium mt-3">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Action Grid */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-4 gap-8 w-full">
          {actions.map((card, idx) => (
            <div key={idx} className={`rounded-2xl shadow-lg p-6 bg-gradient-to-br ${card.color} flex flex-col items-center transition duration-700 ${animateIn ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
              <div className="text-3xl mb-2 text-blue-700">{card.icon}</div>
              <div className="font-bold text-base text-gray-900 text-center mb-1">{card.label}</div>
              <div className="text-gray-600 text-sm text-center">{card.desc}</div>
            </div>
          ))}
        </div>

        {/* New Appointment Booking (CTA) */}
        <section className="flex justify-center my-8">
          <button
            onClick={toggleBookingForm}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-8 py-3 rounded-lg shadow-xl transition text-lg"
          >
            Schedule New Appointment
          </button>
        </section>

        {/* Booking Form Modal */}
        {showBookingForm && (
          <section className="mt-8 max-w-lg mx-auto bg-white rounded-2xl shadow-2xl p-8 animate-fade-in">
            <h3 className="text-2xl font-semibold mb-6 text-blue-700">Book New Appointment</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <input type="text" required placeholder="Patient Name" className="border rounded-lg px-4 py-2" />
              <input type="date" required className="border rounded-lg px-4 py-2" />
              <select required className="border rounded-lg px-4 py-2">
                <option value="">Select Doctor</option>
                <option value="Dr. Smith">Dr. Smith</option>
                <option value="Dr. Patel">Dr. Patel</option>
              </select>
              <button type="submit" className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold py-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 shadow transition">
                Book Appointment
              </button>
            </form>
          </section>
        )}
      </main>

      <StaffFooter />
    </div>
  );
};

export default StaffDashboardMain;
