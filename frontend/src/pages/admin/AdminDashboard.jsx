import React from 'react';

const AdminDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return (
    <div className="max-w-[600px] mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
      <p>Welcome, {user?.email || "Admin"}!</p>
      <ul className="mt-4 list-disc pl-6 text-lg">
        <li>Manage Doctors, Staff, & Roles</li>
        <li>View Analytics, Disease Trends</li>
        <li>Blockchain Logs & Audit</li>
      </ul>
    </div>
  );
};

export default AdminDashboard;
