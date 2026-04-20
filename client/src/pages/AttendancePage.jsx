import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const pad = (n) => String(n).padStart(2, "0");

const formatDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString();
};

const formatDuration = (mins = 0) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

export default function AttendancePage() {
  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAttendance = async () => {
    const [todayRes, historyRes] = await Promise.all([
      api.get("/attendance/today"),
      api.get("/attendance/my?limit=14"),
    ]);
    setToday(todayRes.data || null);
    setHistory(historyRes.data || []);
  };

  useEffect(() => {
    const run = async () => {
      try {
        await fetchAttendance();
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load attendance");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const activeSessionMinutes = useMemo(() => {
    if (!today?.clockInAt || today?.clockOutAt) return 0;
    return Math.max(0, Math.floor((now - new Date(today.clockInAt)) / 60000));
  }, [now, today]);

  const isClockedIn = !!today?.clockInAt && !today?.clockOutAt;
  const isCompletedToday = !!today?.clockInAt && !!today?.clockOutAt;

  const handleClockIn = async () => {
    setSaving(true);
    setError("");
    try {
      await api.post("/attendance/clock-in");
      await fetchAttendance();
    } catch (err) {
      setError(err.response?.data?.message || "Clock-in failed");
    } finally {
      setSaving(false);
    }
  };

  const handleClockOut = async () => {
    setSaving(true);
    setError("");
    try {
      await api.post("/attendance/clock-out");
      await fetchAttendance();
    } catch (err) {
      setError(err.response?.data?.message || "Clock-out failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="page"><div className="loading-center"><span className="spinner lg" /></div></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Attendance</h1>
          <p className="text-muted">Mark login/logout and track your working time</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 14 }}>
          {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <Metric title="Current Time" value={`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`} />
            <Metric title="Login Time" value={today?.clockInAt ? new Date(today.clockInAt).toLocaleTimeString() : "Not marked"} />
            <Metric title="Logout Time" value={today?.clockOutAt ? new Date(today.clockOutAt).toLocaleTimeString() : "Not marked"} />
            <Metric
              title="Worked Today"
              value={
                isClockedIn
                  ? formatDuration(activeSessionMinutes)
                  : (today?.totalMinutes ? formatDuration(today.totalMinutes) : "0h 0m")
              }
            />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
            <button
              className="btn btn-primary"
              onClick={handleClockIn}
              disabled={saving || isClockedIn || isCompletedToday}
            >
              {saving ? "Saving..." : "Login / Clock In"}
            </button>
            <button
              className="btn btn-ghost"
              onClick={handleClockOut}
              disabled={saving || !isClockedIn}
            >
              {saving ? "Saving..." : "Logout / Clock Out"}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Recent Attendance</h3>
          <span className="card-header-meta">{history.length} record{history.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="card-body" style={{ paddingTop: 8 }}>
          {history.length === 0 ? (
            <p className="empty-msg" style={{ padding: "16px 0" }}>No attendance marked yet</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                    <th style={{ padding: "10px 8px" }}>Date</th>
                    <th style={{ padding: "10px 8px" }}>Login</th>
                    <th style={{ padding: "10px 8px" }}>Logout</th>
                    <th style={{ padding: "10px 8px" }}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row._id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                        {new Date(row.clockInAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>{formatDateTime(row.clockInAt)}</td>
                      <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>{formatDateTime(row.clockOutAt)}</td>
                      <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                        {row.clockOutAt ? formatDuration(row.totalMinutes) : "In progress"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ title, value }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14, background: "var(--bg2)" }}>
      <p style={{ margin: 0, fontSize: 12, color: "var(--text-3)" }}>{title}</p>
      <p style={{ margin: "6px 0 0", fontSize: 20, fontWeight: 700, color: "var(--text)" }}>{value}</p>
    </div>
  );
}

