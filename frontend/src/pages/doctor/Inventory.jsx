import React, { useState, useEffect } from "react";
import DoctorHeader from "../../Components/DoctorHeader";
import DoctorFooter from "../../Components/DoctorFooter";

const Inventory = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/pharmacy/inventory?page=1&limit=50&sort_by=medicine_name&sort_order=asc`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch inventory");
      }
      const data = await response.json();
      setMedicines(data.inventory);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  return (
    <div className="min-h-screen w-screen bg-[url('https://images.pexels.com/photos/1797428/pexels-photo-1797428.jpeg')] bg-cover bg-center flex flex-col">
      <DoctorHeader />

      <main className="flex-grow max-w-5xl mx-auto bg-white rounded-3xl shadow-lg px-10 py-12 mt-20 mb-12 w-full">
        <h2 className="text-3xl font-extrabold text-blue-800 mb-10">Medicine Inventory</h2>
        <div className="overflow-x-auto">
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <table className="w-full border-collapse border border-gray-300 text-gray-800">
              <thead>
                <tr className="bg-blue-100">
                  <th className="border border-gray-300 py-3 px-6 text-left font-semibold">SL</th>
                  <th className="border border-gray-300 py-3 px-6 text-left font-semibold">Medicine Name</th>
                  <th className="border border-gray-300 py-3 px-6 text-left font-semibold">Available Quantity (in stripes)</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((med, idx) => (
                  <tr
                    key={med.id}
                    className={idx % 2 === 0 ? "bg-white" : "bg-blue-50"}
                  >
                    <td className="border border-gray-300 px-6 py-4">{idx + 1}</td>
                    <td className="border border-gray-300 px-6 py-4 font-medium text-blue-700">{med.medicine_name}</td>
                    <td className="border border-gray-300 px-6 py-4">{med.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      <DoctorFooter />
    </div>
  );
};

export default Inventory;
