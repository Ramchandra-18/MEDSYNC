import React, { useState, useEffect } from 'react';
import PharmacyHeader from "../../Components/PharmacyHeader";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const MedicineInventory = () => {
  const [medicines, setMedicines] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newMed, setNewMed] = useState({ name: '', quantity: '', expiry: '' });
  const [updateMed, setUpdateMed] = useState({ name: '', quantity: '', expiry: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/pharmacy/inventory?page=1&limit=50&sort_by=medicine_name&sort_order=asc`);
      if (!response.ok) throw new Error('Failed to fetch inventory');
      const data = await response.json();
      setMedicines(data.inventory);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  const openAdd = () => {
    setNewMed({ name: '', quantity: '', expiry: '' });
    setShowAddModal(true);
  };

  const closeAdd = () => setShowAddModal(false);

  const handleNewChange = (e) => {
    const { name, value } = e.target;
    setNewMed(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newMed.name.trim()) return alert('Please enter medicine name');
    const qty = Number(newMed.quantity);
    if (!qty || qty <= 0) return alert('Please enter a valid quantity');
    if (!newMed.expiry) return alert('Please select an expiry date');
    const item = { medicine_name: newMed.name.trim(), quantity: qty, expiry_date: newMed.expiry, action: 'add' };
    try {
      const response = await fetch(`${API_BASE}/api/pharmacy/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error('Failed to add medicine');
      const data = await response.json();
      alert(data.message);
      fetchInventory();
      setShowAddModal(false);
    } catch (err) {
      alert(err.message);
    }
  };

  // === NEW: Update Modal logic ===
  const openUpdate = () => {
    setUpdateMed({ name: '', quantity: '', expiry: '' });
    setShowUpdateModal(true);
  };

  const closeUpdate = () => setShowUpdateModal(false);

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateMed(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!updateMed.name.trim()) return alert('Please enter medicine name');
    const qty = Number(updateMed.quantity);
    if (!qty || qty < 0) return alert('Enter a valid (≥0) quantity');
    if (!updateMed.expiry) return alert('Select expiry date');
    // Assume backend supports POST with action: 'update'
    const item = { medicine_name: updateMed.name.trim(), quantity: qty, expiry_date: updateMed.expiry, action: 'restock' };
    try {
      const response = await fetch(`${API_BASE}/api/pharmacy/inventory`, {
        method: 'POST', // Change to PUT if your API expects PUT/PATCH
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error('Failed to update medicine');
      const data = await response.json();
      alert(data.message);
      fetchInventory();
      setShowUpdateModal(false);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-green-50 p-12 font-sans">
      <div className="fixed top-0 left-0 right-0 z-50">
        <PharmacyHeader />
      </div>
      <div className="max-w-6xl mx-auto bg-white rounded-3xl p-10 text-black shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-green-700">Medicine Inventory</h1>
          <div className="space-x-2">
            <button onClick={openAdd} className="px-4 py-2 bg-gradient-to-r from-purple-900 via-grenn-500 to-rose-800 text-white rounded hover:bg-green-700">+ Add Medicine</button>
            <button onClick={openUpdate} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-green-400 text-white rounded hover:bg-blue-900">Update Medicines</button>
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <table className="w-full table-auto text-black border-collapse border border-gray-300">
            <thead>
              <tr className="bg-green-100 text-black">
                <th className="border border-gray-300 text-black px-6 py-3 text-left">Medicine Name</th>
                <th className="border border-gray-300 text-black px-6 py-3 text-left">Quantity</th>
                <th className="border border-gray-300 text-black px-6 py-3 text-left">Expiry Date</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((med, idx) => (
                <tr key={idx} className="hover:bg-green-50">
                  <td className="border text-black border-gray-300 px-6 py-3">{med.medicine_name}</td>
                  <td className="border text-black border-gray-300 px-6 py-3">{med.quantity}</td>
                  <td className="border text-black border-gray-300 px-6 py-3">{med.expiry_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="fixed text-black inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Medicine</h2>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="text-black block text-sm font-medium mb-1">Medicine Name</label>
                <input name="name" value={newMed.name} onChange={handleNewChange} className="w-full border px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input name="quantity" value={newMed.quantity} onChange={handleNewChange} type="number" min="1" className="w-full border px-3 py-2 rounded text-black" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expiry Date</label>
                <input name="expiry" value={newMed.expiry} onChange={handleNewChange} type="date" className="w-full border px-3 py-2 rounded" />
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" onClick={closeAdd} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Medicines Modal */}
      {showUpdateModal && (
        <div className="fixed text-black inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Update Medicine</h2>
            <form onSubmit={handleUpdateSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Medicine Name</label>
                <input name="name" value={updateMed.name} onChange={handleUpdateChange} className="w-full border px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input name="quantity" value={updateMed.quantity} onChange={handleUpdateChange} type="number" min="0" className="w-full border px-3 py-2 rounded text-black" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expiry Date</label>
                <input name="expiry" value={updateMed.expiry} onChange={handleUpdateChange} type="date" className="w-full border px-3 py-2 rounded" />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" onClick={closeUpdate} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-green-400 text-white rounded">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineInventory;
