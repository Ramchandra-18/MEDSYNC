// import React, { useState } from 'react';

// const DoctorLogin = () => {
//   const [doctorId, setDoctorId] = useState('');
//   const [password, setPassword] = useState('');
//   const [department, setDepartment] = useState('');
//   const [error, setError] = useState('');

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     const payload = {
//       email: doctorId, // Using doctorId as email
//       password,
//     };

//     try {
//       const response = await fetch("http://127.0.0.1:5000/api/auth/login", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(payload),
//       });

//       const data = await response.json();

//       if (response.ok) {
//         const { user, token } = data;
//         localStorage.setItem("currentUser", JSON.stringify(user));
//         localStorage.setItem("jwtToken", token);
//         window.location.href = `/doctor/dashboard`;
//       } else {
//         setError(data.error || "Login failed. Please try again.");
//       }
//     } catch (error) {
//       console.error("Error:", error);
//       setError("An error occurred. Please try again later.");
//     }
//   };

//   return (
//     <div className="min-h-screen w-screen flex items-left bg-[url('https://images.pexels.com/photos/32213424/pexels-photo-32213424.jpeg')] bg-cover bg-center h-full w-full">
//       <form
//         onSubmit={handleSubmit}
//         className="bg-white shadow-lg rounded-lg p-8 w-full mt-10 max-w-sm text-black space-y-5 ml-10 mb-10 mx-10"
//       >
//         <h2 className="text-2xl font-bold text-gray-800 text-center">
//           Doctor Login
//         </h2>

//         {error && <div className="text-red-600 text-sm text-center">{error}</div>}

//         <input
//           type="text"
//           placeholder="Doctor ID"
//           value={doctorId}
//           onChange={(e) => setDoctorId(e.target.value)}
//           required
//           className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
//         />

//         <select
//           value={department}
//           onChange={(e) => setDepartment(e.target.value)}
//           className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
//         >
//           <option value="">Select Department (optional)</option>
//           <option value="Cardiology">Cardiology</option>
//           <option value="Neurology">Neurology</option>
//           <option value="Pediatrics">Pediatrics</option>
//           <option value="Orthopedics">Orthopedics</option>
//           <option value="Pharmacy">Pharmacy</option>
//         </select>

//         <input
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           required
//           className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
//         />

//         <div className="text-right">
//           <a
//             href="/forgot-password"
//             className="text-sm text-green-600 hover:underline"
//           >
//             Forgot Password?
//           </a>
//         </div>

//         <button
//           type="submit"
//           className="w-full bg-green-600 hover:bg-green-700 hover:text-blue-600 text-white p-3 rounded-lg font-semibold transition"
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

// export default DoctorLogin;
