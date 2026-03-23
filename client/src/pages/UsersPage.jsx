import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useDialog } from "../components/Dialog";
import { UserPlus, Pencil, Trash2, ShieldCheck, UserCheck, UserX, Check, Building2 } from "lucide-react";

const roleColors = {
  SUPER_ADMIN: "badge-blocked",
  ADMIN:       "badge-progress",
  EMPLOYEE:    "badge-done",
};
const ALL_ROLES = ["EMPLOYEE", "ADMIN", "SUPER_ADMIN"];

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
      message: `Are you sure you want to delete "${userName}"? This action cannot be undone.`,
      icon: "🗑️",
      danger: true,
      confirmLabel: "Delete User",
    });
    if (!ok) return;
    try {
      await api.delete(`/users/${userId}`);
      fetchAll();
    } catch (err) {
      await confirm({
        type: "alert",
        title: "Error",
        message: err.response?.data?.message || "Error deleting user",
        icon: "⚠️",
        danger: false,
        confirmLabel: "OK",
      });
    }
  };

  const handleToggleActive = async (userId) => {
    try {
      await api.patch(`/users/${userId}/toggle-active`);
      fetchAll();
    } catch (err) {
      await confirm({
        type: "alert",
        title: "Error",
        message: err.response?.data?.message || "Error updating user",
        icon: "⚠️",
        danger: false,
        confirmLabel: "OK",
      });
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <div className="page-subtitle">
            <span className="dot" />
            {users.length} member{users.length !== 1 ? "s" : ""}
          </div>
        </div>
        <button className="btn btn-primary" style={{gap:6}} onClick={() => setShowModal(true)}><UserPlus size={15} strokeWidth={2.5}/> New User</button>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      {loading ? (
        <div className="loading-center"><span className="spinner lg" /></div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Role</th>
                <th>Department</th><th>Status</th><th>Joined</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={7} className="empty-msg">No users found</td></tr>
              ) : users.map(u => {
                const deptNames = userDeptMap[u._id] || [];
                return (
                  <tr key={u._id}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar">{u.name?.charAt(0)?.toUpperCase() ?? "?"}</div>
                        <span className="user-name">{u.name}</span>
                      </div>
                    </td>
                    <td className="text-muted">{u.email}</td>
                    <td>
                      <div className="role-cell">
                        <span className={`badge ${roleColors[u.role] || "badge-pending"}`}>
                          {u.role?.replace(/_/g, " ")}
                        </span>
                        {isSuperAdmin && (
                          <button className="icon-btn" title="Change role"
                            onClick={() => setRoleModal({ userId: u._id, currentRole: u.role, name: u.name })}>
                            ✏️
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      {deptNames.length > 0 ? (
                        <div className="dept-tags">
                          {deptNames.map(n => <span key={n} className="dept-tag">🏢 {n}</span>)}
                        </div>
                      ) : <span className="text-dim text-sm">—</span>}
                    </td>
                    <td>
                      <span className={`badge ${u.isActive ? "badge-done" : "badge-blocked"}`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="text-muted text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-cell">
                        {isSuperAdmin && (
                          <button className={`btn btn-sm ${u.isActive ? "btn-ghost" : "btn-primary"}`}
                            onClick={() => handleToggleActive(u._id)}>
                            {u.isActive ? "Deactivate" : "Activate"}
                          </button>
                        )}
                        <button className="btn btn-sm btn-danger" style={{gap:5}} onClick={() => handleDelete(u._id, u.name)}><Trash2 size={12} strokeWidth={2}/> Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <CreateUserModal currentUser={user} onClose={() => setShowModal(false)} onCreated={fetchAll} />}
      {roleModal && <ChangeRoleModal userId={roleModal.userId} currentRole={roleModal.currentRole} userName={roleModal.name} onClose={() => setRoleModal(null)} onUpdated={fetchAll} />}
    </div>
  );
}

function CreateUserModal({ currentUser, onClose, onCreated }) {
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const availableRoles = isSuperAdmin ? ALL_ROLES : ["EMPLOYEE"];
  const [form, setForm] = useState({ name:"", email:"", password:"", role:"EMPLOYEE", departmentId:"" });
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
    catch(e){ console.error(e); } finally { setDeptsLoading(false); }
  };
  useEffect(() => { fetchDepts(); }, []);

  const handleCreateDept = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setDeptCreating(true); setDeptError("");
    try {
      const r = await api.post("/departments", { name: newDeptName.trim(), description: newDeptDesc.trim(), memberIds: [] });
      await fetchDepts();
      setForm(p => ({...p, departmentId: r.data._id}));
      setShowInlineCreate(false); setNewDeptName(""); setNewDeptDesc("");
    } catch(e){ setDeptError(e.response?.data?.message || "Error creating department"); }
    finally { setDeptCreating(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError("");
    try { await api.post("/users", form); onCreated(); onClose(); }
    catch(e){ setError(e.response?.data?.message || "Error creating user"); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create User</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">⚠ {error}</div>}
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Jane Doe" required />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select value={form.role} onChange={e=>setForm({...form,role:e.target.value,departmentId:""})}>
                {availableRoles.map(r=><option key={r} value={r}>{r.replace(/_/g," ")}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="jane@company.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="••••••••" required minLength={6} />
          </div>
          {form.role === "EMPLOYEE" && (
            <div className="form-group">
              <label>Department <span className="label-optional">(optional)</span></label>
              {deptsLoading ? <div style={{padding:"8px 0"}}><span className="spinner"/></div> : (
                <>
                  <select value={form.departmentId} onChange={e=>{
                    if(e.target.value==="__create__"){setShowInlineCreate(true);setForm(p=>({...p,departmentId:""}))}
                    else{setShowInlineCreate(false);setForm(p=>({...p,departmentId:e.target.value}))}
                  }}>
                    <option value="">No department</option>
                    {departments.map(d=><option key={d._id} value={d._id}>🏢 {d.name} ({d.members?.length||0} members)</option>)}
                    <option value="__create__">＋ Create new department first...</option>
                  </select>
                  {showInlineCreate && (
                    <div className="inline-create-dept">
                      <div className="inline-create-header">
                        <p>Create a new department</p>
                        <button type="button" className="modal-close" onClick={()=>{setShowInlineCreate(false);setDeptError("");}}>✕</button>
                      </div>
                      {deptError && <div className="alert alert-error">⚠ {deptError}</div>}
                      <div className="form-group">
                        <label>Department Name *</label>
                        <input value={newDeptName} onChange={e=>setNewDeptName(e.target.value)} placeholder="e.g. Engineering" />
                      </div>
                      <div className="form-group">
                        <label>Description</label>
                        <input value={newDeptDesc} onChange={e=>setNewDeptDesc(e.target.value)} placeholder="Optional" />
                      </div>
                      <button type="button" className="btn btn-primary btn-sm" onClick={handleCreateDept} disabled={deptCreating||!newDeptName.trim()}>
                        {deptCreating?<span className="spinner"/>:"Create & Select"}
                      </button>
                    </div>
                  )}
                  {form.departmentId && !showInlineCreate && (() => {
                    const d = departments.find(x=>x._id===form.departmentId);
                    return d ? <p className="dept-selected-hint">✓ Will be added to <strong>{d.name}</strong></p> : null;
                  })()}
                </>
              )}
            </div>
          )}
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading?<span className="spinner"/>:"Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChangeRoleModal({ userId, currentRole, userName, onClose, onUpdated }) {
  const [role, setRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (role === currentRole) { onClose(); return; }
    setLoading(true); setError("");
    try { await api.patch(`/users/${userId}/role`, { role }); onUpdated(); onClose(); }
    catch(e){ setError(e.response?.data?.message || "Error updating role"); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <h2>Change Role</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">⚠ {error}</div>}
          <p className="role-modal-user">Updating role for <strong>{userName}</strong></p>
          <div className="role-options">
            {ALL_ROLES.map(r => (
              <label key={r} className={`role-option ${role===r?"selected":""}`}>
                <input type="radio" name="role" value={r} checked={role===r} onChange={()=>setRole(r)} />
                <span className="role-option-label">{r.replace(/_/g," ")}</span>
                <span className="role-option-desc">
                  {r==="EMPLOYEE"&&"Can view & update their own tasks"}
                  {r==="ADMIN"&&"Can create tasks, manage employees"}
                  {r==="SUPER_ADMIN"&&"Full access — all users & tasks"}
                </span>
              </label>
            ))}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading?<span className="spinner"/>:"Update Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
