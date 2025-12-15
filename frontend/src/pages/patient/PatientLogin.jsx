// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// const PatientLogin = () => {
//   const [patientId, setPatientId] = useState('');
//   const [password, setPassword] = useState('');

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     localStorage.setItem("user", JSON.stringify({ role: "patient", patientId }));
//     window.location.href = "/patient/dashboard";
//   };

//   return (
//     <div className="h-screen w-screen flex items-left bg-[url('https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-40568.jpeg')] bg-cover bg-center h-full w-full">
//       <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-sm text-black space-y-5 ml-10 mb-10 mx-10 mt-20">
//         <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
//           Patient Login
//         </h2>
//         <form onSubmit={handleSubmit} className="space-y-5">
//           {/* Patient ID */}
//           <input
//             type="text"
//             placeholder="Patient ID"
//             value={patientId}
//             onChange={(e) => setPatientId(e.target.value)}
//             required
//             className="w-full border border-gray-300 rounded-lg p-3 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
//           />
//           {/* Password */}
//           <input
//             type="password"
//             placeholder="Password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//             className="w-full border border-gray-300 rounded-lg p-3 text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
//           />
//           {/* Forgot Password link */}
//           <div className="text-right">
//             <a
//               href="/forgot-password"
//               className="text-sm text-blue-600 hover:underline"
//             >
//               Forgot Password?
//             </a>
//           </div>
//           {/* Submit Button */}
//           <button
//             type="submit"
//             className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
//           >
//             Login
//           </button>
//           <div className="text-center mt-4">
//             <p className="text-gray-600">Don't have an account?</p>
//             <a
//               href="/register"
//               className="text-blue-600 hover:underline font-semibold"
//             >
//               Register Now
//             </a>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default PatientLogin;
