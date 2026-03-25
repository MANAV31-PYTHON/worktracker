import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useDialog } from "../components/Dialog";
import { UserPlus, Pencil, Trash2, ShieldCheck, UserCheck, UserX, Check, Building2, ChevronDown, X, Shield, User, Crown } from "lucide-react";

/* ─── Injected styles ─────────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

:root {
  --bg: #f4f6fb;
  --surface: #ffffff;
  --surface2: #f0f2f8;
  --border: rgba(0,0,0,0.08);
  --border-active: rgba(0,0,0,0.18);
  --text: #111827;
  --text-muted: #6b7280;
  --text-dim: #9ca3af;
  --accent: #4f72ff;
  --accent-soft: rgba(79,114,255,0.1);
  --accent-glow: rgba(79,114,255,0.25);
  --green: #16a34a;
  --green-soft: rgba(22,163,74,0.1);
  --red: #dc2626;
  --red-soft: rgba(220,38,38,0.08);
  --amber: #d97706;
  --amber-soft: rgba(217,119,6,0.1);
  --purple: #7c3aed;
  --purple-soft: rgba(124,58,237,0.1);
  --radius: 16px;
  --radius-sm: 10px;
  --radius-xs: 7px;
  --shadow: 0 2px 16px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05);
  --font: 'Sora', sans-serif;
  --mono: 'DM Mono', monospace;
  --transition: 0.22s cubic-bezier(0.4,0,0.2,1);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.up-root {
  font-family: var(--font);
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  padding: 0;
  -webkit-font-smoothing: antialiased;
}

/* ── Page shell ── */
.up-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px 80px;
  animation: up-fade-in 0.4s ease both;
}
@keyframes up-fade-in { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }

/* ── Header ── */
.up-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.up-header-left h1 {
  font-size: clamp(22px,5vw,30px);
  font-weight: 700;
  letter-spacing: -0.5px;
  line-height: 1.1;
}
.up-subtitle {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-size: 13px;
  color: var(--text-muted);
  font-family: var(--mono);
}
.up-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 8px var(--green);
  animation: up-pulse 2s ease infinite;
}
@keyframes up-pulse {
  0%,100% { box-shadow: 0 0 5px var(--green); }
  50% { box-shadow: 0 0 14px var(--green); }
}

/* ── Buttons ── */
.up-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font);
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  border-radius: var(--radius-xs);
  padding: 10px 16px;
  transition: var(--transition);
  white-space: nowrap;
}
.up-btn-primary {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 0 0 rgba(108,143,255,0);
}
.up-btn-primary:hover {
  background: #809fff;
  box-shadow: 0 4px 20px var(--accent-glow);
  transform: translateY(-1px);
}
.up-btn-primary:active { transform: translateY(0); }
.up-btn-ghost {
  background: var(--surface2);
  color: var(--text-muted);
  border: 1px solid var(--border);
}
.up-btn-ghost:hover { background: var(--border); color: var(--text); }
.up-btn-danger { background: var(--red-soft); color: var(--red); border: 1px solid rgba(255,107,122,0.25); }
.up-btn-danger:hover { background: rgba(255,107,122,0.22); }
.up-btn-activate { background: var(--green-soft); color: var(--green); border: 1px solid rgba(61,214,140,0.25); }
.up-btn-activate:hover { background: rgba(61,214,140,0.22); }
.up-btn-deactivate { background: var(--amber-soft); color: var(--amber); border: 1px solid rgba(255,181,71,0.25); }
.up-btn-deactivate:hover { background: rgba(255,181,71,0.22); }
.up-btn-sm { padding: 6px 12px; font-size: 12px; }
.up-btn-xs { padding: 5px 10px; font-size: 11px; border-radius: 6px; }
.up-btn:disabled { opacity: 0.5; pointer-events: none; }

/* ── Alert ── */
.up-alert {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  margin-bottom: 16px;
  background: var(--red-soft);
  color: var(--red);
  border: 1px solid rgba(255,107,122,0.25);
  animation: up-fade-in 0.3s ease both;
}

/* ── Loading ── */
.up-loading { display: flex; justify-content: center; align-items: center; height: 200px; }
.up-spinner {
  width: 28px; height: 28px;
  border: 2.5px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: up-spin 0.75s linear infinite;
}
.up-spinner-sm { width: 14px; height: 14px; border-width: 2px; }
@keyframes up-spin { to { transform: rotate(360deg); } }

/* ── Desktop table ── */
.up-table-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow);
}
.up-table { width: 100%; border-collapse: collapse; }
.up-table th {
  padding: 13px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-dim);
  background: var(--surface2);
  border-bottom: 1px solid var(--border);
  font-family: var(--mono);
}
.up-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  font-size: 13.5px;
  vertical-align: middle;
}
.up-table tbody tr {
  transition: background var(--transition);
  animation: up-row-in 0.35s ease both;
}
.up-table tbody tr:hover { background: rgba(255,255,255,0.025); }
.up-table tbody tr:last-child td { border-bottom: none; }
@keyframes up-row-in { from { opacity:0; transform:translateX(-6px); } to { opacity:1; transform:none; } }

/* ── User cell ── */
.up-user-cell { display: flex; align-items: center; gap: 10px; }
.up-avatar {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--accent-glow);
  flex-shrink: 0;
}
.up-avatar-lg { width: 48px; height: 48px; font-size: 18px; border-radius: 14px; }
.up-user-name { font-weight: 600; font-size: 14px; }
.up-text-muted { color: var(--text-muted); font-size: 13px; }
.up-text-dim { color: var(--text-dim); }
.up-text-sm { font-size: 12px; }

/* ── Badges ── */
.up-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  font-family: var(--mono);
  letter-spacing: 0.03em;
  text-transform: uppercase;
}
.up-badge-active { background: var(--green-soft); color: var(--green); }
.up-badge-inactive { background: var(--red-soft); color: var(--red); }
.up-badge-super { background: var(--red-soft); color: var(--red); }
.up-badge-admin { background: var(--amber-soft); color: var(--amber); }
.up-badge-employee { background: var(--green-soft); color: var(--green); }

/* ── Role cell ── */
.up-role-cell { display: flex; align-items: center; gap: 6px; }
.up-icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-dim);
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: var(--transition);
}
.up-icon-btn:hover { color: var(--accent); background: var(--accent-soft); }

/* ── Dept tags ── */
.up-dept-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.up-dept-tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 11px;
  color: var(--text-muted);
}

/* ── Action cell ── */
.up-action-cell { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

/* ── Empty ── */
.up-empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-dim);
}
.up-empty-icon { font-size: 40px; margin-bottom: 12px; }
.up-empty-text { font-size: 14px; }

/* ── MOBILE CARDS (≤ 768px) ── */
.up-cards-list { display: flex; flex-direction: column; gap: 12px; }

.up-user-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow);
  animation: up-card-in 0.35s ease both;
  transition: transform var(--transition), box-shadow var(--transition);
  position: relative;
  overflow: hidden;
}
.up-user-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--accent), var(--purple));
  opacity: 0;
  transition: opacity var(--transition);
}
.up-user-card:active::before { opacity: 1; }
@keyframes up-card-in {
  from { opacity:0; transform:translateY(14px) scale(0.98); }
  to { opacity:1; transform:none; }
}

.up-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}
.up-card-user { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
.up-card-info { min-width: 0; }
.up-card-name { font-weight: 700; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.up-card-email { font-size: 12px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
.up-card-badges { display: flex; gap: 5px; flex-wrap: wrap; }

.up-card-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 12px 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  margin-bottom: 12px;
}
.up-card-meta-item label {
  display: block;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-dim);
  font-family: var(--mono);
  margin-bottom: 3px;
}
.up-card-meta-item .value { font-size: 13px; color: var(--text-muted); }

.up-card-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.up-card-actions .up-btn { flex: 1; justify-content: center; min-width: 0; }

/* ── Responsive toggle ── */
.up-table-wrap { display: none; }
.up-mobile-list { display: block; }

@media (min-width: 769px) {
  .up-table-wrap { display: block; }
  .up-mobile-list { display: none; }
  .up-page { padding: 32px 24px 60px; }
}

/* ─── MODAL ─────────────────────────────────────────────────────── */
.up-overlay {
  position: fixed;
  inset: 0;
  background: rgba(17,24,39,0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  padding: 0;
  animation: up-overlay-in 0.25s ease both;
}
@keyframes up-overlay-in { from { opacity:0; } to { opacity:1; } }

@media (min-width: 600px) {
  .up-overlay { align-items: center; padding: 24px; }
}

.up-modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius) var(--radius) 0 0;
  width: 100%;
  max-height: 95vh;
  overflow-y: auto;
  box-shadow: 0 -4px 40px rgba(0,0,0,0.12);
  animation: up-modal-up 0.32s cubic-bezier(0.34,1.56,0.64,1) both;
}
@keyframes up-modal-up {
  from { transform: translateY(100%); opacity:0; }
  to { transform: none; opacity:1; }
}

@media (min-width: 600px) {
  .up-modal {
    border-radius: var(--radius);
    max-width: 520px;
    animation: up-modal-scale 0.28s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  .up-modal-lg { max-width: 580px; }
}
@keyframes up-modal-scale {
  from { transform: scale(0.92); opacity:0; }
  to { transform: none; opacity:1; }
}

/* drag handle on mobile */
.up-modal::before {
  content: '';
  display: block;
  width: 40px;
  height: 4px;
  background: var(--border-active);
  border-radius: 4px;
  margin: 12px auto 0;
}
@media (min-width: 600px) { .up-modal::before { display: none; } }

.up-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 0;
}
.up-modal-header h2 { font-size: 18px; font-weight: 700; }
.up-modal-close {
  background: var(--surface2);
  border: 1px solid var(--border);
  color: var(--text-muted);
  width: 32px; height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: var(--transition);
  flex-shrink: 0;
}
.up-modal-close:hover { color: var(--text); background: var(--border); }

.up-modal-body { padding: 20px; }

/* ── Form ── */
.up-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 480px) { .up-form-row { grid-template-columns: 1fr; } }

.up-form-group { margin-bottom: 14px; }
.up-form-group label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-muted);
  margin-bottom: 6px;
  font-family: var(--mono);
}
.up-form-group input, .up-form-group select {
  width: 100%;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  color: var(--text);
  font-family: var(--font);
  font-size: 14px;
  padding: 11px 14px;
  outline: none;
  transition: border-color var(--transition), box-shadow var(--transition);
  appearance: none;
  -webkit-appearance: none;
}
.up-form-group input:focus, .up-form-group select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.up-form-group input::placeholder { color: var(--text-dim); }
.up-label-opt { font-weight: 400; color: var(--text-dim); font-size: 10px; text-transform: none; letter-spacing: 0; margin-left: 4px; }

.up-dept-hint {
  font-size: 12px;
  color: var(--green);
  margin-top: 6px;
  display: flex; align-items: center; gap: 4px;
}

/* Inline create dept */
.up-inline-dept {
  margin-top: 10px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 14px;
  animation: up-fade-in 0.2s ease both;
}
.up-inline-dept-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
}
.up-inline-dept-header p { font-size: 13px; font-weight: 600; }

.up-modal-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid var(--border);
  background: #f8f9fc;
}
@media (max-width: 480px) {
  .up-modal-footer { flex-direction: column-reverse; }
  .up-modal-footer .up-btn { width: 100%; justify-content: center; padding: 13px; }
}

/* ── Role selector ── */
.up-role-user-hint {
  padding: 12px 16px;
  font-size: 14px;
  color: var(--text-muted);
  background: var(--surface2);
  border-radius: var(--radius-sm);
  margin-bottom: 14px;
}
.up-role-user-hint strong { color: var(--text); }

.up-role-options { display: flex; flex-direction: column; gap: 8px; margin-bottom: 4px; }
.up-role-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--surface2);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
}
.up-role-option:hover { border-color: var(--border-active); background: rgba(255,255,255,0.04); }
.up-role-option.selected { border-color: var(--accent); background: var(--accent-soft); }
.up-role-option input[type="radio"] { display: none; }
.up-role-option-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.up-role-icon-employee { background: var(--green-soft); color: var(--green); }
.up-role-icon-admin { background: var(--amber-soft); color: var(--amber); }
.up-role-icon-super { background: var(--red-soft); color: var(--red); }

.up-role-option-text { flex: 1; min-width: 0; }
.up-role-option-label { font-weight: 600; font-size: 14px; display: block; }
.up-role-option-desc { font-size: 12px; color: var(--text-muted); margin-top: 2px; display: block; }
.up-role-check {
  width: 20px; height: 20px;
  border: 1.5px solid var(--border-active);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: var(--transition);
}
.selected .up-role-check {
  background: var(--accent);
  border-color: var(--accent);
}
`;

const roleColors = {
  SUPER_ADMIN: "up-badge-super",
  ADMIN: "up-badge-admin",
  EMPLOYEE: "up-badge-employee",
};
const ALL_ROLES = ["EMPLOYEE", "ADMIN", "SUPER_ADMIN"];

const roleIcons = {
  EMPLOYEE: <User size={16} />,
  ADMIN: <Shield size={16} />,
  SUPER_ADMIN: <Crown size={16} />,
};

export default function UsersPage() {
  const { user } = useAuth();
  const { confirm } = useDialog();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [roleModal, setRoleModal] = useState(null);
  const [error, setError] = useState("");

  const fetchAll = async () => {
    try {
      const [usersRes, deptsRes] = await Promise.all([api.get("/users"), api.get("/departments")]);
      setUsers(usersRes.data);
      setDepartments(deptsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const userDeptMap = {};
  departments.forEach(dept => {
    dept.members?.forEach(member => {
      const id = member._id || member;
      if (!userDeptMap[id]) userDeptMap[id] = [];
      userDeptMap[id].push(dept.name);
    });
  });

  const handleDelete = async (userId, userName) => {
    const ok = await confirm({
      title: "Delete User",
      message: `Delete "${userName}"? This cannot be undone.`,
      icon: "🗑️",
      danger: true,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await api.delete(`/users/${userId}`);
      fetchAll();
    } catch (err) {
      await confirm({ type: "alert", title: "Error", message: err.response?.data?.message || "Error deleting user", icon: "⚠️", danger: false, confirmLabel: "OK" });
    }
  };

  const handleToggleActive = async (userId) => {
    try {
      await api.patch(`/users/${userId}/toggle-active`);
      fetchAll();
    } catch (err) {
      await confirm({ type: "alert", title: "Error", message: err.response?.data?.message || "Error updating user", icon: "⚠️", danger: false, confirmLabel: "OK" });
    }
  };

  return (
    <div className="up-root">
      <style>{STYLES}</style>
      <div className="up-page">
        {/* Header */}
        <div className="up-header">
          <div className="up-header-left">
            <h1>Users</h1>
            <div className="up-subtitle">
              <span className="up-dot" />
              {users.length} member{users.length !== 1 ? "s" : ""}
            </div>
          </div>
          <button className="up-btn up-btn-primary" onClick={() => setShowModal(true)}>
            <UserPlus size={15} strokeWidth={2.5} /> New User
          </button>
        </div>

        {error && <div className="up-alert">⚠ {error}</div>}

        {loading ? (
          <div className="up-loading"><div className="up-spinner" /></div>
        ) : users.length === 0 ? (
          <div className="up-empty">
            <div className="up-empty-icon">👥</div>
            <div className="up-empty-text">No users found</div>
          </div>
        ) : (
          <>
            {/* ── Desktop Table ── */}
            <div className="up-table-wrap">
              <div className="up-table-card">
                <table className="up-table">
                  <thead>
                    <tr>
                      <th>Name</th><th>Email</th><th>Role</th>
                      <th>Department</th><th>Status</th><th>Joined</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => {
                      const deptNames = userDeptMap[u._id] || [];
                      return (
                        <tr key={u._id} style={{ animationDelay: `${i * 40}ms` }}>
                          <td>
                            <div className="up-user-cell">
                              <div className="up-avatar">{u.name?.charAt(0)?.toUpperCase() ?? "?"}</div>
                              <span className="up-user-name">{u.name}</span>
                            </div>
                          </td>
                          <td className="up-text-muted">{u.email}</td>
                          <td>
                            <div className="up-role-cell">
                              <span className={`up-badge ${roleColors[u.role] || ""}`}>
                                {u.role?.replace(/_/g, " ")}
                              </span>
                              {isSuperAdmin && (
                                <button className="up-icon-btn" title="Change role"
                                  onClick={() => setRoleModal({ userId: u._id, currentRole: u.role, name: u.name })}>
                                  <Pencil size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            {deptNames.length > 0 ? (
                              <div className="up-dept-tags">
                                {deptNames.map(n => (
                                  <span key={n} className="up-dept-tag"><Building2 size={10} />{n}</span>
                                ))}
                              </div>
                            ) : <span className="up-text-dim up-text-sm">—</span>}
                          </td>
                          <td>
                            <span className={`up-badge ${u.isActive ? "up-badge-active" : "up-badge-inactive"}`}>
                              {u.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="up-text-muted up-text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td>
                            <div className="up-action-cell">
                              {isSuperAdmin && (
                                <button
                                  className={`up-btn up-btn-xs ${u.isActive ? "up-btn-deactivate" : "up-btn-activate"}`}
                                  onClick={() => handleToggleActive(u._id)}>
                                  {u.isActive ? "Deactivate" : "Activate"}
                                </button>
                              )}
                              <button className="up-btn up-btn-xs up-btn-danger" onClick={() => handleDelete(u._id, u.name)}>
                                <Trash2 size={11} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Mobile Cards ── */}
            <div className="up-mobile-list">
              <div className="up-cards-list">
                {users.map((u, i) => {
                  const deptNames = userDeptMap[u._id] || [];
                  return (
                    <div key={u._id} className="up-user-card" style={{ animationDelay: `${i * 50}ms` }}>
                      <div className="up-card-header">
                        <div className="up-card-user">
                          <div className="up-avatar up-avatar-lg">{u.name?.charAt(0)?.toUpperCase() ?? "?"}</div>
                          <div className="up-card-info">
                            <div className="up-card-name">{u.name}</div>
                            <div className="up-card-email">{u.email}</div>
                          </div>
                        </div>
                        <div className="up-card-badges">
                          <span className={`up-badge ${u.isActive ? "up-badge-active" : "up-badge-inactive"}`}>
                            {u.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>

                      <div className="up-card-meta">
                        <div className="up-card-meta-item">
                          <label>Role</label>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span className={`up-badge ${roleColors[u.role] || ""}`}>
                              {u.role?.replace(/_/g, " ")}
                            </span>
                            {isSuperAdmin && (
                              <button className="up-icon-btn" style={{ padding: "3px" }}
                                onClick={() => setRoleModal({ userId: u._id, currentRole: u.role, name: u.name })}>
                                <Pencil size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="up-card-meta-item">
                          <label>Joined</label>
                          <span className="value">{new Date(u.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="up-card-meta-item" style={{ gridColumn: "1/-1" }}>
                          <label>Department</label>
                          {deptNames.length > 0 ? (
                            <div className="up-dept-tags" style={{ marginTop: 4 }}>
                              {deptNames.map(n => (
                                <span key={n} className="up-dept-tag"><Building2 size={10} />{n}</span>
                              ))}
                            </div>
                          ) : <span className="value">—</span>}
                        </div>
                      </div>

                      <div className="up-card-actions">
                        {isSuperAdmin && (
                          <button
                            className={`up-btn up-btn-sm ${u.isActive ? "up-btn-deactivate" : "up-btn-activate"}`}
                            onClick={() => handleToggleActive(u._id)}>
                            {u.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                            {u.isActive ? "Deactivate" : "Activate"}
                          </button>
                        )}
                        <button className="up-btn up-btn-sm up-btn-danger" onClick={() => handleDelete(u._id, u.name)}>
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <CreateUserModal currentUser={user} onClose={() => setShowModal(false)} onCreated={fetchAll} />
      )}
      {roleModal && (
        <ChangeRoleModal
          userId={roleModal.userId}
          currentRole={roleModal.currentRole}
          userName={roleModal.name}
          onClose={() => setRoleModal(null)}
          onUpdated={fetchAll}
        />
      )}
    </div>
  );
}

/* ─── Create User Modal ─────────────────────────────────────────── */
function CreateUserModal({ currentUser, onClose, onCreated }) {
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const availableRoles = isSuperAdmin ? ALL_ROLES : ["EMPLOYEE"];
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "EMPLOYEE", departmentId: "" });
  const [departments, setDepartments] = useState([]);
  const [deptsLoading, setDeptsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showInlineCreate, setShowInlineCreate] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptDesc, setNewDeptDesc] = useState("");
  const [deptCreating, setDeptCreating] = useState(false);
  const [deptError, setDeptError] = useState("");

  const fetchDepts = async () => {
    try { const r = await api.get("/departments"); setDepartments(r.data); }
    catch (e) { console.error(e); } finally { setDeptsLoading(false); }
  };
  useEffect(() => { fetchDepts(); }, []);

  const handleCreateDept = async () => {
    if (!newDeptName.trim()) return;
    setDeptCreating(true); setDeptError("");
    try {
      const r = await api.post("/departments", { name: newDeptName.trim(), description: newDeptDesc.trim(), memberIds: [] });
      await fetchDepts();
      setForm(p => ({ ...p, departmentId: r.data._id }));
      setShowInlineCreate(false); setNewDeptName(""); setNewDeptDesc("");
    } catch (e) { setDeptError(e.response?.data?.message || "Error creating department"); }
    finally { setDeptCreating(false); }
  };

  const handleSubmit = async () => {
    setLoading(true); setError("");
    try { await api.post("/users", form); onCreated(); onClose(); }
    catch (e) { setError(e.response?.data?.message || "Error creating user"); }
    finally { setLoading(false); }
  };

  return (
    <div className="up-overlay" onClick={onClose}>
      <div className="up-modal up-modal-lg" onClick={e => e.stopPropagation()}>
        <div className="up-modal-header">
          <h2>Create User</h2>
          <button className="up-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="up-modal-body">
          {error && <div className="up-alert">⚠ {error}</div>}
          <div className="up-form-row">
            <div className="up-form-group">
              <label>Full Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" required />
            </div>
            <div className="up-form-group">
              <label>Role</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value, departmentId: "" })}>
                {availableRoles.map(r => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
              </select>
            </div>
          </div>
          <div className="up-form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@company.com" required />
          </div>
          <div className="up-form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required minLength={6} />
          </div>

          {form.role === "EMPLOYEE" && (
            <div className="up-form-group">
              <label>Department <span className="up-label-opt">(optional)</span></label>
              {deptsLoading ? <div style={{ padding: "8px 0" }}><div className="up-spinner up-spinner-sm" /></div> : (
                <>
                  <select value={form.departmentId} onChange={e => {
                    if (e.target.value === "__create__") {
                      setShowInlineCreate(true); setForm(p => ({ ...p, departmentId: "" }));
                    } else {
                      setShowInlineCreate(false); setForm(p => ({ ...p, departmentId: e.target.value }));
                    }
                  }}>
                    <option value="">No department</option>
                    {departments.map(d => <option key={d._id} value={d._id}>🏢 {d.name} ({d.members?.length || 0} members)</option>)}
                    <option value="__create__">＋ Create new department…</option>
                  </select>

                  {showInlineCreate && (
                    <div className="up-inline-dept">
                      <div className="up-inline-dept-header">
                        <p>New department</p>
                        <button type="button" className="up-modal-close" onClick={() => { setShowInlineCreate(false); setDeptError(""); }}><X size={14} /></button>
                      </div>
                      {deptError && <div className="up-alert">⚠ {deptError}</div>}
                      <div className="up-form-group">
                        <label>Name *</label>
                        <input value={newDeptName} onChange={e => setNewDeptName(e.target.value)} placeholder="e.g. Engineering" />
                      </div>
                      <div className="up-form-group">
                        <label>Description</label>
                        <input value={newDeptDesc} onChange={e => setNewDeptDesc(e.target.value)} placeholder="Optional" />
                      </div>
                      <button type="button" className="up-btn up-btn-primary up-btn-sm" onClick={handleCreateDept} disabled={deptCreating || !newDeptName.trim()}>
                        {deptCreating ? <div className="up-spinner up-spinner-sm" /> : "Create & Select"}
                      </button>
                    </div>
                  )}

                  {form.departmentId && !showInlineCreate && (() => {
                    const d = departments.find(x => x._id === form.departmentId);
                    return d ? <p className="up-dept-hint"><Check size={13} /> Will join <strong>{d.name}</strong></p> : null;
                  })()}
                </>
              )}
            </div>
          )}
        </div>
        <div className="up-modal-footer">
          <button type="button" className="up-btn up-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="up-btn up-btn-primary" disabled={loading} onClick={handleSubmit}>
            {loading ? <div className="up-spinner up-spinner-sm" /> : <><UserPlus size={14} /> Create User</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Change Role Modal ─────────────────────────────────────────── */
function ChangeRoleModal({ userId, currentRole, userName, onClose, onUpdated }) {
  const [role, setRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (role === currentRole) { onClose(); return; }
    setLoading(true); setError("");
    try { await api.patch(`/users/${userId}/role`, { role }); onUpdated(); onClose(); }
    catch (e) { setError(e.response?.data?.message || "Error updating role"); }
    finally { setLoading(false); }
  };

  const roleConfig = {
    EMPLOYEE: { icon: <User size={18} />, cls: "up-role-icon-employee", desc: "Can view & update their own tasks" },
    ADMIN: { icon: <Shield size={18} />, cls: "up-role-icon-admin", desc: "Can create tasks, manage employees" },
    SUPER_ADMIN: { icon: <Crown size={18} />, cls: "up-role-icon-super", desc: "Full access — all users & tasks" },
  };

  return (
    <div className="up-overlay" onClick={onClose}>
      <div className="up-modal" onClick={e => e.stopPropagation()}>
        <div className="up-modal-header">
          <h2>Change Role</h2>
          <button className="up-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="up-modal-body">
          {error && <div className="up-alert">⚠ {error}</div>}
          <div className="up-role-user-hint">Updating role for <strong>{userName}</strong></div>
          <div className="up-role-options">
            {ALL_ROLES.map(r => {
              const cfg = roleConfig[r];
              return (
                <label key={r} className={`up-role-option ${role === r ? "selected" : ""}`} onClick={() => setRole(r)}>
                  <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} />
                  <div className={`up-role-option-icon ${cfg.cls}`}>{cfg.icon}</div>
                  <div className="up-role-option-text">
                    <span className="up-role-option-label">{r.replace(/_/g, " ")}</span>
                    <span className="up-role-option-desc">{cfg.desc}</span>
                  </div>
                  <div className="up-role-check">
                    {role === r && <Check size={12} color="#fff" strokeWidth={3} />}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
        <div className="up-modal-footer">
          <button type="button" className="up-btn up-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="up-btn up-btn-primary" disabled={loading} onClick={handleSubmit}>
            {loading ? <div className="up-spinner up-spinner-sm" /> : <><ShieldCheck size={14} /> Update Role</>}
          </button>
        </div>
      </div>
    </div>
  );
}