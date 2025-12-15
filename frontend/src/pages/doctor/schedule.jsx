import React, { useMemo, useState, useEffect, useRef } from "react";
import { FaLock, FaUnlockAlt, FaCalendarAlt, FaSearch, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { decodeJwt } from "../../utils/jwt";

// Config
const DEFAULT_TZ = "Asia/Kolkata";
const REQUEST_TIMEOUT_MS = 12000;
const RETRY_COUNT = 1;
const WORK_START_HOUR = 9;
const WORK_END_HOUR = 17;
const SLOT_MINUTES = 30;

// Build base API URL
const getApiUrl = (path) => {
  const base = import.meta.env.VITE_API_BASE?.trim() || "http://10.164.147.186:5000";
  if (!base) return path.startsWith("/") ? path : `/${path}`;
  const left = base.endsWith("/") ? base.slice(0, -1) : base;
  const right = path.startsWith("/") ? path : `/${path}`;
  return `${left}${right}`;
};

const SCHEDULE_ENDPOINT = "/api/doctor/schedule";

// Helpers
const pad2 = (n) => String(n).padStart(2, "0");
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const sameDateKey = (a, b) =>
  a.toLocaleDateString("en-CA", { timeZone: DEFAULT_TZ }) ===
  b.toLocaleDateString("en-CA", { timeZone: DEFAULT_TZ });

const buildDaySlots = (day) => {
  const dayLocal = startOfDay(day);
  const slots = [];
  const start = new Date(dayLocal); start.setHours(WORK_START_HOUR, 0, 0, 0);
  const end = new Date(dayLocal);   end.setHours(WORK_END_HOUR, 0, 0, 0);
  for (let cur = new Date(start); cur < end; cur = new Date(cur.getTime() + SLOT_MINUTES * 60000)) {
    const y = cur.getFullYear();
    const m = pad2(cur.getMonth() + 1);
    const d = pad2(cur.getDate());
    const hh = pad2(cur.getHours());
    const mm = pad2(cur.getMinutes());
    slots.push(`${y}-${m}-${d}T${hh}:${mm}`);
  }
  return slots;
};

const toDisplay = (iso, locale = "en-IN", tz = DEFAULT_TZ) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString(locale, { weekday: "short", day: "2-digit", month: "short", timeZone: tz });
  const time = d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: tz });
  const dateKey = d.toLocaleDateString("en-CA", { timeZone: tz });
  return { date, time, dateKey };
};

const formatToSlot = (dtString) => {
  try {
    const candidate = dtString.includes("T") ? dtString : dtString.replace(" ", "T");
    const d = new Date(candidate);
    if (isNaN(d.getTime())) throw new Error("Invalid date");
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  } catch {
    return dtString.replace(/(:\d{2})$/, "");
  }
};

// UPDATED: This now always returns "YYYY-MM-DD HH:MM:SS"
const slotToServerFormat = (slot) => {
  if (!slot) return slot;
  const m = slot.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (m) {
    // Format ISO string to SQL datetime
    return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:00`;
  }
  // fallback: as Date
  const d = new Date(slot);
  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
  }
  return slot;
};

const fetchWithControl = async (input, init = {}, retries = RETRY_COUNT) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (err) {
    if (retries > 0) return fetchWithControl(input, init, retries - 1);
    throw err;
  } finally {
    clearTimeout(id);
  }
};

// --- JWT claims extraction: match backend flexible logic (role, user_id) ---
const extractClaims = (token) => {
  try {
    const c = decodeJwt(token) || {};
    const role = c.role || c.user_role || c["https://schemas/role"];
    // Flexible extraction for user_id
    const user_id = c.user_id || c.userId || c.sub ||
      (c.user && typeof c.user === "object" ? (c.user.userId || c.user.id) : undefined);
    return { role, user_id, raw: c };
  } catch {
    return { role: undefined, user_id: undefined, raw: undefined };
  }
};

export default function DoctorSchedule() {
  const [doctor, setDoctor] = useState({ name: "My Schedule", avatar: "https://ui-avatars.com/api/?name=D" });
  const [query, setQuery] = useState("");
  const [showAvailable, setShowAvailable] = useState(true);
  const [showBlocked, setShowBlocked] = useState(true);
  const [loadingApi, setLoadingApi] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const [selectedDay, setSelectedDay] = useState(startOfDay(new Date()));
  const visibleSlots = useMemo(() => buildDaySlots(selectedDay), [selectedDay]);

  const [blockedSlots, setBlockedSlots] = useState([]);

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const isBlocked = (slot) => blockedSlots.includes(slot);

  const readErrorMessage = async (res) => {
    try {
      const data = await res.json();
      return data?.message || JSON.stringify(data);
    } catch {
      try { return await res.text(); } catch { return `${res.status} ${res.statusText}`; }
    }
  };

  const fetchSchedule = async () => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setStatusMessage({ type: "error", text: "Authorization token missing. Please login." });
      return;
    }
    const { role, user_id, raw } = extractClaims(token);
    const roleLower = role ? String(role).toLowerCase() : null;
    if (!role || !user_id) console.warn("JWT claims incomplete (role/user_id). Proceeding; server will enforce auth.");
    if (raw?.full_name || raw?.name) setDoctor((d) => ({ ...d, name: raw.full_name || raw.name }));

    setLoadingApi(true);
    setStatusMessage(null);
    try {
      const url = getApiUrl(SCHEDULE_ENDPOINT);
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
      const res = await fetchWithControl(url, { headers });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("jwtToken");
          setStatusMessage({ type: "error", text: "Unauthorized - please login." });
          window.location.href = "/login";
          return;
        }
        if (res.status === 403) {
          setStatusMessage({ type: "error", text: "Forbidden - doctor role required." });
          return;
        }
        const msg = await readErrorMessage(res);
        throw new Error(msg || "Failed to fetch schedule");
      }
      const data = await res.json();
      const blocked = (data.schedule || [])
        .filter((s) => s.is_available === false || s.is_available === "false")
        .map((s) => formatToSlot(s.slot_datetime));
      if (!mountedRef.current) return;
      setBlockedSlots(Array.from(new Set(blocked)));
      if (data.doctor_name) setDoctor((d) => ({ ...d, name: data.doctor_name }));
    } catch (err) {
      if (!mountedRef.current) return;
      const reason = err.name === "AbortError" ? "Request timed out" : err.message;
      setStatusMessage({ type: "error", text: `Network/Fetch error: ${reason}` });
    } finally {
      if (mountedRef.current) setLoadingApi(false);
    }
  };

  useEffect(() => { fetchSchedule(); }, []);

  const postAction = async (body) => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setStatusMessage({ type: "error", text: "Authorization token missing. Please login." });
      return;
    }
    const { role, user_id, raw } = extractClaims(token);
    if (!role || !user_id) console.warn("JWT decode failed or claims missing; proceeding.");
    if (raw?.full_name || raw?.name) setDoctor((d) => ({ ...d, name: raw.full_name || raw.name }));

    setLoadingApi(true);
    setStatusMessage(null);
    try {
      const url = getApiUrl(SCHEDULE_ENDPOINT);
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
      const res = await fetchWithControl(url, { method: "POST", headers, body: JSON.stringify(body) });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("jwtToken");
          setStatusMessage({ type: "error", text: "Unauthorized - please login again." });
          window.location.href = "/login";
          return;
        }
        if (res.status === 403) {
          setStatusMessage({ type: "error", text: "Forbidden - doctor role required." });
          return;
        }
        const msg = await readErrorMessage(res);
        throw new Error(msg || "Failed to perform action");
      }
      await fetchSchedule();
      const label = body.action?.replace("_", " ");
      setStatusMessage({ type: "success", text: `Action ${label} completed` });
    } catch (err) {
      const reason = err.name === "AbortError" ? "Request timed out" : err.message;
      setStatusMessage({ type: "error", text: reason });
    } finally {
      setLoadingApi(false);
    }
  };

  const toggleSlot = async (slot) => {
    const blockedNow = isBlocked(slot);
    const action = blockedNow ? "unblock_slot" : "block_slot";
    const payloadSlot = slotToServerFormat(slot);
    await postAction({ action, slot: payloadSlot });
  };

  const blockAllForDay = () => {
    const dayKey = selectedDay.toLocaleDateString("en-CA", { timeZone: DEFAULT_TZ });
    postAction({ action: "block_day", day: dayKey });
  };
  const unblockAllForDay = () => {
    const dayKey = selectedDay.toLocaleDateString("en-CA", { timeZone: DEFAULT_TZ });
    postAction({ action: "unblock_day", day: dayKey });
  };
  const blockAll = () => postAction({ action: "block_all" });
  const unblockAll = () => postAction({ action: "unblock_all" });

  const filteredSlots = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visibleSlots.filter((slot) => {
      const { time } = toDisplay(slot, "en-IN", DEFAULT_TZ);
      const blocked = isBlocked(slot);
      const statusOk = (blocked && showBlocked) || (!blocked && showAvailable);
      const queryOk = !q || time.toLowerCase().includes(q);
      return statusOk && queryOk;
    });
  }, [visibleSlots, query, showAvailable, showBlocked, blockedSlots]);

  const total = visibleSlots.length;
  const blockedCount = visibleSlots.filter(isBlocked).length;
  const availableCount = total - blockedCount;

  const goPrevDay = () => setSelectedDay((d) => addDays(d, -1));
  const goNextDay = () => setSelectedDay((d) => addDays(d, +1));
  const changeByInput = (e) => {
    const val = e.target.value;
    if (!val) return;
    const [yy, mm, dd] = val.split("-").map((x) => Number(x));
    const dt = new Date(yy, mm - 1, dd, 0, 0, 0, 0);
    setSelectedDay(startOfDay(dt));
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="w-full max-w-7xl mx-auto py-10 px-6">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Sidebar */}
            <aside className="lg:col-span-4 xl:col-span-3 bg-blue-700 text-white p-8">
              <div className="flex flex-col items-center text-center">
                <img src={doctor.avatar} alt={doctor.name} className="w-24 h-24 rounded-full border-4 border-white shadow-lg" />
                <h2 className="text-2xl font-extrabold mt-4">{doctor.name}</h2>
                <p className="mt-1 text-blue-200 uppercase tracking-widest font-semibold">Manage Schedule</p>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-3">
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-xs text-blue-200">Total</p>
                  <p className="text-lg font-bold">{total}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-xs text-blue-200">Available</p>
                  <p className="text-lg font-bold">{availableCount}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-xs text-blue-200">Blocked</p>
                  <p className="text-lg font-bold">{blockedCount}</p>
                </div>
              </div>
              <div className="mt-8 flex flex-col gap-3">
                <button disabled={loadingApi} onClick={unblockAll} className="w-full py-2 rounded-lg bg-white text-blue-700 font-semibold hover:bg-blue-50 flex items-center justify-center gap-2 disabled:opacity-50">
                  <FaUnlockAlt /> Unblock All
                </button>
                <button disabled={loadingApi} onClick={blockAll} className="w-full py-2 rounded-lg bg-blue-900 font-semibold hover:bg-blue-800 flex items-center justify-center gap-2 disabled:opacity-50">
                  <FaLock /> Block All
                </button>
              </div>
            </aside>
            <main className="lg:col-span-8 xl:col-span-9 p-8">
              <div className="flex items-center justify-between border-b pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <FaCalendarAlt className="text-blue-600" />
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Select Time Slots</h1>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={goPrevDay} className="px-3 py-2 rounded border hover:bg-gray-50">Prev</button>
                  <input type="date"
                         value={startOfDay(selectedDay).toLocaleDateString("en-CA")}
                         onChange={changeByInput}
                         className="px-3 py-2 rounded border" />
                  <button onClick={goNextDay} className="px-3 py-2 rounded border hover:bg-gray-50">Next</button>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-6">
                <button disabled={loadingApi} onClick={unblockAllForDay} className="px-4 py-2 rounded-lg bg-green-100 text-green-800 font-semibold hover:bg-green-200 flex items-center gap-2 disabled:opacity-50">
                  <FaUnlockAlt /> Unblock Day
                </button>
                <button disabled={loadingApi} onClick={blockAllForDay} className="px-4 py-2 rounded-lg bg-red-100 text-red-800 font-semibold hover:bg-red-200 flex items-center gap-2 disabled:opacity-50">
                  <FaLock /> Block Day
                </button>
                <div className="ml-auto flex items-center gap-2">
                  <div className="relative w-64 max-w-full">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search time e.g. 10:00"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <button
                    onClick={() => setShowAvailable((v) => !v)}
                    className={`px-3 py-1.5 rounded-full border flex items-center gap-2 ${showAvailable ? "bg-green-50 border-green-300" : "bg-white"}`}
                    aria-pressed={showAvailable}
                  >
                    <FaCheckCircle className="text-green-600" /> Available
                  </button>
                  <button
                    onClick={() => setShowBlocked((v) => !v)}
                    className={`px-3 py-1.5 rounded-full border flex items-center gap-2 ${showBlocked ? "bg-rose-50 border-rose-300" : "bg-white"}`}
                    aria-pressed={showBlocked}
                  >
                    <FaTimesCircle className="text-rose-600" /> Blocked
                  </button>
                </div>
              </div>
              {statusMessage && (
                <div className={`mb-4 p-3 rounded ${statusMessage.type === "error" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                  {statusMessage.text}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSlots.map((slot) => {
                  const blocked = isBlocked(slot);
                  const { date, time } = toDisplay(slot, "en-IN", DEFAULT_TZ);
                  return (
                    <div key={slot} className={`relative flex flex-col rounded-xl p-6 shadow-md transition-transform transform hover:scale-[1.01] border ${blocked ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-sm text-gray-500 block">{date}</span>
                          <span className="text-lg font-semibold text-gray-900">{time}</span>
                        </div>
                        {blocked ? <FaLock className="text-red-600 w-6 h-6" title="Blocked" /> : <FaUnlockAlt className="text-green-600 w-6 h-6" title="Available" />}
                      </div>
                      <button
                        disabled={loadingApi}
                        onClick={() => toggleSlot(slot)}
                        className={`mt-auto py-2 rounded-full font-semibold text-white shadow-lg transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-50 ${
                          blocked ? "bg-red-600 hover:bg-red-700 focus:ring-red-300" : "bg-green-600 hover:bg-green-700 focus:ring-green-300"
                        } disabled:opacity-50`}
                        aria-pressed={blocked}
                        aria-label={`${blocked ? "Unblock" : "Block"} slot at ${time}`}
                      >
                        {blocked ? "Unblock Slot" : "Block Slot"}
                      </button>
                    </div>
                  );
                })}
              </div>
              {filteredSlots.length === 0 && <div className="text-center text-gray-500 py-12">No slots match your filters.</div>}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
