import React, { useEffect, useState } from "react";
import PharmacyHeader from "../../Components/PharmacyHeader";
import PharmacyFooter from "../../Components/PharmacyFooter";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const PrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total_count: 0,
    total_pages: 1,
  });
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    sort_by: "created_at",
    sort_order: "desc",
    patient_email: "",
    patient_name: "",
    doctor_name: "",
    doctor_code: "",
    department: "",
    disease: "",
    prescription_date: "",
    date_from: "",
    date_to: "",
  });

  // Modal State
  const [viewPrescription, setViewPrescription] = useState(null);
  const [showBillForm, setShowBillForm] = useState(false);
  const [billInputs, setBillInputs] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [sendLoading, setSendLoading] = useState(false);
  const [sendBillLoading, setSendBillLoading] = useState(false);
  const [billResponse, setBillResponse] = useState(null);

  // Fetch prescriptions
  const fetchPrescriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = Object.entries(filters)
        .filter(([_, v]) => v && v !== "")
        .map(
          ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
        )
        .join("&");
      const url = `${API_BASE}/api/pharmacy/prescriptions${
        params ? "?" + params : ""
      }`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.message || data?.error || "Failed to fetch prescriptions"
        );
      setPrescriptions(Array.isArray(data.prescriptions) ? data.prescriptions : []);
      setPagination(
        data.pagination || {
          page: 1,
          limit: 10,
          total_count: 0,
          total_pages: 1,
        }
      );
    } catch (e) {
      setError(e.message || "Network error");
      setPrescriptions([]);
      setPagination({
        page: 1,
        limit: 10,
        total_count: 0,
        total_pages: 1,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [filters]);

  const gotoPage = (p) =>
    setFilters((f) => ({
      ...f,
      page: p,
    }));

  // Bill helpers
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
              [field]:
                field === "quantity" || field === "rate"
                  ? Number(value)
                  : value,
              amount:
                field === "quantity" || field === "rate"
                  ? (field === "quantity" ? Number(value) : item.quantity) *
                    (field === "rate" ? Number(value) : item.rate)
                  : item.quantity * item.rate,
            }
          : item
      )
    );
  };

  useEffect(() => {
    setTotalAmount(
      billInputs.reduce((sum, item) => sum + (item.amount || 0), 0)
    );
  }, [billInputs]);

  // Send prescription PDF
  const handleSendPrescription = async () => {
    if (!viewPrescription?.id) return;
    setSendLoading(true);
    try {
      const url = `${API_BASE}/api/pharmacy/prescriptions/${viewPrescription.id}/send_pdf`;
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || data?.message || "Failed to send PDF");
      alert(data.message || "Prescription PDF sent to patient's email.");
    } catch (e) {
      alert("Failed to send prescription PDF: " + e.message);
    } finally {
      setSendLoading(false);
    }
  };

  // Build bill payload
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
      items: billInputs.map((b) => ({
        code: b.code,
        particular: b.particular,
        rate: Number(b.rate),
        unit: Number(b.quantity),
        amount: Number(b.amount),
      })),
    };
  }

  // Submit bill
  const handleBillSubmit = async () => {
    if (!viewPrescription?.id) return;
    setSendBillLoading(true);
    setBillResponse(null);
    try {
      const billData = buildBillDataFromInputs(
        viewPrescription,
        billInputs,
        totalAmount
      );
      const url = `${API_BASE}/api/pharmacy/prescriptions/${viewPrescription.id}/send_pdf_bill`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billData),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.error || data?.message || "Failed to send PDF/bill"
        );
      setBillResponse(data);
    } catch (e) {
      setBillResponse({ error: e.message });
    } finally {
      setSendBillLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50 text-slate-900">
      {/* background blobs */}
      <div className="pointer-events-none fixed inset-0 opacity-60 mix-blend-multiply">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-sky-200 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-emerald-200 blur-3xl" />
      </div>

      <div className="fixed top-0 left-0 right-0 z-40">
        <PharmacyHeader />
      </div>

      <main className="relative z-10 pt-24 pb-10 px-3 md:px-8 flex justify-center">
        <div className="w-full max-w-6xl rounded-3xl bg-white/80 backdrop-blur-xl border border-white/70 shadow-[0_16px_50px_rgba(15,23,42,0.10)] p-6 md:p-8">
          {/* Header row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-sky-600">
                Digital prescriptions
              </p>
              <h1 className="mt-1 text-2xl md:text-3xl font-semibold text-slate-900">
                Prescription List
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                View, send, and bill blockchain-backed prescriptions directly from MedSync.
              </p>
            </div>
            <div className="text-xs text-slate-500">
              Page {pagination.page} of {pagination.total_pages} ·{" "}
              {pagination.total_count} records
            </div>
          </div>

          {/* Content state */}
          {loading && (
            <div className="py-6 text-center text-sm text-slate-500">
              Loading prescriptions...
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* Table */}
          {!loading && !error && (
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/80 mb-5">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100/80">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-[0.16em]">
                        SL
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-[0.16em]">
                        Patient
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-[0.16em]">
                        Doctor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-[0.16em]">
                        Disease
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-[0.16em]">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-[0.16em]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {prescriptions.map((p, idx) => (
                      <tr
                        key={p.id || idx}
                        className="hover:bg-white transition-colors"
                      >
                        <td className="px-4 py-3 text-slate-700">
                          {((pagination.page || 1) - 1) *
                            (filters.limit || 10) +
                            idx +
                            1}
                        </td>
                        <td className="px-4 py-3 text-slate-900">
                          <div className="font-medium">
                            {p.patient_name || "(Unknown)"}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {p.patient_email || ""}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-900">
                          <div className="font-medium">
                            {p.doctor_name || "-"}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {p.doctor_code || ""}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-800">
                          {p.disease || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-800">
                          <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                            {p.prescription_date || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-800">
                          <button
                            className="inline-flex items-center rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white px-3 py-1.5 text-xs font-medium shadow-sm hover:brightness-110"
                            onClick={() => {
                              setViewPrescription(p);
                              setShowBillForm(false);
                              setBillResponse(null);
                            }}
                            type="button"
                          >
                            View details
                          </button>
                        </td>
                      </tr>
                    ))}
                    {prescriptions.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-6 text-center text-sm text-slate-500"
                        >
                          No prescriptions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <button
                disabled={filters.page === 1}
                onClick={() => gotoPage(filters.page - 1)}
                className={`px-2 py-1 rounded border ${
                  filters.page === 1
                    ? "border-slate-100 text-slate-300 cursor-not-allowed"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                &lt;
              </button>
              {[...Array(pagination.total_pages).keys()].map((i) => (
                <button
                  key={i + 1}
                  onClick={() => gotoPage(i + 1)}
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    filters.page === i + 1
                      ? "bg-sky-500 text-white"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={filters.page === pagination.total_pages}
                onClick={() => gotoPage(filters.page + 1)}
                className={`px-2 py-1 rounded border ${
                  filters.page === pagination.total_pages
                    ? "border-slate-100 text-slate-300 cursor-not-allowed"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </main>

      <PharmacyFooter />

      {/* Modal */}
      {viewPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-3">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-white/70 p-6 md:p-7 text-slate-900">
            <button
              className="absolute right-3 top-2 text-2xl text-slate-400 hover:text-rose-500"
              onClick={() => {
                setViewPrescription(null);
                setShowBillForm(false);
                setBillResponse(null);
              }}
            >
              ×
            </button>

            <h2 className="text-xl md:text-2xl font-semibold mb-4">
              Prescription Details
            </h2>

            {/* Patient & doctor info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-[0.16em] mb-1">
                  Patient
                </h3>
                <p className="font-medium text-slate-900">
                  {viewPrescription.patient_name}{" "}
                  <span className="text-xs text-slate-500">
                    ({viewPrescription.patient_gender},{" "}
                    {viewPrescription.patient_age})
                  </span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {viewPrescription.patient_email}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-[0.16em] mb-1">
                  Doctor
                </h3>
                <p className="font-medium text-slate-900">
                  {viewPrescription.doctor_name}{" "}
                  <span className="text-xs text-slate-500">
                    ({viewPrescription.doctor_code})
                  </span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {viewPrescription.doctor_department}
                </p>
              </div>
            </div>

            <div className="text-sm mb-3">
              <div className="mb-1">
                <span className="font-semibold">Disease: </span>
                <span className="text-slate-800">
                  {viewPrescription.disease}
                </span>
              </div>
              <div>
                <span className="font-semibold">Date: </span>
                <span className="text-slate-800">
                  {viewPrescription.prescription_date}{" "}
                  {viewPrescription.prescription_time}
                </span>
              </div>
            </div>

            <div className="mt-3 mb-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-[0.16em] mb-2">
                Medicines
              </h3>
              <ul className="ml-5 list-decimal text-sm space-y-1">
                {Array.isArray(viewPrescription.medicines) &&
                  viewPrescription.medicines.map((m, i) => (
                    <li key={i}>
                      <span className="font-medium text-slate-900">
                        {m.medication}
                      </span>{" "}
                      <span className="text-slate-600">
                        — {m.dosage}, {m.frequency}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="inline-flex items-center rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 text-white px-4 py-2 text-xs font-semibold shadow-sm hover:brightness-110"
                onClick={handleSendPrescription}
                disabled={sendLoading}
              >
                {sendLoading ? "Sending..." : "Send Prescription"}
              </button>
              <button
                className="inline-flex items-center rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-500 text-white px-4 py-2 text-xs font-semibold shadow-sm hover:brightness-110"
                onClick={() => handleOpenBillForm(viewPrescription)}
              >
                Generate Bill
              </button>
            </div>

            {/* Bill form */}
            {showBillForm && (
              <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  Generate Bill
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleBillSubmit();
                  }}
                  className="space-y-3 text-xs md:text-sm"
                >
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="text-slate-500">
                          <th className="px-2 py-1 text-left">S. No.</th>
                          <th className="px-2 py-1 text-left">Item</th>
                          <th className="px-2 py-1 text-left">Qty</th>
                          <th className="px-2 py-1 text-left">Rate</th>
                          <th className="px-2 py-1 text-left">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billInputs.map((item, i) => (
                          <tr key={i}>
                            <td className="px-2 py-1">{item.sNo}</td>
                            <td className="px-2 py-1">{item.particular}</td>
                            <td className="px-2 py-1">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleBillItemChange(
                                    i,
                                    "quantity",
                                    e.target.value
                                  )
                                }
                                className="w-14 rounded-lg border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="number"
                                min="0"
                                value={item.rate}
                                onChange={(e) =>
                                  handleBillItemChange(
                                    i,
                                    "rate",
                                    e.target.value
                                  )
                                }
                                className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
                              />
                            </td>
                            <td className="px-2 py-1 text-slate-800">
                              ₹{item.amount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end text-sm font-semibold mt-2">
                    Total:{" "}
                    <span className="ml-2 text-sky-700">₹{totalAmount}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 via-sky-500 to-blue-700 text-white text-xs font-semibold shadow-sm hover:brightness-110"
                      disabled={sendBillLoading}
                    >
                      {sendBillLoading
                        ? "Sending Bill..."
                        : "Send Bill + PDF"}
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      onClick={() => setShowBillForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>

                {/* Blockchain / API response */}
                {billResponse && (
                  <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs text-slate-800">
                    {billResponse.error && (
                      <div className="text-rose-600 font-medium mb-1">
                        {billResponse.error}
                      </div>
                    )}
                    {billResponse.message && (
                      <>
                        <div className="font-semibold mb-1">
                          {billResponse.message}
                        </div>
                        {billResponse.blockchain && (
                          <div className="mt-2 rounded-lg bg-white/80 border border-slate-100 p-2">
                            <div className="font-semibold text-slate-800 mb-1">
                              Blockchain Evidence
                            </div>
                            <div className="break-all">
                              <span className="font-medium">Hash: </span>
                              <code>{billResponse.blockchain.hash}</code>
                            </div>
                            <div className="break-all">
                              <span className="font-medium">Tx ID: </span>
                              <code>{billResponse.blockchain.tx}</code>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionsPage;
