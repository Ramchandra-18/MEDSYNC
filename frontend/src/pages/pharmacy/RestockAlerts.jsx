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
      setAlerts(data.medicines?.all || []);
      setAlertStatus(data.alert_status || "all_good");
      setRecommendations(data.recommendations || []);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestockAlerts();
  }, []);

  const getAlertConfig = () => {
    switch (alertStatus) {
      case "all_good":
        return {
          badgeBg: "bg-emerald-50",
          badgeBorder: "border-emerald-100",
          badgeText: "text-emerald-700",
          dot: "bg-emerald-500",
          label: "All good",
          message: "All medicines are adequately stocked.",
        };
      case "warning":
        return {
          badgeBg: "bg-amber-50",
          badgeBorder: "border-amber-100",
          badgeText: "text-amber-700",
          dot: "bg-amber-500",
          label: "Warning",
          message: "Some medicines are running low.",
        };
      case "critical":
        return {
          badgeBg: "bg-rose-50",
          badgeBorder: "border-rose-100",
          badgeText: "text-rose-700",
          dot: "bg-rose-500",
          label: "Critical",
          message: "Critical stock levels detected. Restock immediately.",
        };
      default:
        return {
          badgeBg: "bg-slate-50",
          badgeBorder: "border-slate-200",
          badgeText: "text-slate-700",
          dot: "bg-slate-400",
          label: "Status",
          message: "Unknown alert status.",
        };
    }
  };

  const alertCfg = getAlertConfig();

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50 text-slate-900">
      {/* background blobs */}
      <div className="pointer-events-none fixed inset-0 opacity-60 mix-blend-multiply">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-sky-200 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-emerald-200 blur-3xl" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-40">
        <PharmacyHeader />
      </header>

      <main className="relative z-10 pt-24 pb-12 px-3 md:px-8 flex justify-center">
        <div className="w-full max-w-6xl rounded-3xl bg-white/80 backdrop-blur-xl border border-white/70 shadow-[0_16px_50px_rgba(15,23,42,0.10)] p-6 md:p-8">
          {/* Title + status */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-600">
                Inventory safety
              </p>
              <h1 className="mt-1 text-2xl md:text-3xl font-semibold text-slate-900">
                Restock Alerts
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Monitor low-stock medicines and act before stockouts impact patient care.
              </p>
            </div>

            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium ${alertCfg.badgeBg} ${alertCfg.badgeBorder} ${alertCfg.badgeText}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${alertCfg.dot} animate-pulse`}
              />
              <span className="uppercase tracking-[0.18em]">
                {alertCfg.label}
              </span>
            </div>
          </div>

          {/* Alert banner */}
          {!loading && !error && (
            <div
              className={`mb-5 rounded-2xl border px-4 py-3 text-sm flex items-start gap-3 ${
                alertStatus === "all_good"
                  ? "bg-emerald-50/80 border-emerald-100 text-emerald-700"
                  : alertStatus === "warning"
                  ? "bg-amber-50/80 border-amber-100 text-amber-700"
                  : alertStatus === "critical"
                  ? "bg-rose-50/80 border-rose-100 text-rose-700"
                  : "bg-slate-50/80 border-slate-200 text-slate-700"
              }`}
            >
              <span className="mt-0.5 text-base">
                {alertStatus === "all_good"
                  ? "✅"
                  : alertStatus === "warning"
                  ? "⚠️"
                  : alertStatus === "critical"
                  ? "🚨"
                  : "ℹ️"}
              </span>
              <p className="text-sm">{alertCfg.message}</p>
            </div>
          )}

          {/* Content state */}
          {loading ? (
            <div className="flex justify-center py-10 text-sm text-slate-500">
              Loading alerts...
            </div>
          ) : error ? (
            <div className="py-4 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4">
              {error}
            </div>
          ) : (
            <>
              {/* Alerts table or empty */}
              {alerts.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-500">
                  No restock alerts. Inventory is well stocked.
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
                            Current stock
                          </th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-[0.16em]">
                            Threshold
                          </th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-[0.16em]">
                            Priority
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {alerts.map((alert, idx) => {
                          const qty = alert.quantity ?? 0;
                          const threshold = 10;
                          const ratio = qty / threshold;

                          let pillClasses =
                            "bg-emerald-50 text-emerald-600 border-emerald-100";
                          let pillLabel = "Healthy";

                          if (ratio <= 0.3) {
                            pillClasses =
                              "bg-rose-50 text-rose-600 border-rose-100";
                            pillLabel = "Critical";
                          } else if (ratio <= 0.7) {
                            pillClasses =
                              "bg-amber-50 text-amber-600 border-amber-100";
                            pillLabel = "Low";
                          }

                          return (
                            <tr
                              key={idx}
                              className="hover:bg-white transition-colors"
                            >
                              <td className="px-5 py-3 text-slate-900">
                                <span className="font-medium">
                                  {alert.medicine_name}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-slate-800">
                                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-slate-50 border border-slate-100 text-slate-700">
                                  {qty} units
                                </span>
                              </td>
                              <td className="px-5 py-3 text-slate-800">
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-slate-50 border border-slate-100 text-slate-600">
                                  {threshold}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-slate-800">
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${pillClasses}`}
                                >
                                  {pillLabel}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <section className="mt-8">
                  <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-[0.18em] mb-3">
                    Recommendations
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl bg-white/80 border border-slate-100 shadow-sm px-4 py-3 text-sm text-slate-700"
                      >
                        • {rec}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default RestockAlerts;
