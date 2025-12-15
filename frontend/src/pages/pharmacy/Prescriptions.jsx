import React, { useEffect, useState } from "react";
import PharmacyHeader from "../../Components/PharmacyHeader";
import PharmacyFooter from "../../Components/PharmacyFooter";
// import { Document, Page, ... } from "@react-pdf/renderer"; // keep if you need PDFs!

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const PrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total_count: 0, total_pages: 1 });
  const [filters, setFilters] = useState({
    page: 1, limit: 10, sort_by: "created_at", sort_order: "desc",
    patient_email: "", patient_name: "", doctor_name: "",
    doctor_code: "", department: "", disease: "",
    prescription_date: "", date_from: "", date_to: ""
  });

  // Modal State
  const [viewPrescription, setViewPrescription] = useState(null);
  const [showBillForm, setShowBillForm] = useState(false);
  const [billInputs, setBillInputs] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [sendLoading, setSendLoading] = useState(false);
  const [sendBillLoading, setSendBillLoading] = useState(false);
  const [billResponse, setBillResponse] = useState(null);

  // Fetch prescriptions from API
  const fetchPrescriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = Object.entries(filters)
        .filter(([k, v]) => v && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");
      const url = `${API_BASE}/api/pharmacy/prescriptions${params ? "?" + params : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || data?.error || "Failed to fetch prescriptions");
      setPrescriptions(Array.isArray(data.prescriptions) ? data.prescriptions : []);
      setPagination(data.pagination || { page: 1, limit: 10, total_count: 0, total_pages: 1 });
    } catch (e) {
      setError(e.message || "Network error");
      setPrescriptions([]);
      setPagination({ page: 1, limit: 10, total_count: 0, total_pages: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrescriptions(); }, [filters]);

  const gotoPage = (p) => setFilters((f) => ({ ...f, page: p }));

  // Bill Form helpers
  const handleOpenBillForm = (presc) => {
    setShowBillForm(true);
    setBillResponse(null);
    const items = Array.isArray(presc.medicines)
      ? presc.medicines.map((m, i) => ({
          sNo: i + 1,
          code: m.medication || "",
          particular: m.medication || "",
          quantity: 1,
          rate: 0,
          amount: 0,
        }))
      : [];
    setBillInputs(items);
    setTotalAmount(0);
  };

  const handleBillItemChange = (idx, field, value) => {
    setBillInputs((prev) =>
      prev.map((item, i) =>
        i === idx
          ? {
              ...item,
              [field]: field === "quantity" || field === "rate" ? Number(value) : value,
              amount:
                field === "quantity" || field === "rate"
                  ? ((field === "quantity" ? Number(value) : item.quantity) *
                      (field === "rate" ? Number(value) : item.rate))
                  : item.quantity * item.rate,
            }
          : item
      )
    );
  };

  useEffect(() => {
    setTotalAmount(billInputs.reduce((sum, item) => sum + (item.amount || 0), 0));
  }, [billInputs]);

  // Send Prescription PDF API
  const handleSendPrescription = async () => {
    if (!viewPrescription?.id) return;
    setSendLoading(true);
    try {
      const url = `${API_BASE}/api/pharmacy/prescriptions/${viewPrescription.id}/send_pdf`;
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.message || "Failed to send PDF");
      alert(data.message || "Prescription PDF sent to patient's email.");
    } catch (e) {
      alert("Failed to send prescription PDF: " + e.message);
    } finally {
      setSendLoading(false);
    }
  };

  // Bill API Payload Builder
  function buildBillDataFromInputs(presc, billInputs, totalAmount) {
    return {
      receipt_no: "AUTO-GEN",
      uhid: presc.patient_email || "",
      patient_name: presc.patient_name || "",
      dob: presc.patient_dob || "",
      age: presc.patient_age || "",
      gender: presc.patient_gender || "",
      mobile: presc.patient_phone || "",
      address: presc.patient_address || "",
      receipt_date: new Date().toISOString(),
      department: presc.doctor_department || "",
      doctor_name: presc.doctor_name || "",
      total_amount: Number(totalAmount),
      amount_paid: Number(totalAmount),
      balance_amount: 0,
      amount_in_words: "",
      items: billInputs.map(b => ({
        code: b.code,
        particular: b.particular,
        rate: Number(b.rate),
        unit: Number(b.quantity),
        amount: Number(b.amount),
      }))
    };
  }

  // Correct Bill Submit Handler for API, now with blockchain UI state
  const handleBillSubmit = async () => {
    if (!viewPrescription?.id) return;
    setSendBillLoading(true);
    setBillResponse(null);
    try {
      const billData = buildBillDataFromInputs(viewPrescription, billInputs, totalAmount);
      const url = `${API_BASE}/api/pharmacy/prescriptions/${viewPrescription.id}/send_pdf_bill`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.message || "Failed to send PDF/bill");
      setBillResponse(data); // set blockchain etc
      // Optionally close modal: setShowBillForm(false);
    } catch (e) {
      setBillResponse({ error: e.message });
    } finally {
      setSendBillLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-blue-50 flex flex-col">
      <PharmacyHeader />
      <main className="flex-grow p-8">
        <h1 className="text-3xl font-bold mb-6 text-blue-800">Prescription List</h1>
        {loading && <div className="p-4 text-blue-700 text-center font-semibold">Loading prescriptions...</div>}
        {error && <div className="p-4 text-red-600 text-center font-semibold">{error}</div>}
        <div className="overflow-x-auto shadow-lg rounded-lg bg-white mb-8">
          <table className="min-w-full table-auto border-collapse border border-gray-200 text-gray-800">
            <thead className="bg-blue-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left">SL</th>
                <th className="border border-gray-300 px-4 py-2">Patient</th>
                <th className="border border-gray-300 px-4 py-2">Doctor</th>
                <th className="border border-gray-300 px-4 py-2">Disease</th>
                <th className="border border-gray-300 px-4 py-2">Date</th>
                <th className="border border-gray-300 px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((p, idx) => (
                <tr key={p.id || idx} className="bg-white">
                  <td className="border px-4 py-2">{((pagination.page || 1) - 1) * (filters.limit || 10) + idx + 1}</td>
                  <td className="border px-4 py-2">{p.patient_name || "(Unknown)"}</td>
                  <td className="border px-4 py-2">{p.doctor_name || "-"}</td>
                  <td className="border px-4 py-2">{p.disease || "-"}</td>
                  <td className="border px-4 py-2">{p.prescription_date || "-"}</td>
                  <td className="border px-4 py-2 flex gap-2">
                    <button className="bg-gradient-to-r from-blue-600 to-sky-400 text-white px-3 py-1 rounded"
                      onClick={() => setViewPrescription(p)}
                      type="button">
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {prescriptions.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500">
                    No prescriptions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {pagination && pagination.total_pages > 1 && (
          <div className="mt-2 flex gap-2">
            <button disabled={filters.page === 1} onClick={() => gotoPage(filters.page - 1)} className="px-2">
              &lt;
            </button>
            {[...Array(pagination.total_pages).keys()].map((i) => (
              <button
                key={i + 1}
                onClick={() => gotoPage(i + 1)}
                className={`px-3 py-1 rounded ${filters.page === i + 1 ? "bg-blue-600 text-white" : "bg-gray-100"}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={filters.page === pagination.total_pages}
              onClick={() => gotoPage(filters.page + 1)}
              className="px-2"
            >
              &gt;
            </button>
          </div>
        )}
        {viewPrescription && (
          <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
            <div className="bg-white max-w-2xl w-full rounded-xl shadow-2xl p-6 relative text-black">
              <button className="absolute right-2 top-2 text-3xl !text-red-500 !bg-white" onClick={() => {setViewPrescription(null); setShowBillForm(false);}}>×</button>
              <h2 className="text-2xl font-bold mb-3">Prescription Detail</h2>
              <div className="mb-2"><b>Patient:</b> {viewPrescription.patient_name} ({viewPrescription.patient_gender}, {viewPrescription.patient_age})</div>
              <div className="mb-2"><b>Doctor:</b> {viewPrescription.doctor_name} ({viewPrescription.doctor_code})</div>
              <div className="mb-2"><b>Disease:</b> {viewPrescription.disease}</div>
              <div className="mb-2"><b>Date:</b> {viewPrescription.prescription_date} {viewPrescription.prescription_time}</div>
              <div className="mb-2"><b>Medicines:</b>
                <ul className="ml-6 list-decimal">
                  {Array.isArray(viewPrescription.medicines) &&
                    viewPrescription.medicines.map((m, i) =>
                      <li key={i}>{m.medication} — {m.dosage}, {m.frequency}</li>
                    )}
                </ul>
              </div>
              <div className="mt-4 flex gap-4">
                <button
                  className="bg-gradient-to-r from-green-600 via-teal-500 to-blue-500 text-white px-4 py-2 rounded"
                  onClick={handleSendPrescription}
                  disabled={sendLoading}
                >
                  {sendLoading ? "Sending..." : "Send Prescription"}
                </button>
                <button
                  className="bg-gradient-to-r from-indigo-700 to-emerald-500 text-white px-4 py-2 rounded"
                  onClick={() => handleOpenBillForm(viewPrescription)}
                >
                  Generate Bill
                </button>
              </div>
              {showBillForm && (
                <div className="mt-8 p-4 border rounded-xl bg-slate-50">
                  <h3 className="text-lg font-bold mb-2 text-green-700">Generate Bill</h3>
                  <form onSubmit={e => { e.preventDefault(); handleBillSubmit(); }}>
                    <table className="min-w-full mb-3">
                      <thead>
                        <tr>
                          <th className="px-2 text-left">S. No.</th>
                          <th className="px-2 text-left">Item</th>
                          <th className="px-2 text-left">Quantity</th>
                          <th className="px-2 text-left">Rate</th>
                          <th className="px-2 text-left">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billInputs.map((item, i) => (
                          <tr key={i}>
                            <td className="px-2">{item.sNo}</td>
                            <td className="px-2">{item.particular}</td>
                            <td className="px-2">
                              <input type="number" min="1" value={item.quantity}
                                onChange={e => handleBillItemChange(i, "quantity", e.target.value)}
                                className="border rounded px-2 py-1 w-16" />
                            </td>
                            <td className="px-2">
                              <input type="number" min="0" value={item.rate}
                                onChange={e => handleBillItemChange(i, "rate", e.target.value)}
                                className="border rounded px-2 py-1 w-20" />
                            </td>
                            <td className="px-2">{item.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex justify-end font-bold">
                      Total Amount: <span className="ml-2 text-blue-900">₹{totalAmount}</span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-gradient-to-r from-teal-600 via-sky-500 to-blue-700 rounded text-white"
                        disabled={sendBillLoading}
                      >
                        {sendBillLoading ? "Sending Bill..." : "Send Bill + Prescription PDF"}
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 rounded border text-white bg-gradient-to-r from-red-500 via-pink-500 to-yellow-400"
                        onClick={() => setShowBillForm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                  {/* Blockchain Evidence/Message */}
                  {billResponse && (
                    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                      {billResponse.error && (
                        <div className="text-red-600 font-medium">{billResponse.error}</div>
                      )}
                      {billResponse.message && (
                        <div>
                          <div className="font-bold mb-1">{billResponse.message}</div>
                          {billResponse.blockchain && (
                            <div className="mt-2 p-2 rounded bg-gray-50 border border-blue-100 text-xs">
                              <div className="font-semibold text-blue-800">Blockchain Evidence</div>
                              <div>
                                Record Hash: <code className="break-all">{billResponse.blockchain.hash}</code>
                              </div>
                              <div>
                                Tx ID: <code className="break-all">{billResponse.blockchain.tx}</code>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <PharmacyFooter />
    </div>
  );
};

export default PrescriptionsPage;
