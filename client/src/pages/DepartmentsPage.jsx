import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useDialog } from "../components/Dialog";
import { HiPlus} from "react-icons/hi";
import { Building2, Users, Plus, Pencil, Trash2, ChevronDown, ChevronUp, Search, Check } from "lucide-react";

export default function DepartmentsPage() {
  const { user } = useAuth();
  const { confirm } = useDialog();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [error, setError] = useState("");

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/departments");
      setDepartments(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  const handleDelete = async (id, name) => {
    const ok = await confirm({
      title: "Delete Department",
      message: `Are you sure you want to delete "${name}"? This cannot be undone.`,
      icon: "🏢",
      danger: true,
      confirmLabel: "Delete Department",
    });
    if (!ok) return;
    try {
      await api.delete(`/departments/${id}`);
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting department");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Departments</h1>
          <p className="text-muted">{departments.length} department{departments.length !== 1 ? "s" : ""}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <HiPlus size={16} /> Create 
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-center"><span className="spinner lg" /></div>
      ) : departments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏢</div>
          <p>No departments yet</p>
          <p className="text-muted text-sm">Create a department to organise your employees</p>
        </div>
      ) : (
        <div className="dept-grid">
          {departments.map((dept) => (
            <DeptCard
              key={dept._id}
              dept={dept}
              onEdit={() => setEditTarget(dept)}
              onDelete={() => handleDelete(dept._id, dept.name)}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <DeptModal
          onClose={() => setShowCreateModal(false)}
          onSaved={fetchDepartments}
        />
      )}

      {editTarget && (
        <DeptModal
          dept={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={fetchDepartments}
        />
      )}
    </div>
  );
}

function DeptCard({ dept, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="dept-card">
      <div className="dept-card-header">
        <div className="dept-icon-box"><Building2 size={20} strokeWidth={2}/></div>
        <div className="dept-info">
          <h3 className="dept-name">{dept.name}</h3>
          {dept.description && <p className="dept-desc">{dept.description}</p>}
        </div>
        <div className="dept-actions">
          <button className="icon-btn" title="Edit" onClick={onEdit}><Pencil size={13} strokeWidth={2}/></button>
          <button className="icon-btn danger" title="Delete" onClick={onDelete}><Trash2 size={13} strokeWidth={2}/></button>
        </div>
      </div>

      <div className="dept-meta">
        <span className="dept-count"><Users size={14} strokeWidth={2}/>{dept.members?.length || 0} member{dept.members?.length !== 1 ? "s" : ""}</span>
        {/* <span className="text-muted text-sm">
          {dept.createdBy?.role === "SUPER_ADMIN"
            ? "Created by Super Admin"
            : `Created by ${dept.createdBy?.name || "—"}`}
        </span> */}
      </div>

      {dept.members?.length > 0 && (
        <>
          <button
            className="dept-toggle"
            onClick={() => setExpanded(!expanded)}
          >
            <>{expanded ? <ChevronUp size={13} strokeWidth={2}/> : <ChevronDown size={13} strokeWidth={2}/>}{expanded ? "Hide members" : "Show members"}</>
          </button>

          {expanded && (
            <div className="dept-members">
              {dept.members.map((m) => (
                <div key={m._id} className="dept-member">
                  <div className="avatar sm">{m.name?.charAt(0)?.toUpperCase()}</div>
                  <div>
                    <p className="dept-member-name">{m.name}</p>
                    <p className="text-muted text-sm">{m.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DeptModal({ dept, onClose, onSaved }) {
  const isEdit = !!dept;
  const [form, setForm] = useState({
    name: dept?.name || "",
    description: dept?.description || "",
    memberIds: dept?.members?.map((m) => m._id) || [],
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    api.get("/users")
      .then((res) => setEmployees(res.data))
      .catch(console.error);
  }, []);

  const toggleMember = (id) => {
    setForm((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(id)
        ? prev.memberIds.filter((m) => m !== id)
        : [...prev.memberIds, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isEdit) {
        await api.put(`/departments/${dept._id}`, form);
      } else {
        await api.post("/departments", form);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Error saving department");
    } finally {
      setLoading(false);
    }
  };
    const rolePriority = {
      SUPER_ADMIN: 1,
      ADMIN: 2,
      EMPLOYEE: 3,
    };
    const filtered = employees
      .filter(
        (e) =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.email.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => rolePriority[a.role] - rolePriority[b.role]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? "Edit Department" : "Create Department"}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label>Department Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Engineering, Marketing"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description"
              rows={2}
            />
          </div>

          <div className="form-group">
            <label>
              Members
              <span className="label-count">{form.memberIds.length} selected</span>
            </label>
            <input
              className="member-search"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="member-list">
              {filtered.length === 0 ? (
                <p className="empty-msg">No employees found</p>
              ) : (
                filtered.map((emp) => {
                  const selected = form.memberIds.includes(emp._id);
                  return (
                    <label key={emp._id} className={`member-item ${selected ? "selected" : ""}`}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleMember(emp._id)}
                      />
                      <div className="avatar sm">{emp.name?.charAt(0)?.toUpperCase()}</div>
                      <div className="member-item-info">
                        <p className="member-item-name">{emp.name}</p>
                        <p className="text-muted text-sm">{emp.email}</p>
                      </div>
                      {selected && <span className="check-mark">✓</span>}
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : isEdit ? "Save Changes" : "Create Department"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
