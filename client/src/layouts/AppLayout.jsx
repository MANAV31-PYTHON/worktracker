import { NavLink, Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { useState } from "react";
import {
  LayoutDashboard, ClipboardList, Users, Building2,
  Bell, LogOut, Menu, ChevronRight, Zap, Clock3, Shield,
} from "lucide-react";

const NAV = [
  { path:"/dashboard",     label:"Dashboard",     Icon:LayoutDashboard, roles:["SUPER_ADMIN","ADMIN","EMPLOYEE"] },
  { path:"/tasks",         label:"Tasks",          Icon:ClipboardList,   roles:["SUPER_ADMIN","ADMIN","EMPLOYEE"] },
  { path:"/users",         label:"Users",          Icon:Users,           roles:["SUPER_ADMIN","ADMIN"] },
  { path:"/departments",   label:"Departments",    Icon:Building2,       roles:["SUPER_ADMIN","ADMIN"] },
  { path:"/notifications", label:"Notifications",  Icon:Bell,            roles:["SUPER_ADMIN","ADMIN","EMPLOYEE"] },
  { path:"/attendance",    label:"Attendance",     Icon:Clock3,          roles:["SUPER_ADMIN","ADMIN","EMPLOYEE"] },
  { path:"/admin-panel",   label:"Admin Panel",    Icon:Shield,          roles:["SUPER_ADMIN"] },
];

const PAGE_TITLES = {
  "/dashboard":"/Dashboard", "/tasks":"/Tasks", "/users":"/Users",
  "/departments":"/Departments", "/notifications":"/Notifications", "/attendance":"/Attendance",
  "/admin-panel":"/Admin Panel",
};

const ROLE_COLORS = {
  SUPER_ADMIN: { bg:"#f5f3ff", color:"#7c3aed" },
  ADMIN:       { bg:"#eff4ff", color:"#2563eb" },
  EMPLOYEE:    { bg:"#ecfdf5", color:"#059669" },
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;

  const role      = user?.role ?? "";
  const roleLabel = role.replace(/_/g, " ");
  const roleStyle = ROLE_COLORS[role] || ROLE_COLORS.EMPLOYEE;
  const visibleNav = NAV.filter((n) => {
    if (!n.roles.includes(role)) return false;
    if (n.path === "/admin-panel") return Boolean(user?.isPlatformOwner);
    return true;
  });
  const crumb     = PAGE_TITLES[location.pathname] || "";

  return (
    <div className={`app-layout ${open ? "sidebar-open" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">
            <Zap size={17} color="white" strokeWidth={2.5} />
          </div>
          <span className="brand-name">BOMEGROW</span>
        </div>

        <p className="sidebar-section-label">Navigation</p>

        <nav className="sidebar-nav">
          {visibleNav.map(({ path, label, Icon }) => (
            <NavLink
              key={path} to={path}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              onClick={() => setOpen(false)}
            >
              <div className="nav-icon-box">
                <Icon size={16} strokeWidth={2} />
              </div>
              <span className="nav-label">{label}</span>
              {path === "/notifications" && unreadCount > 0 && (
                <span className="nav-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar" style={{ background: roleStyle.bg, color: roleStyle.color, borderColor: `${roleStyle.color}30` }}>
              {user.name?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">{user.name ?? "—"}</p>
              <p className="sidebar-user-role">{roleLabel}</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ width:"100%", justifyContent:"center", gap:6 }} onClick={logout}>
            <LogOut size={14} strokeWidth={2} /> Sign out
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="hamburger" onClick={() => setOpen(!open)}>
              <Menu size={20} strokeWidth={2} />
            </button>
            <div className="topbar-breadcrumb">
              BOMEGROW
              {crumb && (
                <>
                  <ChevronRight size={13} color="var(--text-4)" strokeWidth={2} />
                  <span className="crumb-current">{crumb.slice(1)}</span>
                </>
              )}
            </div>
          </div>
          <div className="topbar-right">
            <div className="topbar-role-pill" style={{ background: roleStyle.bg, color: roleStyle.color, borderColor: `${roleStyle.color}20` }}>
              {roleLabel}
            </div>
            <NavLink to="/notifications" className="notif-btn">
              <Bell size={17} strokeWidth={2} />
              {unreadCount > 0 && (
                <span className="notif-count">{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </NavLink>
          </div>
        </header>

        <main className="content-area"><Outlet /></main>
      </div>

      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}
    </div>
  );
}
