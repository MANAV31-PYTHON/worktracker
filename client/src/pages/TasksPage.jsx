import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import socket from "../sockets/socket";
import { useDialog } from "../components/Dialog";
import { HiBookmark, HiPlus, HiPencil, HiTrash, HiClipboardList, HiChevronDown, HiChevronUp } from "react-icons/hi";
import { HiBuildingOffice2, HiUser, HiShieldCheck, HiCalendarDays, HiUsers } from "react-icons/hi2";

const statusOptions = ["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED"];
const priorityOptions = ["LOW", "MEDIUM", "HIGH"];

const statusColors = {
  PENDING: "badge-pending",
  IN_PROGRESS: "badge-progress",
  COMPLETED: "badge-done",
  BLOCKED: "badge-blocked",
};
const priorityColors = {
  LOW: "pri-low",
  MEDIUM: "pri-medium",
  HIGH: "pri-high",
};
const statusDot = {
  PENDING: "#f59e0b",
  IN_PROGRESS: "#6366f1",
  COMPLETED: "#22c55e",
  BLOCKED: "#ef4444",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const progressFillClass = (p) =>
  p === 100 ? "fill-done" : p > 50 ? "fill-mid" : "fill-low";

export default function TasksPage() {
  const { user } = useAuth();
  const role = user?.role ?? "";
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(role);
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isEmployee = role === "EMPLOYEE";
  const { confirm } = useDialog();

  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showMyProgress, setShowMyProgress] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // ── Personal Tasks state ─────────────────────────────────────────────────────
  const [personalTasks, setPersonalTasks] = useState([]);
  const [personalLoading, setPersonalLoading] = useState(true);
  const [showPersonalCreate, setShowPersonalCreate] = useState(false);
  const [showPersonalUpdate, setShowPersonalUpdate] = useState(false);
  const [selectedPersonalTask, setSelectedPersonalTask] = useState(null);
  const [showPersonalSection, setShowPersonalSection] = useState(true);
  // ────────────────────────────────────────────────────────────────────────────

  const fetchPersonalTasks = useCallback(async () => {
    try {
      const res = await api.get("/personal-tasks");
      setPersonalTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setPersonalLoading(false);
    }
  }, []);

  useEffect(() => { fetchPersonalTasks(); }, [fetchPersonalTasks]);

  const handleDeletePersonalTask = async (taskId) => {
    const ok = await confirm({
      title: "Delete Reminder", icon: "🗑️", danger: true,
      message: "Delete this personal reminder? This cannot be undone.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await api.delete(`/personal-tasks/${taskId}`);
      fetchPersonalTasks();
    } catch (err) {
      await confirm({
        type: "alert", title: "Error", icon: "⚠️",
        danger: false, confirmLabel: "OK",
        message: err.response?.data?.message || "Error deleting reminder",
      });
    }
  };

  const fetchTasks = useCallback(async () => {
    try {
      const res = await api.get("/tasks");
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    api.get("/departments").then((r) => setDepartments(r.data)).catch(console.error);
    if (isAdmin) {
      api.get("/users")
        .then((r) => setEmployees(r.data.filter((u) => u.role === "EMPLOYEE")))
        .catch(console.error);
    }
  }, [fetchTasks, isAdmin]);

  useEffect(() => {
    const refresh = () => fetchTasks();
    socket.on("task_assigned", refresh);
    socket.on("task_updated", refresh);
    socket.on("task_deleted", refresh);
    return () => {
      socket.off("task_assigned", refresh);
      socket.off("task_updated", refresh);
      socket.off("task_deleted", refresh);
    };
  }, [fetchTasks]);

  const openLogs = async (task) => {
    setSelectedTask(task);
    setShowLogs(true);
    setLogsLoading(true);
    try {
      const res = await api.get(`/logs/${task._id}`);
      setLogs(res.data);
    } catch (err) { console.error(err); }
    finally { setLogsLoading(false); }
  };

  const handleDelete = async (taskId) => {
    const ok = await confirm({
      title: "Delete Task", icon: "🗑️", danger: true,
      message: "Are you sure you want to delete this task? This cannot be undone.",
      confirmLabel: "Delete Task",
    });
    if (!ok) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchTasks();
    } catch (err) {
      await confirm({
        type: "alert", title: "Error", icon: "⚠️", danger: false, confirmLabel: "OK",
        message: err.response?.data?.message || "Error deleting task",
      });
    }
  };

  // Is this employee one of the assignees?
  const myAssigneeEntry = (task) =>
    isEmployee
      ? task.assignees?.find((a) => (a.user?._id || a.user) === user?._id)
      : null;

  // Dept of the first assignee (for card chip)
  const getDept = (task) => {
    const firstId = task.assignees?.[0]?.user?._id || task.assignees?.[0]?.user;
    if (!firstId) return null;
    return departments.find((d) => d.members?.some((m) => (m._id || m) === firstId));
  };

  // Filter tasks
  const filtered = tasks
    .filter((t) => filter === "ALL" || t.overallStatus === filter)
    .filter((t) => {
      if (deptFilter === "ALL") return true;
      const dept = departments.find((d) => d._id === deptFilter);
      return t.assignees?.some((a) => {
        const id = a.user?._id || a.user;
        return dept?.members?.some((m) => (m._id || m) === id);
      });
    });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p className="text-muted">{tasks.length} total task{tasks.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isAdmin && (
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="filter-select">
              <option value="ALL">All Departments</option>
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          )}
          {isAdmin && (
            <button className="btn btn-primary" style={{ gap: 6 }} onClick={() => setShowCreate(true)}>
              <HiPlus size={16} /> New Task
            </button>
          )}
        </div>
      </div>

      {/* ── Personal Reminders Section ───────────────────────────────────────── */}
      <div style={{
        background: "var(--bg2)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "16px 20px",
        marginBottom: 24,
      }}>
        {/* Section header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: showPersonalSection ? 16 : 0,
        }}>
          <button
            onClick={() => setShowPersonalSection((p) => !p)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "none", border: "none", cursor: "pointer",
              fontWeight: 700, fontSize: 15, color: "var(--text)",
            }}
          >
            <HiBookmark size={16} style={{ color: "var(--primary, #6366f1)" }} />
            My Personal Reminders
            <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 400 }}>
              ({personalTasks.length})
            </span>
            {showPersonalSection ? <HiChevronUp size={14} /> : <HiChevronDown size={14} />}
          </button>

          <button
            className="btn btn-primary"
            style={{ gap: 6, padding: "6px 14px", fontSize: 13 }}
            onClick={() => setShowPersonalCreate(true)}
          >
            <HiPlus size={14} /> Add Reminder
          </button>
        </div>

        {showPersonalSection && (
          personalLoading ? (
            <div className="loading-center"><span className="spinner" /></div>
          ) : personalTasks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-3)", fontSize: 13 }}>
              No personal reminders yet. Add one to get started.
            </div>
          ) : (
            <div className="tasks-grid">
              {personalTasks.map((task) => (
                <PersonalTaskCard
                  key={task._id}
                  task={task}
                  onEdit={() => { setSelectedPersonalTask(task); setShowPersonalUpdate(true); }}
                  onDelete={() => handleDeletePersonalTask(task._id)}
                />
              ))}
            </div>
          )
        )}
      </div>
      {/* ──────────────────────────────────────────────────────────────────────── */}

      <div className="filter-bar">
        {["ALL", ...statusOptions].map((s) => (
          <button key={s} className={`filter-btn ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-center"><span className="spinner lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📭</div><p>No tasks found</p></div>
      ) : (
        <div className="tasks-grid">
          {filtered.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              isAdmin={isAdmin}
              isSuperAdmin={isSuperAdmin}
              isEmployee={isEmployee}
              currentUserId={user?._id}
              myEntry={myAssigneeEntry(task)}
              department={isAdmin ? getDept(task) : null}
              onUpdate={() => { setSelectedTask(task); setShowUpdate(true); }}
              onDelete={() => handleDelete(task._id)}
              onViewLogs={() => openLogs(task)}
              onMyProgress={() => { setSelectedTask(task); setShowMyProgress(true); }}
            />
          ))}
        </div>
      )}

      {/* ── Existing modals ───────────────────────────────────────────────────── */}
      {showCreate && (
        <CreateTaskModal
          employees={employees} departments={departments}
          onClose={() => setShowCreate(false)} onCreated={fetchTasks}
        />
      )}
      {showUpdate && selectedTask && (
        <UpdateTaskModal
          task={selectedTask} departments={departments} employees={employees}
          onClose={() => { setShowUpdate(false); setSelectedTask(null); }}
          onUpdated={fetchTasks}
        />
      )}
      {showMyProgress && selectedTask && (
        <MyProgressModal
          task={selectedTask} currentUserId={user?._id}
          onClose={() => { setShowMyProgress(false); setSelectedTask(null); }}
          onUpdated={fetchTasks}
        />
      )}
      {showLogs && selectedTask && (
        <LogsModal
          task={selectedTask} logs={logs} loading={logsLoading}
          canAddLog={isEmployee && !!myAssigneeEntry(selectedTask)}
          onClose={() => { setShowLogs(false); setSelectedTask(null); }}
          onLogAdded={() => { openLogs(selectedTask); fetchTasks(); }}
        />
      )}

      {/* ── Personal task modals ──────────────────────────────────────────────── */}
      {showPersonalCreate && (
        <PersonalTaskModal
          onClose={() => setShowPersonalCreate(false)}
          onSaved={fetchPersonalTasks}
        />
      )}
      {showPersonalUpdate && selectedPersonalTask && (
        <PersonalTaskModal
          task={selectedPersonalTask}
          onClose={() => { setShowPersonalUpdate(false); setSelectedPersonalTask(null); }}
          onSaved={fetchPersonalTasks}
        />
      )}
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({
  task, isAdmin, isSuperAdmin, isEmployee, currentUserId, myEntry,
  department, onUpdate, onDelete, onViewLogs, onMyProgress,
}) {
  const [expanded, setExpanded] = useState(false);
  const assigneeCount = task.assignees?.length ?? 0;

  return (
    <div className="task-card">
      {/* Left stripe uses overall status */}
      <div className={`task-card-stripe stripe-${task.overallStatus?.toLowerCase().replace(/_/g, "-")}`} />

      <div className="task-card-header">
        <div className="task-card-badges">
          <span className={`badge ${statusColors[task.overallStatus]}`}>
            {task.overallStatus?.replace(/_/g, " ")}
          </span>
          <span className={`pri ${priorityColors[task.priority]}`}>{task.priority}</span>
        </div>
        <div className="task-card-actions">
          <button className="icon-btn" title="View Logs" onClick={onViewLogs}><HiClipboardList size={15} /></button>
          {isAdmin && (
            <button className="icon-btn" title="Edit Task" onClick={onUpdate}><HiPencil size={15} /></button>
          )}
          {isEmployee && myEntry && (
            <button className="icon-btn" title="Update My Progress" onClick={onMyProgress}><HiPencil size={15} /></button>
          )}
          {isAdmin && (
            <button className="icon-btn danger" title="Delete" onClick={onDelete}><HiTrash size={15} /></button>
          )}
        </div>
      </div>

      <h3 className="task-card-title">{task.title}</h3>
      {task.description && <p className="task-card-desc">{task.description}</p>}

      {/* ── Overall Progress ── */}
      <div className="task-progress-wrap">
        <div className="progress-label">
          <span className="text-muted text-sm">Overall Progress</span>
          <span className="text-sm font-medium">{task.overallProgress}%</span>
        </div>
        <div className="progress-bar">
          <div
            className={`progress-fill ${progressFillClass(task.overallProgress)}`}
            style={{ width: `${task.overallProgress}%` }}
          />
        </div>
      </div>

      {/* ── Per-Assignee Rows ── */}
      {assigneeCount > 0 && (
        <div style={{ marginTop: 10 }}>
          <button
            onClick={() => setExpanded((p) => !p)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-3)", fontSize: 12, fontWeight: 600, padding: "2px 0",
            }}
          >
            <HiUsers size={13} />
            {assigneeCount} assignee{assigneeCount !== 1 ? "s" : ""}
            {expanded ? <HiChevronUp size={12} /> : <HiChevronDown size={12} />}
          </button>

          {expanded && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
              {task.assignees.map((a, i) => {
                const empId = a.user?._id || a.user;
                const empName = a.user?.name || "Employee";
                const isMe = isEmployee && empId === currentUserId;
                return (
                  <div key={i} style={{
                    background: isMe ? "var(--accent-bg, rgba(99,102,241,.06))" : "var(--bg2)",
                    border: `1px solid ${isMe ? "var(--accent-bg2, rgba(99,102,241,.18))" : "var(--border)"}`,
                    borderRadius: 8, padding: "8px 10px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
                        <span style={{
                          width: 7, height: 7, borderRadius: "50%",
                          background: statusDot[a.status] || "#888",
                          display: "inline-block", flexShrink: 0,
                        }} />
                        {empName}
                        {isMe && <span style={{ fontSize: 10, color: "var(--accent-text, #6366f1)", fontWeight: 700 }}>(you)</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className={`badge ${statusColors[a.status]}`} style={{ fontSize: 10, padding: "1px 6px" }}>
                          {a.status?.replace(/_/g, " ")}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600 }}>{a.progress}%</span>
                      </div>
                    </div>
                    <div className="progress-bar" style={{ height: 4 }}>
                      <div
                        className={`progress-fill ${progressFillClass(a.progress)}`}
                        style={{ width: `${a.progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="task-card-footer">
        <div />
        <div className="text-sm text-muted" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <HiCalendarDays size={13} />
          {task.deadline ? new Date(task.deadline).toLocaleDateString() : "No deadline"}
        </div>
      </div>

      {/* Admin meta */}
      {isAdmin && (
        <div className="task-card-meta">
          {department ? (
            <span className="dept-chip"><HiBuildingOffice2 size={12} /> {department.name}</span>
          ) : (
            <span className="dept-chip dept-chip-none"><HiBuildingOffice2 size={12} /> No department</span>
          )}
          {task.assignees?.length > 0 && (
            <div className="task-assigned-to text-sm text-muted">
              <HiUser size={13} /> {task.assignees.map((a) => a.user?.name || "?").join(", ")}
            </div>
          )}
          {isSuperAdmin && task.assignedBy?.name && (
            <div className="task-assigned-by text-sm text-muted">
              <HiShieldCheck size={13} /> Assigned by: {task.assignedBy.name}
            </div>
          )}
        </div>
      )}

      {/* Employee meta */}
      {isEmployee && task.assignedBy?.name && (
        <div className="task-assigned-by text-sm text-muted" style={{ marginTop: 8 }}>
          <HiUser size={13} /> Assigned by: {task.assignedBy.name}
        </div>
      )}
    </div>
  );
}

// ─── Personal Task Card ───────────────────────────────────────────────────────
function PersonalTaskCard({ task, onEdit, onDelete }) {
  return (
    <div className="task-card" style={{ borderLeft: "3px solid var(--primary, #6366f1)" }}>
      <div className="task-card-header">
        <div className="task-card-badges">
          <span className={`badge ${statusColors[task.status]}`}>
            {task.status?.replace(/_/g, " ")}
          </span>
          <span className={`pri ${priorityColors[task.priority]}`}>{task.priority}</span>
        </div>
        <div className="task-card-actions">
          <button className="icon-btn" title="Edit reminder" onClick={onEdit}>
            <HiPencil size={15} />
          </button>
          <button className="icon-btn danger" title="Delete reminder" onClick={onDelete}>
            <HiTrash size={15} />
          </button>
        </div>
      </div>

      <h3 className="task-card-title">{task.title}</h3>
      {task.description && <p className="task-card-desc">{task.description}</p>}

      <div className="task-progress-wrap">
        <div className="progress-label">
          <span className="text-muted text-sm">Progress</span>
          <span className="text-sm font-medium">{task.progress}%</span>
        </div>
        <div className="progress-bar">
          <div
            className={`progress-fill ${progressFillClass(task.progress)}`}
            style={{ width: `${task.progress}%` }}
          />
        </div>
      </div>

      <div className="task-card-footer">
        <span style={{ fontSize: 11, color: "var(--primary, #6366f1)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
          <HiBookmark size={11} /> Personal
        </span>
        <div className="text-sm text-muted" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <HiCalendarDays size={13} />
          {task.deadline ? new Date(task.deadline).toLocaleDateString() : "No deadline"}
        </div>
      </div>
    </div>
  );
}

// ─── Personal Task Modal (Create + Edit) ──────────────────────────────────────
function PersonalTaskModal({ task, onClose, onSaved }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "MEDIUM",
    deadline: task?.deadline ? task.deadline.split("T")[0] : "",
    status: task?.status || "PENDING",
    progress: task?.progress ?? 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      if (isEdit) {
        await api.put(`/personal-tasks/${task._id}`, form);
      } else {
        await api.post("/personal-tasks", form);
      }
      onSaved(); onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Error saving reminder");
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? "Edit Reminder" : "New Personal Reminder"}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label>Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="What do you need to do?"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Any notes..."
              rows={2}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {statusOptions.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {priorityOptions.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Progress: {form.progress}%</label>
            <input
              type="range" min={0} max={100} value={form.progress}
              onChange={(e) => setForm({ ...form, progress: +e.target.value })}
            />
            <div className="progress-bar" style={{ marginTop: 6 }}>
              <div
                className={`progress-fill ${progressFillClass(form.progress)}`}
                style={{ width: `${form.progress}%` }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Deadline</label>
            <input
              type="date" value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : isEdit ? "Save Changes" : "Create Reminder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Checkbox Employee Picker ──────────────────────────────────────────────────
function EmployeePicker({ employees, departments, selected, onChange }) {
  const [deptFilter, setDeptFilter] = useState("");
  const visible = deptFilter
    ? employees.filter((e) => {
      const dept = departments.find((d) => d._id === deptFilter);
      return dept?.members?.some((m) => (m._id || m) === e._id);
    })
    : employees;

  const toggle = (id) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div>
      <select
        value={deptFilter}
        onChange={(e) => setDeptFilter(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      >
        <option value="">All employees</option>
        {departments.map((d) => (
          <option key={d._id} value={d._id}>{d.name} ({d.members?.length || 0})</option>
        ))}
      </select>

      <div style={{
        border: "1px solid var(--border)", borderRadius: 8,
        maxHeight: 170, overflowY: "auto", padding: "4px 0",
      }}>
        {visible.length === 0 ? (
          <p style={{ padding: "8px 12px", fontSize: 12, color: "var(--text-3)" }}>No employees</p>
        ) : visible.map((u) => {
          const checked = selected.includes(u._id);
          return (
            <label key={u._id} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "6px 12px",
              cursor: "pointer",
              background: checked ? "var(--accent-bg, rgba(99,102,241,.07))" : "transparent",
              transition: "background .12s",
            }}>
              <input
                type="checkbox" checked={checked} onChange={() => toggle(u._id)}
                style={{ accentColor: "var(--primary)", width: 14, height: 14 }}
              />
              <span style={{ fontSize: 13 }}>
                {u.name} <span style={{ color: "var(--text-3)" }}>({u.email})</span>
              </span>
            </label>
          );
        })}
      </div>
      <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 5 }}>
        {selected.length} employee{selected.length !== 1 ? "s" : ""} selected
      </p>
    </div>
  );
}

// ─── Create Task Modal ─────────────────────────────────────────────────────────
function CreateTaskModal({ employees, departments, onClose, onCreated }) {
  const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM", deadline: "" });
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selected.length === 0) { setError("Please select at least one employee"); return; }
    setLoading(true); setError("");
    try {
      await api.post("/tasks", { ...form, assignedTo: selected });
      onCreated(); onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Error creating task");
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Task</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label>Title *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Task title" required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Task description" rows={2} />
          </div>
          <div className="form-group">
            <label>Assign To * <span style={{ fontWeight: 400, fontSize: 12, color: "var(--text-3)" }}>(select one or more)</span></label>
            <EmployeePicker employees={employees} departments={departments} selected={selected} onChange={setSelected} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {priorityOptions.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Deadline</label>
              <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Update Task Modal (Admin) ─────────────────────────────────────────────────
function UpdateTaskModal({ task, departments, employees, onClose, onUpdated }) {
  const existingIds = task.assignees?.map((a) => a.user?._id || a.user) || [];

  const [form, setForm] = useState({
    title: task.title,
    description: task.description || "",
    overallStatus: task.overallStatus,
    overallProgress: task.overallProgress,
    priority: task.priority,
    deadline: task.deadline ? task.deadline.split("T")[0] : "",
  });
  const [selected, setSelected] = useState(existingIds);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selected.length === 0) { setError("Please select at least one employee"); return; }
    setLoading(true); setError("");
    try {
      await api.put(`/tasks/${task._id}`, { ...form, assignedTo: selected });
      onUpdated(); onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Error updating task");
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Task</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>

          <div className="form-group">
            <label>Assignees <span style={{ fontWeight: 400, fontSize: 12, color: "var(--text-3)" }}>(existing progress is preserved)</span></label>
            <EmployeePicker employees={employees} departments={departments} selected={selected} onChange={setSelected} />
          </div>

          {/* Overall fields */}
          <div style={{
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: 10, padding: "14px 14px 10px", marginBottom: 14,
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".04em" }}>
              Overall Task Status
            </p>
            <div className="form-row">
              <div className="form-group">
                <label>Overall Status</label>
                <select value={form.overallStatus} onChange={(e) => setForm({ ...form, overallStatus: e.target.value })}>
                  {statusOptions.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Overall Progress: {form.overallProgress}%</label>
                <input type="range" min={0} max={100} value={form.overallProgress}
                  onChange={(e) => setForm({ ...form, overallProgress: +e.target.value })} />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {priorityOptions.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Deadline</label>
              <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── My Progress Modal (Employee) ─────────────────────────────────────────────
// function MyProgressModal({ task, currentUserId, onClose, onUpdated }) {
//   const myEntry = task.assignees?.find((a) => (a.user?._id || a.user) === currentUserId);
//   const [form, setForm] = useState({
//     status:   myEntry?.status   || "PENDING",
//     progress: myEntry?.progress ?? 0,
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError]     = useState("");

//   const getMyEntry = () =>
//   task.assignees?.find(
//     (a) => (a.user?._id || a.user) === currentUserId
//   );

//   useEffect(() => {
//   const entry = getMyEntry();

//   setForm({
//     status: entry?.status || "PENDING",
//     progress: entry?.progress ?? 0,
//   });
// }, [task]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true); setError("");
//     try {
//       await api.patch(`/tasks/${task._id}/my-progress`, form);
//       onUpdated(); onClose();
//     } catch (err) {
//       setError(err.response?.data?.message || "Error updating progress");
//     } finally { setLoading(false); }
//   };

//   return (
//     <div className="modal-overlay" onClick={onClose}>
//       <div className="modal" onClick={(e) => e.stopPropagation()}>
//         <div className="modal-header">
//           <h2>My Progress<span className="modal-subtitle"> — {task.title}</span></h2>
//           <button className="modal-close" onClick={onClose}>✕</button>
//         </div>
//         <form onSubmit={handleSubmit}>
//           {error && <div className="alert alert-error">{error}</div>}

//           <div className="form-group">
//             <label>My Status</label>
//             <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
//               {statusOptions.map((s) => <option key={s}>{s}</option>)}
//             </select>
//           </div>
//           <div className="form-group">
//             <label>My Progress: {form.progress}%</label>
//             <input type="range" min={0} max={100} value={form.progress}
//               onChange={(e) => setForm({ ...form, progress: +e.target.value })} />
//             <div className="progress-bar" style={{ marginTop: 6 }}>
//               <div className={`progress-fill ${progressFillClass(form.progress)}`} style={{ width: `${form.progress}%` }} />
//             </div>
//           </div>

//           {/* Show other assignees (read-only) */}
//           {task.assignees?.length > 1 && (
//             <div style={{ marginBottom: 16 }}>
//               <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".04em" }}>
//                 Other Assignees
//               </p>
//               <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
//                 {task.assignees
//                   .filter((a) => (a.user?._id || a.user) !== currentUserId)
//                   .map((a, i) => (
//                     <div key={i} style={{
//                       background: "var(--bg2)", border: "1px solid var(--border)",
//                       borderRadius: 8, padding: "7px 10px",
//                     }}>
//                       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
//                         <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
//                           {a.user?.name || "Employee"}
//                         </span>
//                         <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
//                           <span className={`badge ${statusColors[a.status]}`} style={{ fontSize: 10, padding: "1px 6px" }}>
//                             {a.status?.replace(/_/g, " ")}
//                           </span>
//                           <span style={{ fontSize: 11, color: "var(--text-3)" }}>{a.progress}%</span>
//                         </div>
//                       </div>
//                       <div className="progress-bar" style={{ height: 4 }}>
//                         <div className={`progress-fill ${progressFillClass(a.progress)}`} style={{ width: `${a.progress}%` }} />
//                       </div>
//                     </div>
//                   ))}
//               </div>
//             </div>
//           )}

//           <div className="modal-footer">
//             <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
//             <button type="submit" className="btn btn-primary" disabled={loading}>
//               {loading ? <span className="spinner" /> : "Save My Progress"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
function MyProgressModal({ task, currentUserId, onClose, onUpdated }) {
  const myEntry = task.assignees?.find((a) => (a.user?._id || a.user) === currentUserId);

  const [form, setForm] = useState({
    status: myEntry?.status || "PENDING",
    progress: myEntry?.progress ?? 0,
    note: "",                                    // ← ADD
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // BUG FIX: was calling getMyEntry() (local fn) inside useEffect;
  // just use the prop directly and reset note on task change
  useEffect(() => {
    const entry = task.assignees?.find((a) => (a.user?._id || a.user) === currentUserId);
    setForm({
      status: entry?.status || "PENDING",
      progress: entry?.progress ?? 0,
      note: "",                                  // ← reset note on task change
    });
  }, [task, currentUserId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await api.patch(`/tasks/${task._id}/my-progress`, form); // note goes in body automatically
      onUpdated(); onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Error updating progress");
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>My Progress<span className="modal-subtitle"> — {task.title}</span></h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label>My Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {statusOptions.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>My Progress: {form.progress}%</label>
            <input type="range" min={0} max={100} value={form.progress}
              onChange={(e) => setForm({ ...form, progress: +e.target.value })} />
            <div className="progress-bar" style={{ marginTop: 6 }}>
              <div className={`progress-fill ${progressFillClass(form.progress)}`}
                style={{ width: `${form.progress}%` }} />
            </div>
          </div>

          {/* ── ADD: Optional work note ───────────────────────────────── */}
          <div className="form-group">
            <label>
              Work Note <span style={{ fontWeight: 400, fontSize: 12, color: "var(--text-3)" }}>(optional)</span>
            </label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Describe what you worked on, any blockers, or notes for the team…"
              rows={3}
            />
          </div>
          {/* ─────────────────────────────────────────────────────────── */}

          {/* Show other assignees (read-only) — unchanged */}
          {task.assignees?.length > 1 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".04em" }}>
                Other Assignees
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {task.assignees
                  .filter((a) => (a.user?._id || a.user) !== currentUserId)
                  .map((a, i) => (
                    <div key={i} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{a.user?.name || "Employee"}</span>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span className={`badge ${statusColors[a.status]}`} style={{ fontSize: 10, padding: "1px 6px" }}>
                            {a.status?.replace(/_/g, " ")}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--text-3)" }}>{a.progress}%</span>
                        </div>
                      </div>
                      <div className="progress-bar" style={{ height: 4 }}>
                        <div className={`progress-fill ${progressFillClass(a.progress)}`} style={{ width: `${a.progress}%` }} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : "Save My Progress"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Logs Modal ────────────────────────────────────────────────────────────────
// function LogsModal({ task, logs, loading, canAddLog, onClose, onLogAdded }) {
//   const [logForm, setLogForm] = useState({ message: "", progress: 0, status: "IN_PROGRESS", taskId: task._id });
//   const [submitting, setSubmitting] = useState(false);

//   // const handleAddLog = async (e) => {
//   //   e.preventDefault();
//   //   setSubmitting(true);
//   //   try {
//   //     await api.post("/logs", logForm);
//   //     setLogForm((p) => ({ ...p, message: "" }));
//   //     onLogAdded();
//   //   } catch (err) {
//   //     alert(err.response?.data?.message || "Error adding log");
//   //   } finally { setSubmitting(false); }
//   // };

//   return (
//     <div className="modal-overlay" onClick={onClose}>
//       <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
//         <div className="modal-header">
//           <h2>Task Logs<span className="modal-subtitle"> — {task.title}</span></h2>
//           <button className="modal-close" onClick={onClose}>✕</button>
//         </div>

//         {/* {canAddLog ? (
//           <form className="log-form">
//             {/* <div className="form-group">
//               <label>Add Update</label>
//               <textarea value={logForm.message} onChange={(e) => setLogForm({ ...logForm, message: e.target.value })}
//                 placeholder="What did you work on?" rows={2} required />
//             </div> */}
//         {/* <div className="form-row">
//                <div className="form-group">
//                 <label>Progress: {logForm.progress}%</label>
//                 <input type="range" min={0} max={100} value={logForm.progress}
//                   onChange={(e) => setLogForm({ ...logForm, progress: +e.target.value })} />
//               </div> 
//               <div className="form-group">
//                 <label>Status</label>
//                 <select value={logForm.status} onChange={(e) => setLogForm({ ...logForm, status: e.target.value })}>
//                   {statusOptions.map((s) => <option key={s}>{s}</option>)}
//                 </select>
//               </div>
//             </div> 
//             {/* <button type="submit" className="btn btn-primary" disabled={submitting}>
//               {submitting ? <span className="spinner" /> : "Add Log Entry"}
//             </button>
//           </form> 
//         ) : (
//           <div className="logs-readonly-notice">
//             📋 Viewing logs as read-only. Only an assigned employee can add log entries.
//           </div>
//         )}

//         <div className="logs-divider" /> */}

//         <div className="logs-list">
//           {loading ? (
//             <div className="loading-center"><span className="spinner" /></div>
//           ) : logs.length === 0 ? (
//             <p className="empty-msg">No log entries yet</p>
//           ) : logs.map((log) => (
//             <div key={log._id} className="log-entry">
//               <div className="log-meta">
//                 <span className="log-author" style={{ display: "flex", alignItems: "center", gap: 4 }}>
//                   <HiUser size={13} /> {log.userId?.name || "Unknown"}
//                 </span>
//                 <span className="log-time">{new Date(log.createdAt).toLocaleString()}</span>
//               </div>
//               <p className="log-message">{log.message}</p>

//               {log.note && (
//                 <p style={{
//                   margin: "6px 0 0",
//                   padding: "8px 10px",
//                   background: "var(--bg2)",
//                   border: "1px solid var(--border)",
//                   borderRadius: 6,
//                   fontSize: 13,
//                   color: "var(--text)",
//                   fontStyle: "italic",
//                   lineHeight: 1.5,
//                 }}>
//                   💬 {log.note}
//                 </p>
//               )}
//               <div className="log-badges">
//                 {log.status && (
//                   <span className={`badge ${statusColors[log.status]}`}>{log.status.replace(/_/g, " ")}</span>
//                 )}
//                 {log.progress !== undefined && (
//                   <span className="text-sm text-muted">Progress: {log.progress}%</span>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
function LogsModal({ task, logs, loading, canAddLog, onClose, onLogAdded }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Task Logs<span className="modal-subtitle"> — {task.title}</span></h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="logs-list">
          {loading ? (
            <div className="loading-center"><span className="spinner" /></div>
          ) : logs.length === 0 ? (
            <p className="empty-msg">No log entries yet</p>
          ) : logs.map((log) => (
            <div key={log._id} className="log-entry">
              <div className="log-meta">
                <span className="log-author" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <HiUser size={13} /> {log.userId?.name || "Unknown"}
                </span>
                <span className="log-time">{new Date(log.createdAt).toLocaleString()}</span>
              </div>

              <p className="log-message">{log.message}</p>

              {log.note && (
                <p style={{
                  margin: "6px 0 0",
                  padding: "8px 10px",
                  background: "var(--bg2)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "var(--text)",
                  fontStyle: "italic",
                  lineHeight: 1.5,
                }}>
                  💬 {log.note}
                </p>
              )}

              <div className="log-badges">
                {log.status && (
                  <span className={`badge ${statusColors[log.status]}`}>{log.status.replace(/_/g, " ")}</span>
                )}
                {log.progress !== undefined && (
                  <span className="text-sm text-muted">Progress: {log.progress}%</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}