import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from "recharts";
import { ClipboardList, Zap, CheckCircle2, Clock, Ban } from "lucide-react";

const STATUS_COLORS = {
  PENDING:     "#f59e0b",
  IN_PROGRESS: "#2563eb",
  COMPLETED:   "#059669",
  BLOCKED:     "#dc2626",
};
const PIE_COLORS = ["#f59e0b","#2563eb","#059669","#dc2626"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:p.color, flexShrink:0 }} />
          <span className="val">{p.value}</span>
          <span style={{ fontSize:11, color:"var(--text-3)" }}>{p.name}</span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = ["ADMIN","SUPER_ADMIN"].includes(user?.role);

  const [allTasks, setAllTasks]   = useState([]);
  const [users, setUsers]         = useState([]);
  const [depts, setDepts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selectedDept, setSelectedDept] = useState("ALL"); // "ALL" or dept._id

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const reqs = [api.get("/tasks")];
        if (isAdmin) reqs.push(api.get("/users"), api.get("/departments"));
        const results = await Promise.all(reqs);
        setAllTasks(results[0].data);
        if (isAdmin) { setUsers(results[1].data); setDepts(results[2].data); }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [isAdmin]);

  // Build userId → deptIds map
  const userDeptMap = useMemo(() => {
    const map = {};
    depts.forEach(d => {
      d.members?.forEach(m => {
        const id = m._id || m;
        if (!map[id]) map[id] = [];
        map[id].push(d._id);
      });
    });
    return map;
  }, [depts]);

  // Filter tasks by selected department
  const tasks = useMemo(() => {
    if (selectedDept === "ALL" || !isAdmin) return allTasks;
    return allTasks.filter(t => {
      const assignedId = t.assignedTo?._id || t.assignedTo;
      return userDeptMap[assignedId]?.includes(selectedDept);
    });
  }, [allTasks, selectedDept, userDeptMap, isAdmin]);

  // Selected dept info
  const activeDept = depts.find(d => d._id === selectedDept);

  // Stats (all based on filtered tasks)
  const stats = useMemo(() => ({
    total:      tasks.length,
    pending:    tasks.filter(t => t.status === "PENDING").length,
    inProgress: tasks.filter(t => t.status === "IN_PROGRESS").length,
    completed:  tasks.filter(t => t.status === "COMPLETED").length,
    blocked:    tasks.filter(t => t.status === "BLOCKED").length,
  }), [tasks]);

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const avgProgress    = tasks.length > 0
    ? Math.round(tasks.reduce((s, t) => s + (t.progress || 0), 0) / tasks.length) : 0;

  const pieData = [
    { name:"Pending",     value: stats.pending    },
    { name:"In Progress", value: stats.inProgress },
    { name:"Completed",   value: stats.completed  },
    { name:"Blocked",     value: stats.blocked    },
  ].filter(d => d.value > 0);

  const priorityData = ["LOW","MEDIUM","HIGH"].map(p => ({
    priority: p,
    count: tasks.filter(t => t.priority === p).length,
  }));

  const deptData = depts.slice(0, 6).map(d => ({
    name: d.name.length > 12 ? d.name.slice(0,12)+"…" : d.name,
    members: d.members?.length || 0,
    tasks: allTasks.filter(t => {
      const id = t.assignedTo?._id || t.assignedTo;
      return userDeptMap[id]?.includes(d._id);
    }).length,
  }));

  const recentTasks = [...tasks]
    .sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt))
    .slice(0, 6);

  if (loading) {
    return <div className="page"><div className="loading-center"><span className="spinner lg"/></div></div>;
  }

  return (
    <div className="page">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <div className="page-subtitle">
            <span className="dot" />
            Welcome back, {user?.name} · Live data
            {selectedDept !== "ALL" && activeDept && (
              <span style={{
                marginLeft: 8, padding:"2px 10px",
                background:"var(--accent-bg)", color:"var(--accent-text)",
                borderRadius:20, fontSize:11, fontWeight:700,
                border:"1px solid var(--accent-bg2)"
              }}>
                🏢 {activeDept.name}
              </span>
            )}
          </div>
        </div>

        {/* Department filter — admin only */}
        {isAdmin && depts.length > 0 && (
          <div className="dept-filter-wrap">
            <label className="dept-filter-label">Filter by Department</label>
            <div className="dept-filter-pills">
              <button
                className={`dept-pill ${selectedDept === "ALL" ? "active" : ""}`}
                onClick={() => setSelectedDept("ALL")}
              >
                All
                <span className="dept-pill-count">{allTasks.length}</span>
              </button>
              {depts.map(d => {
                const deptTaskCount = allTasks.filter(t => {
                  const id = t.assignedTo?._id || t.assignedTo;
                  return userDeptMap[id]?.includes(d._id);
                }).length;
                return (
                  <button
                    key={d._id}
                    className={`dept-pill ${selectedDept === d._id ? "active" : ""}`}
                    onClick={() => setSelectedDept(d._id)}
                  >
                    {d.name}
                    <span className="dept-pill-count">{deptTaskCount}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="stats-grid stagger">
        {[
          { label:"Total Tasks",  value:stats.total,      icon:<ClipboardList size={20} strokeWidth={2}/>, color:"c-blue"   },
          { label:"In Progress",  value:stats.inProgress, icon:<Zap size={20} strokeWidth={2}/>, color:"c-purple" },
          { label:"Completed",    value:stats.completed,  icon:<CheckCircle2 size={20} strokeWidth={2}/>, color:"c-green"  },
          { label:"Pending",      value:stats.pending,    icon:<Clock size={20} strokeWidth={2}/>, color:"c-amber"  },
          { label:"Blocked",      value:stats.blocked,    icon:<Ban size={20} strokeWidth={2}/>, color:"c-red"    },
        ].map((s,i) => (
          <div key={i} className={`stat-card anim-fade-up ${s.color}`}>
            <div className={`stat-icon-wrap ${s.color}`}>{s.icon}</div>
            <div className="stat-body">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="dashboard-grid" style={{ marginBottom:20 }}>

        <div className="card anim-fade-up" style={{ animationDelay:"100ms" }}>
          <div className="card-header">
            <h3>Tasks by Priority</h3>
            <span className="card-header-meta">{stats.total} task{stats.total!==1?"s":""}</span>
          </div>
          {tasks.length === 0 ? (
            <div className="empty-state" style={{ padding:"40px 24px" }}>
              <div className="empty-icon">📊</div>
              <p>{selectedDept !== "ALL" ? "No tasks in this department" : "No task data yet"}</p>
            </div>
          ) : (
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={priorityData} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="priority" tick={{ fontSize:12, fill:"var(--text-3)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:12, fill:"var(--text-3)" }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill:"var(--bg3)" }} />
                  <Bar dataKey="count" name="Tasks" radius={[6,6,0,0]}>
                    {priorityData.map((_,i) => (
                      <Cell key={i} fill={["#10b981","#f59e0b","#ef4444"][i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display:"flex", gap:16, justifyContent:"center", marginTop:4, flexWrap:"wrap" }}>
                {["LOW","MEDIUM","HIGH"].map((p,i) => (
                  <div key={p} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"var(--text-3)" }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:["#10b981","#f59e0b","#ef4444"][i] }} />
                    {p} ({priorityData[i].count})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card anim-fade-up" style={{ animationDelay:"160ms" }}>
          <div className="card-header">
            <h3>Status Distribution</h3>
            <span className="card-header-meta">{completionRate}% complete</span>
          </div>
          {pieData.length === 0 ? (
            <div className="empty-state" style={{ padding:"40px 24px" }}>
              <div className="empty-icon">🥧</div>
              <p>{selectedDept !== "ALL" ? "No tasks in this department" : "No data yet"}</p>
            </div>
          ) : (
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="45%"
                    innerRadius={55} outerRadius={85}
                    paddingAngle={3} dataKey="value" strokeWidth={0}
                  >
                    {pieData.map((_,i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8}
                    formatter={v => <span style={{ fontSize:11, color:"var(--text-3)" }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ textAlign:"center", marginTop:-8 }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:"var(--text)" }}>
                  {completionRate}%
                </div>
                <div style={{ fontSize:11, color:"var(--text-3)" }}>completion rate</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent tasks + team overview */}
      <div className={isAdmin ? "dashboard-grid" : ""} style={{ marginBottom:20 }}>

        <div className="card anim-fade-up" style={{ animationDelay:"200ms" }}>
          <div className="card-header">
            <h3>
              Recent Tasks
              {selectedDept !== "ALL" && activeDept && (
                <span style={{ fontWeight:400, fontSize:12, color:"var(--text-3)", marginLeft:8 }}>
                  — {activeDept.name}
                </span>
              )}
            </h3>
            <a href="/tasks" style={{ fontSize:12, color:"var(--accent)", fontWeight:600 }}>View all →</a>
          </div>
          <div className="task-list">
            {recentTasks.length === 0 ? (
              <p className="empty-msg">
                {selectedDept !== "ALL" ? "No tasks in this department" : "No tasks yet"}
              </p>
            ) : recentTasks.map((task, i) => (
              <div key={task._id} className="task-row" style={{ animationDelay:`${i*40}ms` }}>
                <div style={{
                  width:4, height:36, borderRadius:2, flexShrink:0,
                  background: STATUS_COLORS[task.status] || "var(--border2)"
                }} />
                <div className="task-info">
                  <p className="task-title">{task.title}</p>
                  <p style={{ fontSize:11, color:"var(--text-4)", marginTop:2 }}>
                    {task.assignedTo?.name || "—"} · {task.deadline ? new Date(task.deadline).toLocaleDateString() : "No deadline"}
                  </p>
                </div>
                <div className="task-meta">
                  <span className={`badge badge-${task.status?.toLowerCase().replace(/_/g,"-")}`} style={{ fontSize:10 }}>
                    {task.status?.replace(/_/g," ")}
                  </span>
                  <div style={{
                    width:36, height:36, borderRadius:"50%",
                    background:`conic-gradient(${STATUS_COLORS[task.status]} ${task.progress*3.6}deg, var(--bg4) 0deg)`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                    <div style={{ width:26, height:26, borderRadius:"50%", background:"var(--bg2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:"var(--text-2)" }}>
                      {task.progress}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {isAdmin && (
          <div className="card anim-fade-up" style={{ animationDelay:"240ms" }}>
            <div className="card-header">
              <h3>Team Overview</h3>
              <span className="card-header-meta">{users.length} members</span>
            </div>
            <div className="card-body" style={{ paddingTop:8 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
                {[
                  { label:"Avg Progress", value:`${avgProgress}%`,                                  color:"var(--accent)"  },
                  { label:"Departments",  value:depts.length,                                        color:"var(--purple)"  },
                  { label:"Employees",    value:users.filter(u=>u.role==="EMPLOYEE").length,          color:"var(--green)"   },
                  { label:"Admins",       value:users.filter(u=>["ADMIN","SUPER_ADMIN"].includes(u.role)).length, color:"var(--amber)" },
                ].map((m,i) => (
                  <div key={i} style={{ background:"var(--bg3)", borderRadius:"var(--r-sm)", padding:"12px 14px", border:"1px solid var(--border)" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:m.color }}>{m.value}</div>
                    <div style={{ fontSize:11, color:"var(--text-3)", marginTop:2 }}>{m.label}</div>
                  </div>
                ))}
              </div>
              {deptData.length > 0 && (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={deptData} layout="vertical" barCategoryGap="30%">
                    <XAxis type="number" tick={{ fontSize:11, fill:"var(--text-3)" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize:11, fill:"var(--text-3)" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill:"var(--bg3)" }} />
                    <Bar dataKey="tasks" name="Tasks" radius={[0,6,6,0]} fill="var(--accent)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
              {deptData.length === 0 && <p className="empty-msg" style={{ padding:"20px 0" }}>No departments yet</p>}
            </div>
          </div>
        )}
      </div>

      {/* Progress overview */}
      <div className="card anim-fade-up" style={{ animationDelay:"280ms" }}>
        <div className="card-header">
          <h3>
            Task Progress Overview
            {selectedDept !== "ALL" && activeDept && (
              <span style={{ fontWeight:400, fontSize:12, color:"var(--text-3)", marginLeft:8 }}>
                — {activeDept.name}
              </span>
            )}
          </h3>
          <span className="card-header-meta">Avg {avgProgress}% complete</span>
        </div>
        <div className="progress-list">
          {tasks.length === 0 ? (
            <p className="empty-msg">{selectedDept !== "ALL" ? "No tasks in this department" : "No tasks to display"}</p>
          ) : tasks.slice(0, 8).map((task, i) => (
            <div key={task._id} className="progress-item">
              <div className="progress-label">
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:STATUS_COLORS[task.status], flexShrink:0 }} />
                  <span>{task.title.length > 40 ? task.title.slice(0,40)+"…" : task.title}</span>
                </div>
                <span className="font-mono" style={{ fontSize:12, color:"var(--text-2)", fontWeight:700 }}>{task.progress}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${task.progress===100?"fill-done":task.progress>60?"fill-mid":task.progress>30?"fill-low":"fill-red"}`}
                  style={{ width:`${task.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
