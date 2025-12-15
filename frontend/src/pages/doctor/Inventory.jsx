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
      setMedicines(data.inventory || []);
    } catch (err) {
      setError(err.message || "Failed to fetch inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  return (
    <div className="min-h-screen w-screen flex flex-col bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50 text-slate-900">
      {/* background accents */}
      <div className="pointer-events-none fixed inset-0 opacity-60 mix-blend-multiply">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-sky-200 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-emerald-200 blur-3xl" />
      </div>

      <div className="fixed top-0 left-0 right-0 z-40">
        <DoctorHeader />
      </div>

      <main className="relative z-10 flex-grow pt-24 pb-10 px-4 sm:px-8 lg:px-16 flex justify-center">
        <div className="w-full max-w-5xl rounded-3xl bg-white/85 backdrop-blur-xl border border-white/70 shadow-[0_16px_50px_rgba(15,23,42,0.10)] px-5 sm:px-7 py-6">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-sky-600">
                MedSync · Pharmacy
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900">
                Medicine inventory
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                View available medicines and their current stock (in strips).
              </p>
            </div>
            <button
              type="button"
              onClick={fetchInventory}
              className="self-start sm:self-auto px-4 py-2 rounded-xl bg-sky-600 text-white text-xs sm:text-sm font-semibold shadow-sm hover:bg-sky-700 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {/* Content */}
          <div className="relative overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/70">
            {loading && (
              <div className="py-10 text-center text-sm text-slate-500">
                Loading inventory...
              </div>
            )}

            {error && !loading && (
              <div className="py-6 px-4 text-sm text-rose-700 bg-rose-50 border-b border-rose-100">
                {error}
              </div>
            )}

            {!loading && !error && medicines.length === 0 && (
              <div className="py-10 text-center text-sm text-slate-500">
                No medicines found in inventory.
              </div>
            )}

            {!loading && !error && medicines.length > 0 && (
              <table className="min-w-full text-xs sm:text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="py-3 px-4 text-left font-semibold w-16">
                      SL
                    </th>
                    <th className="py-3 px-4 text-left font-semibold">
                      Medicine name
                    </th>
                    <th className="py-3 px-4 text-left font-semibold">
                      Available quantity (strips)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((med, idx) => (
                    <tr
                      key={med.id || med.medicine_name + idx}
                      className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
                      <td className="px-4 py-3 text-slate-600">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-sky-800">
                        {med.medicine_name}
                      </td>
                      <td className="px-4 py-3 text-slate-800">
                        {med.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      <DoctorFooter />
    </div>
  );
};

export default Inventory;
