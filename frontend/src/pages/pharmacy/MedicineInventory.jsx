import React, { useState, useEffect } from "react";
import PharmacyHeader from "../../Components/PharmacyHeader";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const MedicineInventory = () => {
  const [medicines, setMedicines] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newMed, setNewMed] = useState({ name: "", quantity: "", expiry: "" });
  const [updateMed, setUpdateMed] = useState({
    name: "",
    quantity: "",
    expiry: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE}/api/pharmacy/inventory?page=1&limit=50&sort_by=medicine_name&sort_order=asc`
      );
      if (!response.ok) throw new Error("Failed to fetch inventory");
      const data = await response.json();
      setMedicines(data.inventory || []);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const openAdd = () => {
    setNewMed({ name: "", quantity: "", expiry: "" });
    setShowAddModal(true);
  };

  const closeAdd = () => setShowAddModal(false);

  const handleNewChange = (e) => {
    const { name, value } = e.target;
    setNewMed((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newMed.name.trim()) return alert("Please enter medicine name");
    const qty = Number(newMed.quantity);
    if (!qty || qty <= 0) return alert("Please enter a valid quantity");
    if (!newMed.expiry) return alert("Please select an expiry date");

    const item = {
      medicine_name: newMed.name.trim(),
      quantity: qty,
      expiry_date: newMed.expiry,
      action: "add",
    };

    try {
      const response = await fetch(`${API_BASE}/api/pharmacy/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error("Failed to add medicine");
      const data = await response.json();
      alert(data.message || "Medicine added");
      fetchInventory();
      setShowAddModal(false);
    } catch (err) {
      alert(err.message || "Something went wrong");
    }
  };

  const openUpdate = () => {
    setUpdateMed({ name: "", quantity: "", expiry: "" });
    setShowUpdateModal(true);
  };

  const closeUpdate = () => setShowUpdateModal(false);

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateMed((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!updateMed.name.trim()) return alert("Please enter medicine name");
    const qty = Number(updateMed.quantity);
    if (!qty || qty < 0) return alert("Enter a valid (≥0) quantity");
    if (!updateMed.expiry) return alert("Select expiry date");

    const item = {
      medicine_name: updateMed.name.trim(),
      quantity: qty,
      expiry_date: updateMed.expiry,
      action: "restock",
    };

    try {
      const response = await fetch(`${API_BASE}/api/pharmacy/inventory`, {
        method: "POST", // adjust to PUT/PATCH if needed
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error("Failed to update medicine");
      const data = await response.json();
      alert(data.message || "Medicine updated");
      fetchInventory();
      setShowUpdateModal(false);
    } catch (err) {
      alert(err.message || "Something went wrong");
    }
  };

  const today = new Date();

  const getExpiryBadge = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;

    const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center rounded-full bg-rose-50 text-rose-600 text-[11px] px-2 py-0.5 border border-rose-100">
          Expired
        </span>
      );
    }
    if (diffDays <= 30) {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-600 text-[11px] px-2 py-0.5 border border-amber-100">
          Expiring soon
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-600 text-[11px] px-2 py-0.5 border border-emerald-100">
        Fresh stock
      </span>
    );
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50 text-slate-900">
      {/* soft background blobs */}
      <div className="pointer-events-none fixed inset-0 opacity-60 mix-blend-multiply">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-sky-200 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-emerald-200 blur-3xl" />
      </div>

      <div className="fixed top-0 left-0 right-0 z-40">
        <PharmacyHeader />
      </div>

      <main className="relative z-10 pt-24 pb-12 px-3 md:px-8 flex justify-center">
        <div className="w-full max-w-6xl rounded-3xl bg-white/80 backdrop-blur-xl border border-white/70 shadow-[0_16px_50px_rgba(15,23,42,0.10)] p-6 md:p-8">
          {/* header row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-600">
                Inventory overview
              </p>
              <h1 className="mt-1 text-2xl md:text-3xl font-semibold text-slate-900">
                Medicine Inventory
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Track quantities, expiry dates, and keep your pharmacy shelves under control.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={openAdd}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 text-white text-sm font-semibold px-4 py-2 shadow-sm hover:shadow-md hover:brightness-110 transition"
              >
                + Add Medicine
              </button>
              <button
                onClick={openUpdate}
                className="inline-flex items-center justify-center rounded-xl border border-sky-300 bg-sky-50 text-sky-800 text-sm font-semibold px-4 py-2 hover:bg-sky-100 transition"
              >
                Update / Restock
              </button>
            </div>
          </div>

          {/* table / loading / error */}
          {loading ? (
            <div className="flex justify-center py-10 text-sm text-slate-500">
              Loading inventory...
            </div>
          ) : error ? (
            <div className="py-4 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4">
              {error}
            </div>
          ) : medicines.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              No medicines found. Add your first item to get started.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/80">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100/80">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-[0.16em]">
                        Medicine
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-[0.16em]">
                        Quantity
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-[0.16em]">
                        Expiry
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-[0.16em]">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {medicines.map((med, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-white transition-colors"
                      >
                        <td className="px-5 py-3 text-slate-900">
                          <span className="font-medium">{med.medicine_name}</span>
                        </td>
                        <td className="px-5 py-3 text-slate-800">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${
                              med.quantity === 0
                                ? "bg-rose-50 text-rose-600 border-rose-100"
                                : med.quantity < 10
                                ? "bg-amber-50 text-amber-600 border-amber-100"
                                : "bg-emerald-50 text-emerald-600 border-emerald-100"
                            }`}
                          >
                            {med.quantity} units
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-800">
                          {med.expiry_date}
                        </td>
                        <td className="px-5 py-3 text-slate-800">
                          {getExpiryBadge(med.expiry_date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-3">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-white/70 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              Add Medicine
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Create a new inventory record with name, quantity, and expiry date.
            </p>
            <form onSubmit={handleAddSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Medicine name
                </label>
                <input
                  name="name"
                  value={newMed.name}
                  onChange={handleNewChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                  placeholder="e.g. Paracetamol 500mg"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Quantity
                  </label>
                  <input
                    name="quantity"
                    value={newMed.quantity}
                    onChange={handleNewChange}
                    type="number"
                    min="1"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Expiry date
                  </label>
                  <input
                    name="expiry"
                    value={newMed.expiry}
                    onChange={handleNewChange}
                    type="date"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={closeAdd}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-emerald-500 to-sky-500 text-white hover:brightness-110 shadow-sm"
                >
                  Save medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Medicines Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-3">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-white/70 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              Restock / Update Medicine
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Update quantity and expiry for an existing medicine.
            </p>
            <form onSubmit={handleUpdateSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Medicine name
                </label>
                <input
                  name="name"
                  value={updateMed.name}
                  onChange={handleUpdateChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                  placeholder="Exact name as in inventory"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    New quantity
                  </label>
                  <input
                    name="quantity"
                    value={updateMed.quantity}
                    onChange={handleUpdateChange}
                    type="number"
                    min="0"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    New expiry date
                  </label>
                  <input
                    name="expiry"
                    value={updateMed.expiry}
                    onChange={handleUpdateChange}
                    type="date"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={closeUpdate}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:brightness-110 shadow-sm"
                >
                  Update medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineInventory;
