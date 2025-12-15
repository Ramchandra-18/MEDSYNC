// import React, { useState } from 'react';

// const StaffLogin = () => {
//   const [staffId, setStaffId] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');

//     // Get registered users from localStorage
//     const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]");

//     // Find registered staff user by staffId, password, and role
//     const foundUser = registeredUsers.find(
//       u => u.staffId === staffId && u.password === password && u.role === 'staff'
//     );

//     if (!foundUser) {
//       setError("Invalid credentials or not a staff account.");
//       setLoading(false);
//       return;
//     }

//     // Save full user object (with role) to localStorage
//     localStorage.setItem("user", JSON.stringify(foundUser));

//     // Redirect to staff dashboard
//     setTimeout(() => {
//       setLoading(false);
//       window.location.href = `/staff/dashboard`;
//     }, 500);
//   };

//   return (
//     <div className="min-h-screen w-screen flex items-center justify-center bg-[url('https://images.pexels.com/photos/5722160/pexels-photo-5722160.jpeg')] bg-cover bg-center h-full w-full text-black">
//       <form
//         onSubmit={handleSubmit}
//         className="bg-white shadow-lg rounded-lg p-8 w-full max-w-sm space-y-5"
//       >
//         <h2 className="text-2xl font-bold text-gray-800 text-center">
//           Staff Login
//         </h2>
//         {error && (
//           <div className="text-red-600 text-sm text-center">{error}</div>
//         )}
//         <input
//           type="text"
//           placeholder="Staff ID"
//           value={staffId}
//           onChange={(e) => setStaffId(e.target.value)}
//           required
//           className="w-full border text-black border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
//           disabled={loading}
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           required
//           className="w-full border text-black border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
//           disabled={loading}
//         />
//         <div className="text-right">
//           <a
//             href="/forgot-password"
//             className="text-sm text-amber-600 hover:underline"
//           >
//             Forgot Password?
//           </a>
//         </div>
//         <button
//           type="submit"
//           className={`w-full ${
//             loading
//               ? 'bg-blue-400 cursor-not-allowed'
//               : 'bg-blue-600 hover:bg-blue-700 hover:text-blue-600'
//           } text-white p-3 rounded-lg font-semibold transition`}
//           disabled={loading}
//         >
//           {loading ? 'Logging in...' : 'Login'}
//         </button>
//         <div className="text-center mt-4">
//           <p className="text-gray-600">Don't have an account?</p>
//           <a
//             href="/register"
//             className="text-blue-600 hover:underline font-semibold"
//           >
//             Register Now
//           </a>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default StaffLogin;
