import React, { useState, useEffect } from "react";
import PharmacyHeader from "../../Components/PharmacyHeader";

const RestockAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [alertStatus, setAlertStatus] = useState("all_good");
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRestockAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/pharmacy/restock-alert?threshold=10&send_email=false`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch restock alerts");
      }
      const data = await response.json();
      setAlerts(data.medicines.all || []);
      setAlertStatus(data.alert_status);
      setRecommendations(data.recommendations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestockAlerts();
  }, []);

  const getAlertMessage = () => {
    switch (alertStatus) {
      case "all_good":
        return {
          color: "green",
          icon: "✅",
          message: "All medicines are adequately stocked.",
        };
      case "warning":
        return {
          color: "orange",
          icon: "⚠",
          message: "Some medicines are running low.",
        };
      case "critical":
        return {
          color: "red",
          icon: "🚨",
          message: "Critical stock levels detected!",
        };
      default:
        return { color: "gray", icon: "ℹ", message: "Unknown alert status." };
    }
  };

  const alertMessage = getAlertMessage();

  return (
    <div className="min-h-screen w-screen bg-green-50 flex flex-col font-sans">
      <header className="fixed top-0 left-0 right-0 z-50">
        <PharmacyHeader />
      </header>

      <main className="flex-grow pt-[72px] p-16 max-w-8xl mx-auto bg-white rounded-3xl shadow-lg mb-12">
        <h1 className="text-6xl font-bold mb-10 text-green-700 border-b pb-6">
          Restock Alerts
        </h1>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <>
            <div
              className={`text-${alertMessage.color}-700 text-2xl mb-6 flex items-center`}
            >
              <span className="mr-2 text-3xl">{alertMessage.icon}</span>
              {alertMessage.message}
            </div>

            {alerts.length === 0 ? (
              <p className="text-gray-700 text-2xl">
                No restock alerts. Inventory is well stocked.
              </p>
            ) : (
              <table className="w-full border border-gray-300 rounded-lg text-gray-800 text-xl">
                <thead>
                  <tr className="bg-green-100 text-black">
                    <th className="border border-gray-300 px-12 py-8 text-left font-semibold">
                      Medicine
                    </th>
                    <th className="border border-gray-300 px-12 py-8 text-left font-semibold">
                      Current Stock
                    </th>
                    <th className="border border-gray-300 px-12 py-8 text-left font-semibold">
                      Threshold
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert, idx) => (
                    <tr
                      key={idx}
                      className={
                        idx % 2 === 0 ? "bg-white" : "bg-green-50"
                      }
                    >
                      <td className="border border-gray-300 px-12 py-8 font-semibold">
                        {alert.medicine_name}
                      </td>
                      <td className="border border-gray-300 px-12 py-8">
                        {alert.quantity}
                      </td>
                      <td className="border border-gray-300 px-12 py-8">10</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {recommendations.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-green-700 mb-4">
                  Recommendations
                </h2>
                <ul className="list-disc pl-6 text-gray-800 text-lg">
                  {recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default RestockAlerts;
