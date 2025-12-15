// import React, { useState } from 'react';

// const PharmacyLogin = () => {
//   const [pharmacyId, setPharmacyId] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState(''); // For error messages

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     // Get registered users from localStorage
//     const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]");

//     // Find pharmacy user with the given pharmacyId
//     const foundUser = registeredUsers.find(
//       (u) => u.role === "pharmacy" && u.pharmacyId === pharmacyId
//     );

//     if (!foundUser) {
//       setError("No pharmacy account found with this Pharmacy ID.");
//       return;
//     }

//     // Check password match
//     if (foundUser.password !== password) {
//       setError("Password is incorrect."); // Show error if wrong password
//       return;
//     }

//     // If credentials valid → log in and redirect
//     localStorage.setItem("user", JSON.stringify(foundUser));
//     window.location.href = "/pharmacy/dashboard";
//   };

//   return (
//     <div className="min-h-screen w-screen flex items-left bg-[url('https://images.pexels.com/photos/5998512/pexels-photo-5998512.jpeg')] bg-cover bg-center h-full w-full">
//       <form
//         onSubmit={handleSubmit}
//         className="bg-white shadow-lg rounded-lg p-8 w-full max-w-sm text-black space-y-5 ml-10 mb-10 mx-10 mt-20"
//       >
//         <h2 className="text-2xl font-bold text-gray-800 text-center">
//           Pharmacy Login
//         </h2>

//         {/* Show error message */}
//         {error && (
//           <div className="text-red-600 text-sm text-center">{error}</div>
//         )}

//         {/* Pharmacy ID */}
//         <input
//           type="text"
//           placeholder="Pharmacy ID"
//           value={pharmacyId}
//           onChange={(e) => setPharmacyId(e.target.value)}
//           required
//           className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none text-black focus:ring-2 focus:ring-blue-400"
//         />

//         {/* Password */}
//         <input
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           required
//           className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none text-black focus:ring-2 focus:ring-blue-400"
//         />

//         {/* Forgot password link */}
//         <div className="text-right">
//           <a
//             href="/forgot-password"
//             className="text-sm text-purple-600 hover:underline"
//           >
//             Forgot Password?
//           </a>
//         </div>

//         {/* Submit button */}
//         <button
//           type="submit"
//           className="w-full bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg font-semibold transition"
//         >
//           Login
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

// export default PharmacyLogin;
