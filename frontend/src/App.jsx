import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import Header from "./Components/Header";
import Footer from "./Components/Footer";

import Home from "./pages/Home";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import Register from './pages/Register.jsx';
import LoginPage from './pages/LoginPage'; // universal login
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientDoctors from "./Pages/Patient/PatientDoctors";

// import PatientDoctors from "./Pages/Patient/PatientDoctors"; // Fix path or comment if missing

import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StaffDashboard from "./pages/staff/StaffDashboard";
import PharmacyDashboard from "./pages/pharmacy/PharmacyDashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ErrorBoundary from "./Components/ErrorBoundary";

import Appointments from './pages/patient/Appointments';

import Profile from './pages/patient/Profile';

import TodaysAppointments from "./pages/doctor/TodaysAppointments";
import PrescriptionPage from './pages/doctor/PrescriptionPage';
import Inventory from "./pages/doctor/Inventory";

import MedicineInventory from './pages/pharmacy/MedicineInventory';
import RestockAlerts from './pages/pharmacy/RestockAlerts';
import Prescriptions from "./pages/pharmacy/Prescriptions";

import AppointmentConfirmation from './pages/staff/AppointmentConfirmation';

import PatientsRecords from './pages/staff/PatientsRecords';
import Schedule from "./pages/doctor/schedule";


// ProtectedRoute component with case-insensitive role validation 
// and redirect to login if not authorized.
const ProtectedRoute = ({ children, role }) => {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  const location = useLocation();

  if (!user) {
    // Redirect unauthenticated users to login page
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role.toLowerCase() !== role.toLowerCase()) {
    // Show access denied for unauthorized roles
    return (
      <div className="p-6 text-red-600 font-bold">
        Access denied. Please login with the correct role.
      </div>
    );
  }

  return children;
};


// Wrapper to get :role param for role-based login page
const LoginWrapper = () => {
  const { role } = useParams();
  return <LoginPage initialRole={role} />;
};


function App() {
  return (
   <Router>
      <ErrorBoundary>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/:role" element={<LoginWrapper />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Patient */}
          <Route path="/patient/dashboard" element={<ProtectedRoute role="Patient"><PatientDashboard /></ProtectedRoute>} />
          <Route path="/patient/appointments" element={<ProtectedRoute role="Patient"><Appointments /></ProtectedRoute>} />
          <Route path="/patient/profile" element={<ProtectedRoute role="Patient"><Profile /></ProtectedRoute>} />
         <Route path="/patient/doctors" element={<PatientDoctors />} />

          {/* Doctor */}
          <Route path="/doctor/dashboard" element={<ProtectedRoute role="Doctor"><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/doctor/todays-appointments" element={<ProtectedRoute role="Doctor"><TodaysAppointments /></ProtectedRoute>} />
          <Route path="/doctor/inventory" element={<ProtectedRoute role="Doctor"><Inventory /></ProtectedRoute>} />
          <Route path="/doctor/prescriptions" element={<ProtectedRoute role="Doctor"><PrescriptionPage /></ProtectedRoute>} />
          <Route path="/doctor/schedule" element={<ProtectedRoute role="Doctor"><Schedule /></ProtectedRoute>} />

          {/* Pharmacy */}
          <Route path="/pharmacy/dashboard" element={<ProtectedRoute role="Pharmacy"><PharmacyDashboard /></ProtectedRoute>} />
          <Route path="/pharmacy/inventory" element={<ProtectedRoute role="Pharmacy"><MedicineInventory /></ProtectedRoute>} />
          <Route path="/pharmacy/restock-alerts" element={<ProtectedRoute role="Pharmacy"><RestockAlerts /></ProtectedRoute>} />
          <Route path="/pharmacy/prescriptions" element={<ProtectedRoute role="Pharmacy"><Prescriptions /></ProtectedRoute>} />

          {/* Staff */}
          <Route path="/staff/dashboard" element={<ProtectedRoute role="Staff"><StaffDashboard /></ProtectedRoute>} />
          <Route path="/staff/appointment-confirmation" element={<ProtectedRoute role="Staff"><AppointmentConfirmation /></ProtectedRoute>} />
          <Route path="/staff/patients-records" element={<ProtectedRoute role="Staff"><PatientsRecords /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin/dashboard" element={<ProtectedRoute role="Admin"><AdminDashboard /></ProtectedRoute>} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
