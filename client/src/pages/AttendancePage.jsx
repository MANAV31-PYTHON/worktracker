import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const pad = (n) => String(n).padStart(2, "0");

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const formatDuration = (mins = 0) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

export default function AttendancePage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(new Date());

  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [employeeToday, setEmployeeToday] = useState(null);
  const [employeeHistory, setEmployeeHistory] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchMyAttendance = async () => {
    const [todayRes, historyRes] = await Promise.all([
      api.get("/attendance/today"),
      api.get("/attendance/my?limit=14"),
    ]);
    setToday(todayRes.data || null);
    setHistory(historyRes.data || []);
  };

  const fetchEmployees = async () => {
    if (!isSuperAdmin) return;
    const res = await api.get("/users");
    const onlyEmployees = (res.data || []).filter((u) => u.role === "EMPLOYEE");
    setEmployees(onlyEmployees);
    if (!selectedEmployeeId && onlyEmployees.length > 0) {
      setSelectedEmployeeId(onlyEmployees[0]._id);
    }
  };

  const fetchSelectedEmployeeAttendance = async (employeeId) => {
    if (!isSuperAdmin || !employeeId) return;
    const [todayRes, historyRes] = await Promise.all([
      api.get(`/attendance/employee/${employeeId}/today`),
      api.get(`/attendance/employee/${employeeId}/history?limit=14`),
    ]);
    setEmployeeToday(todayRes.data || null);
    setEmployeeHistory(historyRes.data || []);
  };

  useEffect(() => {
    const run = async () => {
      try {
        await fetchMyAttendance();
        await fetchEmployees();
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load attendance");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchSelectedEmployeeAttendance(selectedEmployeeId).catch((err) => {
      setError(err.response?.data?.message || "Unable to load employee attendance");
    });
  }, [selectedEmployeeId]);

  const activeSessionMinutes = useMemo(() => {
    if (!today?.clockInAt || today?.clockOutAt) return 0;
    return Math.max(0, Math.floor((now - new Date(today.clockInAt)) / 60000));
  }, [now, today]);

  const employeeActiveSessionMinutes = useMemo(() => {
    if (!employeeToday?.clockInAt || employeeToday?.clockOutAt) return 0;
    return Math.max(0, Math.floor((now - new Date(employeeToday.clockInAt)) / 60000));
  }, [now, employeeToday]);

  const isClockedIn = !!today?.clockInAt && !today?.clockOutAt;
  const isCompletedToday = !!today?.clockInAt && !!today?.clockOutAt;

  const employeeClockedIn = !!employeeToday?.clockInAt && !employeeToday?.clockOutAt;
  const employeeCompleted = !!employeeToday?.clockInAt && !!employeeToday?.clockOutAt;

  const handleClockIn = async () => {
    setSaving(true);
    setError("");
    try {
      await api.post("/attendance/clock-in");
      await fetchMyAttendance();
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
      await fetchMyAttendance();
    } catch (err) {
      setError(err.response?.data?.message || "Clock-out failed");
    } finally {
      setSaving(false);
    }
  };

  const handleEmployeeClockIn = async () => {
    if (!selectedEmployeeId) return;
    setSaving(true);
    setError("");
    try {
      await api.post(`/attendance/employee/${selectedEmployeeId}/clock-in`);
      await fetchSelectedEmployeeAttendance(selectedEmployeeId);
    } catch (err) {
      setError(err.response?.data?.message || "Employee clock-in failed");
    } finally {
      setSaving(false);
    }
  };

  const handleEmployeeClockOut = async () => {
    if (!selectedEmployeeId) return;
    setSaving(true);
    setError("");
    try {
      await api.post(`/attendance/employee/${selectedEmployeeId}/clock-out`);
      await fetchSelectedEmployeeAttendance(selectedEmployeeId);
    } catch (err) {
      setError(err.response?.data?.message || "Employee clock-out failed");
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
          <p className="text-muted">Mark login/logout and track working time</p>
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
            <Metric title="My Login" value={today?.clockInAt ? new Date(today.clockInAt).toLocaleTimeString() : "Not marked"} />
            <Metric title="My Logout" value={today?.clockOutAt ? new Date(today.clockOutAt).toLocaleTimeString() : "Not marked"} />
            <Metric
              title="My Worked Today"
              value={isClockedIn ? formatDuration(activeSessionMinutes) : (today?.totalMinutes ? formatDuration(today.totalMinutes) : "0h 0m")}
            />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={handleClockIn} disabled={saving || isClockedIn || isCompletedToday}>
              {saving ? "Saving..." : "Login / Clock In"}
            </button>
            <button className="btn btn-ghost" onClick={handleClockOut} disabled={saving || !isClockedIn}>
              {saving ? "Saving..." : "Logout / Clock Out"}
            </button>
          </div>
        </div>
      </div>

      {isSuperAdmin && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h3>Super Admin Employee Attendance</h3>
          </div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            <div className="form-group" style={{ maxWidth: 320, marginBottom: 14 }}>
              <label>Select Employee</label>
              <select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>{emp.name} ({emp.email})</option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              <Metric title="Employee Login" value={employeeToday?.clockInAt ? new Date(employeeToday.clockInAt).toLocaleTimeString() : "Not marked"} />
              <Metric title="Employee Logout" value={employeeToday?.clockOutAt ? new Date(employeeToday.clockOutAt).toLocaleTimeString() : "Not marked"} />
              <Metric
                title="Employee Worked"
                value={employeeClockedIn ? formatDuration(employeeActiveSessionMinutes) : (employeeToday?.totalMinutes ? formatDuration(employeeToday.totalMinutes) : "0h 0m")}
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              <button
                className="btn btn-primary"
                onClick={handleEmployeeClockIn}
                disabled={saving || !selectedEmployeeId || employeeClockedIn || employeeCompleted}
              >
                {saving ? "Saving..." : "Mark Employee Check-In"}
              </button>
              <button
                className="btn btn-ghost"
                onClick={handleEmployeeClockOut}
                disabled={saving || !selectedEmployeeId || !employeeClockedIn}
              >
                {saving ? "Saving..." : "Mark Employee Check-Out"}
              </button>
            </div>

            <div style={{ marginTop: 18 }}>
              <h4 style={{ marginBottom: 8 }}>Selected Employee History</h4>
              {employeeHistory.length === 0 ? (
                <p className="empty-msg" style={{ padding: "10px 0" }}>No attendance records found</p>
              ) : (
                <AttendanceTable rows={employeeHistory} />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>My Recent Attendance</h3>
          <span className="card-header-meta">{history.length} record{history.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="card-body" style={{ paddingTop: 8 }}>
          {history.length === 0 ? (
            <p className="empty-msg" style={{ padding: "16px 0" }}>No attendance marked yet</p>
          ) : (
            <AttendanceTable rows={history} />
          )}
        </div>
      </div>
    </div>
  );
}

function AttendanceTable({ rows }) {
  return (
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
          {rows.map((row) => (
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
