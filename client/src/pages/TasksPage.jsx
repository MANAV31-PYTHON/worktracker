import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import socket from "../sockets/socket";
import { useDialog } from "../components/Dialog";
import { HiPlus, HiPencil, HiTrash, HiClipboardList } from "react-icons/hi";
import { HiBuildingOffice2, HiUser, HiShieldCheck, HiCalendarDays } from "react-icons/hi2";

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");

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
    // Departments needed for both filtering and the create modal
    api.get("/departments").then((res) => setDepartments(res.data)).catch(console.error);
    if (isAdmin) {
      api
        .get("/users")
        .then((res) => setEmployees(res.data.filter((u) => u.role === "EMPLOYEE")))
        .catch(console.error);
    }
  }, [fetchTasks, isAdmin]);

  useEffect(() => {
    const onAssigned = () => fetchTasks();
    const onUpdated  = () => fetchTasks();
    const onDeleted  = () => fetchTasks();
    socket.on("task_assigned", onAssigned);
    socket.on("task_updated",  onUpdated);
    socket.on("task_deleted",  onDeleted);
    return () => {
      socket.off("task_assigned", onAssigned);
      socket.off("task_updated",  onUpdated);
      socket.off("task_deleted",  onDeleted);
    };
  }, [fetchTasks]);

  const openLogs = async (task) => {
    setSelectedTask(task);
    setShowLogsModal(true);
    setLogsLoading(true);
    try {
      const res = await api.get(`/logs/${task._id}`);
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleDelete = async (taskId) => {
    const ok = await confirm({
      title: "Delete Task",
      message: "Are you sure you want to delete this task? This action cannot be undone.",
      icon: "🗑️",
      danger: true,
      confirmLabel: "Delete Task",
    });
    if (!ok) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchTasks();
    } catch (err) {
      await confirm({
        type: "alert",
        title: "Error",
        message: err.response?.data?.message || "Error deleting task",
        icon: "⚠️",
        danger: false,
        confirmLabel: "OK",
      });
    }
  };

  const canEmployeeEdit = (task) =>
    isEmployee && task.assignedTo?._id === user?._id;

  // Helper: find which department an employee belongs to
  const getDeptForEmployee = (employeeId) => {
    if (!employeeId) return null;
    return departments.find((d) =>
      d.members?.some((m) => (m._id || m) === employeeId)
    );
  };

  // Chain status + department filters
  const filtered = tasks
    .filter((t) => filter === "ALL" || t.status === filter)
    .filter((t) => {
      if (deptFilter === "ALL") return true;
      const assignedId = t.assignedTo?._id || t.assignedTo;
      const dept = departments.find((d) => d._id === deptFilter);
      return dept?.members?.some((m) => (m._id || m) === assignedId);
    });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p className="text-muted">
            {tasks.length} total task{tasks.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Department filter — only meaningful for admins */}
          {isAdmin && (
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

          {isAdmin && (
            <button
              className="btn btn-primary"
              style={{ gap: 6 }}
              onClick={() => setShowCreateModal(true)}
            >
              <HiPlus size={16} /> New Task
            </button>
          )}
        </div>
      </div>

      <div className="filter-bar">
        {["ALL", ...statusOptions].map((s) => (
          <button
            key={s}
            className={`filter-btn ${filter === s ? "active" : ""}`}
            onClick={() => setFilter(s)}
          >
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-center">
          <span className="spinner lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>No tasks found</p>
        </div>
      ) : (
        <div className="tasks-grid">
          {filtered.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              isAdmin={isAdmin}
              isSuperAdmin={isSuperAdmin}
              canEdit={isAdmin || canEmployeeEdit(task)}
              department={isAdmin ? getDeptForEmployee(task.assignedTo?._id || task.assignedTo) : null}
              onUpdate={() => {
                setSelectedTask(task);
                setShowUpdateModal(true);
              }}
              onDelete={() => handleDelete(task._id)}
              onViewLogs={() => openLogs(task)}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateTaskModal
          employees={employees}
          departments={departments}
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchTasks}
        />
      )}

      {showUpdateModal && selectedTask && (
        <UpdateTaskModal
          task={selectedTask}
          isAdmin={isAdmin}
          departments={departments}
          employees={employees}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedTask(null);
          }}
          onUpdated={fetchTasks}
        />
      )}

      {showLogsModal && selectedTask && (
        <LogsModal
          task={selectedTask}
          logs={logs}
          loading={logsLoading}
          canAddLog={isEmployee}
          onClose={() => {
            setShowLogsModal(false);
            setSelectedTask(null);
          }}
          onLogAdded={() => {
            openLogs(selectedTask);
            fetchTasks();
          }}
        />
      )}
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────
// • SUPER_ADMIN  → dept chip + assigned to + assigned by
// • ADMIN        → dept chip + assigned to
// • EMPLOYEE     → assigned by only
function TaskCard({ task, isAdmin, isSuperAdmin, canEdit, department, onUpdate, onDelete, onViewLogs }) {
  return (
    <div className="task-card">
      <div
        className={`task-card-stripe stripe-${task.status
          ?.toLowerCase()
          .replace(/_/g, "-")}`}
      />

      <div className="task-card-header">
        <div className="task-card-badges">
          <span className={`badge ${statusColors[task.status]}`}>
            {task.status?.replace(/_/g, " ")}
          </span>
          <span className={`pri ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
        </div>

        <div className="task-card-actions">
          <button className="icon-btn" title="View Logs" onClick={onViewLogs}>
            <HiClipboardList size={15} />
          </button>
          {canEdit && (
            <button className="icon-btn" title="Edit" onClick={onUpdate}>
              <HiPencil size={15} />
            </button>
          )}
          {isAdmin && (
            <button className="icon-btn danger" title="Delete" onClick={onDelete}>
              <HiTrash size={15} />
            </button>
          )}
        </div>
      </div>

      <h3 className="task-card-title">{task.title}</h3>
      {task.description && (
        <p className="task-card-desc">{task.description}</p>
      )}

      <div className="task-progress-wrap">
        <div className="progress-label">
          <span className="text-muted text-sm">Progress</span>
          <span className="text-sm font-medium">{task.progress}%</span>
        </div>
        <div className="progress-bar">
          <div
            className={`progress-fill ${
              task.progress === 100
                ? "fill-done"
                : task.progress > 50
                ? "fill-mid"
                : "fill-low"
            }`}
            style={{ width: `${task.progress}%` }}
          />
        </div>
      </div>

      <div className="task-card-footer">
        <div className="text-sm text-muted" />
        <div className="text-sm text-muted" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <HiCalendarDays size={13} />
          {task.deadline
            ? new Date(task.deadline).toLocaleDateString()
            : "No deadline"}
        </div>
      </div>

      {/* ── Admin / Super Admin info ── */}
      {isAdmin && (
        <div className="task-card-meta">
          {/* Department chip */}
          {department ? (
            <span className="dept-chip"><HiBuildingOffice2 size={12} /> {department.name}</span>
          ) : (
            <span className="dept-chip dept-chip-none"><HiBuildingOffice2 size={12} /> No department</span>
          )}

          {/* Assigned to */}
          {task.assignedTo?.name && (
            <div className="task-assigned-to text-sm text-muted">
              <HiUser size={13} /> Assigned to: {task.assignedTo.name}
            </div>
          )}

          {/* Assigned by — Super Admin only */}
          {isSuperAdmin && task.assignedBy?.name && (
            <div className="task-assigned-by text-sm text-muted">
              <HiShieldCheck size={13} /> Assigned by: {task.assignedBy.name}
            </div>
          )}
        </div>
      )}

      {/* ── Employee info: who assigned the task ── */}
      {!isAdmin && task.assignedBy?.name && (
        <div className="task-assigned-by text-sm text-muted">
          <HiUser size={13} /> Assigned by: {task.assignedBy.name}
        </div>
      )}
    </div>
  );
}

// ─── Create Task Modal ────────────────────────────────────────────────────────
function CreateTaskModal({ employees, departments, onClose, onCreated }) {
  const [selectedDept, setSelectedDept] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "MEDIUM",
    deadline: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filter employees by selected department
  const filteredEmployees = selectedDept
    ? employees.filter((e) => {
        const dept = departments.find((d) => d._id === selectedDept);
        return dept?.members?.some((m) => (m._id || m) === e._id);
      })
    : employees;

  const handleDeptChange = (deptId) => {
    setSelectedDept(deptId);
    setForm((prev) => ({ ...prev, assignedTo: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/tasks", form);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Error creating task");
    } finally {
      setLoading(false);
    }
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
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Task title"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Task description"
              rows={2}
            />
          </div>

          <div className="form-group">
            <label>Filter by Department</label>
            <select
              value={selectedDept}
              onChange={(e) => handleDeptChange(e.target.value)}
            >
              <option value="">All employees</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.members?.length || 0} members)
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Assign To *</label>
              <select
                value={form.assignedTo}
                onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                required
              >
                <option value="">
                  {filteredEmployees.length === 0 && selectedDept
                    ? "No employees in this department"
                    : "Select employee"}
                </option>
                {filteredEmployees.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                {priorityOptions.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Deadline</label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Update Task Modal ────────────────────────────────────────────────────────
function UpdateTaskModal({ task, isAdmin, departments, employees, onClose, onUpdated }) {
  const assignedId = task.assignedTo?._id || task.assignedTo || "";

  // Pre-select the dept the current assignee belongs to
  const currentDept = departments?.find((d) =>
    d.members?.some((m) => (m._id || m) === assignedId)
  );

  const [selectedDept, setSelectedDept] = useState(currentDept?._id || "");
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || "",
    status: task.status,
    priority: task.priority,
    progress: task.progress,
    deadline: task.deadline ? task.deadline.split("T")[0] : "",
    assignedTo: assignedId,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filter employees by selected dept, or show all
  const filteredEmployees = selectedDept
    ? (employees || []).filter((e) => {
        const dept = departments.find((d) => d._id === selectedDept);
        return dept?.members?.some((m) => (m._id || m) === e._id);
      })
    : (employees || []);

  const handleDeptChange = (deptId) => {
    setSelectedDept(deptId);
    setForm((prev) => ({ ...prev, assignedTo: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.put(`/tasks/${task._id}`, form);
      onUpdated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Error updating task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isAdmin ? "Edit Task" : "Update My Progress"}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          {isAdmin && (
            <>
              <div className="form-group">
                <label>Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Department</label>
                <select
                  value={selectedDept}
                  onChange={(e) => handleDeptChange(e.target.value)}
                >
                  <option value="">All employees</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.members?.length || 0} members)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Assigned To</label>
                <select
                  value={form.assignedTo}
                  onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                  required
                >
                  <option value="">
                    {filteredEmployees.length === 0 && selectedDept
                      ? "No employees in this department"
                      : "Select employee"}
                  </option>
                  {filteredEmployees.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className={isAdmin ? "form-row" : ""}>
            <div className="form-group">
              <label>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {statusOptions.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            {isAdmin && (
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.value })
                  }
                >
                  {priorityOptions.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {!isAdmin && (
            <div className="form-group">
              <label>Progress: {form.progress}%</label>
              <input
                type="range"
                min={0}
                max={100}
                value={form.progress}
                onChange={(e) =>
                  setForm({ ...form, progress: +e.target.value })
                }
              />
            </div>
          )}

          {isAdmin && (
            <div className="form-group">
              <label>Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) =>
                  setForm({ ...form, deadline: e.target.value })
                }
              />
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <span className="spinner" />
              ) : isAdmin ? (
                "Save Changes"
              ) : (
                "Update Progress"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Logs Modal ───────────────────────────────────────────────────────────────
function LogsModal({ task, logs, loading, canAddLog, onClose, onLogAdded }) {
  const [logForm, setLogForm] = useState({
    message: "",
    progress: task.progress,
    status: task.status,
    taskId: task._id,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleAddLog = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/logs", logForm);
      setLogForm((prev) => ({ ...prev, message: "" }));
      onLogAdded();
    } catch (err) {
      alert(err.response?.data?.message || "Error adding log");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            Task Logs
            <span className="modal-subtitle"> — {task.title}</span>
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {canAddLog ? (
          <form onSubmit={handleAddLog} className="log-form">
            <div className="form-group">
              <label>Add Update</label>
              <textarea
                value={logForm.message}
                onChange={(e) =>
                  setLogForm({ ...logForm, message: e.target.value })
                }
                placeholder="What did you work on?"
                rows={2}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Progress: {logForm.progress}%</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={logForm.progress}
                  onChange={(e) =>
                    setLogForm({ ...logForm, progress: +e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={logForm.status}
                  onChange={(e) =>
                    setLogForm({ ...logForm, status: e.target.value })
                  }
                >
                  {statusOptions.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? <span className="spinner" /> : "Add Log Entry"}
            </button>
          </form>
        ) : (
          <div className="logs-readonly-notice">
            📋 Viewing logs as read-only. Only the assigned employee can add log
            entries.
          </div>
        )}

        <div className="logs-divider" />

        <div className="logs-list">
          {loading ? (
            <div className="loading-center">
              <span className="spinner" />
            </div>
          ) : logs.length === 0 ? (
            <p className="empty-msg">No log entries yet</p>
          ) : (
            logs.map((log) => (
              <div key={log._id} className="log-entry">
                <div className="log-meta">
                  <span className="log-author" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <HiUser size={13} /> {log.userId?.name || "Unknown"}
                  </span>
                  <span className="log-time">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="log-message">{log.message}</p>
                <div className="log-badges">
                  {log.status && (
                    <span className={`badge ${statusColors[log.status]}`}>
                      {log.status.replace(/_/g, " ")}
                    </span>
                  )}
                  {log.progress !== undefined && (
                    <span className="text-sm text-muted">
                      Progress: {log.progress}%
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}