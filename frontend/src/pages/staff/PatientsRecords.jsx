import React from 'react';
import StaffHeader from "../../Components/StaffHeader";
import StaffFooter from "../../Components/StaffFooter";


const patientsMock = [
  { id: 1, name: "John Doe", lastVisit: "2025-08-15", status: "Active", riskLevel: "Low", age: 34, phone: "(555) 123-4567", email: "john.doe@example.com" },
  { id: 2, name: "Mary Smith", lastVisit: "2025-08-05", status: "Pending Follow-up", riskLevel: "Medium", age: 45, phone: "(555) 987-6543", email: "mary.smith@example.com" },
  { id: 3, name: "James Wilson", lastVisit: "2025-07-30", status: "Inactive", riskLevel: "High", age: 52, phone: "(555) 456-7890", email: "james.wilson@example.com" },
  { id: 4, name: "Patricia Reynolds", lastVisit: "2025-08-12", status: "Active", riskLevel: "Medium", age: 28, phone: "(555) 321-8888", email: "patricia.reynolds@example.com" },
  { id: 5, name: "Michael Thompson", lastVisit: "2025-07-25", status: "Active", riskLevel: "Low", age: 39, phone: "(555) 654-3210", email: "michael.thompson@example.com" },
];

const riskLevelColorsBg = {
  Low: "bg-green-100",
  Medium: "bg-yellow-100",
  High: "bg-red-100",
};

const riskLevelColorsText = {
  Low: "text-green-800",
  Medium: "text-yellow-800",
  High: "text-red-800",
};

const PatientsRecords = () => {
  return (
    <div className="h-full w-screen mt-10  p-8 bg-[url('https://images.pexels.com/photos/8376320/pexels-photo-8376320.jpeg')] bg-cover bg-center h-full w-full font-sans">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <StaffHeader />
      </header>
      <h1 className="text-4xl font-extrabold mb-10 text-blue-700 border-b border-blue-600 pb-4">
        Patients Records
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {patientsMock.map((patient) => (
          <div
            key={patient.id}
            className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between"
          >
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">{patient.name}</h2>
              <p className="text-gray-600 mb-1">
                <span className="font-medium">Last Visit:</span> {new Date(patient.lastVisit).toLocaleDateString()}
              </p>
              <p className="text-gray-600 mb-1">
                <span className="font-medium">Status:</span> {patient.status}
              </p>
              <p className="text-gray-600 mb-1">
                <span className="font-medium">Age:</span> {patient.age}
              </p>
              <p className="text-gray-600 mb-1">
                <span className="font-medium">Phone:</span> {patient.phone}
              </p>
              <p className="text-gray-600 mb-3 truncate">
                <span className="font-medium">Email:</span> {patient.email}
              </p>
            </div>
            <div
              className={`inline-block px-4 py-2 rounded-full font-semibold text-sm
                ${riskLevelColorsBg[patient.riskLevel]} ${riskLevelColorsText[patient.riskLevel]} select-none`}
              title={`Risk Level: ${patient.riskLevel}`}
            >
              Risk Level: {patient.riskLevel}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientsRecords;
