import { BellRing, RotateCcw, Trash2, CheckCheck, PackageOpen } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";

const TYPE_CONFIG = {
  task_assigned:  { label: "Task Assigned",  cls: "notif-icon-assigned" },
  task_updated:   { label: "Task Updated",   cls: "notif-icon-updated"  },
  task_completed: { label: "Task Completed", cls: "notif-icon-updated"  },
  task_deleted:   { label: "Task Deleted",   cls: "notif-icon-deleted"  },
};

const TYPE_ICONS = {
  task_assigned:  <BellRing  size={18} strokeWidth={2} />,
  task_updated:   <RotateCcw size={18} strokeWidth={2} />,
  task_completed: <CheckCheck size={18} strokeWidth={2} />,
  task_deleted:   <Trash2    size={18} strokeWidth={2} />,
};

export default function NotificationsPage() {
  const { notifications, markAllRead, markOneAsRead, clearAll } = useNotifications();

  const unread = notifications.filter((n) => !n.isRead).length;  // ← isRead not read

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <div className="page-subtitle">
            <span className="dot" />
            {notifications.length} total · {unread} unread
          </div>
        </div>
        <div className="btn-group">
          {unread > 0 && (
            <button className="btn btn-ghost" style={{ gap: 6 }} onClick={markAllRead}>
              <CheckCheck size={15} strokeWidth={2} /> Mark all read
            </button>
          )}
          <button className="btn btn-danger" style={{ gap: 6 }} onClick={clearAll}>
            <Trash2 size={15} strokeWidth={2} /> Clear all
          </button>
        </div>
      </div>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><PackageOpen size={44} strokeWidth={1.5} /></div>
            <p>No notifications yet</p>
            <p className="text-muted text-sm">Real-time task updates will appear here</p>
          </div>
        ) : (
          notifications.map((n) => {
            const cfg = TYPE_CONFIG[n.type] || { label: n.type, cls: "notif-icon-updated" };
            return (
              <div
                key={n._id}                                    // ← _id not id
                className={`notif-card ${!n.isRead ? "unread" : ""}`}  // ← isRead not read
                onClick={() => !n.isRead && markOneAsRead(n._id)}
                style={{ cursor: !n.isRead ? "pointer" : "default" }}
              >
                <div className={`notif-icon-box ${cfg.cls}`}>
                  {TYPE_ICONS[n.type] || <BellRing size={18} strokeWidth={2} />}
                </div>
                <div className="notif-body">
                  <p className="notif-type">{cfg.label}</p>
                  <p className="notif-message">{n.message}</p>
                </div>
                <div className="notif-time">
                  {new Date(n.createdAt).toLocaleString()}     {/* ← createdAt not time */}
                </div>
                {!n.isRead && <span className="unread-dot" />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}