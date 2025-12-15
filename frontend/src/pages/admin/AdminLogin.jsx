import React, { useState } from 'react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Connect to backend for authentication
    localStorage.setItem("user", JSON.stringify({ role: "admin", email }));
    window.location.href = "/admin/dashboard";
  };

  return (
    <div className="max-w-[400px] mx-auto mt-10">
      <h2 className="text-xl mb-4">Admin Login</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input type="email" required className="border p-2" placeholder="Email"
          value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" required className="border p-2" placeholder="Password"
          value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit" className="bg-red-600 text-white py-2">Login</button>
      </form>
    </div>
  );
};

export default AdminLogin;
