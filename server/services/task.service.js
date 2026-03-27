import Task from "../models/task.model.js";
import User from "../models/user.model.js";
import { createLog } from "./taskLog.service.js";
import { sendNotification, sendNotificationToRole } from "../sockets/socket.js";
import {
  sendTaskAssignedToEmployee,
  sendTaskAssignedToSuperAdmin,
  sendTaskUpdatedToAdmin,
  sendTaskUpdatedToEmployee,
  sendTaskDeletedToEmployee,
  sendTaskDeletedToAdmin,
} from "../emails/mailer.js";

const calculateOverall = (assignees) => {
  if (!assignees || assignees.length === 0) {
    return { overallProgress: 0, overallStatus: "PENDING" };
  }

  const total = assignees.reduce((sum, a) => sum + (a.progress || 0), 0);
  const avg = Math.round(total / assignees.length);

  let status = "PENDING";

  if (assignees.every(a => a.status === "COMPLETED")) {
    status = "COMPLETED";
  } else if (assignees.some(a => a.status === "IN_PROGRESS")) {
    status = "IN_PROGRESS";
  } else if (assignees.some(a => a.status === "BLOCKED")) {
    status = "BLOCKED";
  }

  return {
    overallProgress: avg,
    overallStatus: status
  };
};

// Populate helper
const POPULATE = [
  { path: "assignees.user", select: "name email" },
  { path: "assignedBy", select: "name email" },
];

// ─────────────────────────────────────────────────────────────────────────────
// CREATE TASK
// ─────────────────────────────────────────────────────────────────────────────
export const createTask = async (data, currentUser) => {
  const { title, description, assignedTo, priority, deadline } = data;

  if (!title || !assignedTo) throw new Error("Title and assignedTo are required");
  if (!["ADMIN", "SUPER_ADMIN"].includes(currentUser.role))
    throw new Error("Not authorized to assign tasks");

  const ids = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
  if (ids.length === 0) throw new Error("At least one employee must be assigned");

  const employees = await User.find({ _id: { $in: ids } });
  if (employees.length !== ids.length) throw new Error("One or more employees not found");
  if (employees.some((e) => e.role !== "EMPLOYEE"))
    throw new Error("Tasks can only be assigned to employees");

  const assignees = ids.map((id) => ({
      user: id,
      status: "PENDING",
      progress: 0,
    }));

    // ✅ calculate first
    const { overallProgress, overallStatus } = calculateOverall(assignees);

    // ✅ then create task
    const task = await Task.create({
      title,
      description,
      assignees,
      assignedBy: currentUser.id,
      priority: priority || "MEDIUM",
      deadline: deadline || null,
      overallStatus,
      overallProgress,
    });

  const populated = await Task.findById(task._id).populate(POPULATE);
  const assignedByName = populated.assignedBy?.name || "Admin";
  const employeeNames  = populated.assignees.map((a) => a.user?.name).join(", ");

  // 🔔 Notify each assignee
  ids.forEach((id) => {
    sendNotification(id.toString(), "task_assigned", {
      message: `You have been assigned a new task: "${title}" by ${assignedByName}`,
      task: populated,
    });
  });
  sendNotificationToRole("SUPER_ADMIN", "task_assigned", {
    message: `${assignedByName} assigned "${title}" to ${employeeNames}`,
    task: populated,
  }, currentUser.id);

  // 📧 Email each assignee
  employees.forEach((emp) => sendTaskAssignedToEmployee(emp, assignedByName, populated));
  const superAdmins = await User.find({ role: "SUPER_ADMIN", _id: { $ne: currentUser.id } });
  superAdmins.forEach((sa) =>
    sendTaskAssignedToSuperAdmin(sa, assignedByName, employeeNames, populated)
  );

  return populated;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET TASKS
// ─────────────────────────────────────────────────────────────────────────────
export const getTasks = async (currentUser) => {
  const base = { isDeleted: false };

  if (currentUser.role === "SUPER_ADMIN") {
    return Task.find(base).populate(POPULATE).sort({ createdAt: -1 });
  }
  if (currentUser.role === "ADMIN") {
    return Task.find({ ...base, assignedBy: currentUser.id }).populate(POPULATE).sort({ createdAt: -1 });
  }
  if (currentUser.role === "EMPLOYEE") {
    return Task.find({ ...base, "assignees.user": currentUser.id }).populate(POPULATE).sort({ createdAt: -1 });
  }
  throw new Error("Invalid role");
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE TASK (admin edits title/desc/overall/deadline/assignees)
// ─────────────────────────────────────────────────────────────────────────────
export const updateTask = async (taskId, data, currentUser) => {
  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";
  const task = await Task.findById(taskId);
  if (!task || task.isDeleted) throw new Error("Task not found");

  if (!["ADMIN", "SUPER_ADMIN"].includes(currentUser.role))
    throw new Error("Use the my-progress endpoint to update your progress");
  if (currentUser.role === "ADMIN" && task.assignedBy.toString() !== currentUser.id)
    throw new Error("Not allowed to update this task");

  const oldOverallStatus   = task.overallStatus;
  const oldOverallProgress = task.overallProgress;

  const { title, description, priority, deadline, assignedTo } = data;
  if (title           !== undefined) task.title           = title;
  if (description     !== undefined) task.description     = description;
  if (priority        !== undefined) task.priority        = priority;
  if (deadline        !== undefined) task.deadline        = deadline;

  // Reassign employees
  if (assignedTo !== undefined) {
    const ids = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
    if (ids.length === 0) throw new Error("At least one employee must be assigned");
    const emps = await User.find({ _id: { $in: ids } });
    if (emps.length !== ids.length) throw new Error("One or more employees not found");
    if (emps.some((e) => e.role !== "EMPLOYEE"))
      throw new Error("Tasks can only be assigned to employees");

    // Preserve existing progress for employees who stay; add new ones fresh
    const existing = new Map(task.assignees.map((a) => [a.user.toString(), a]));
    task.assignees = ids.map((id) => existing.get(id.toString()) || { user: id, status: "PENDING", progress: 0 });
  }

  const { overallProgress, overallStatus } = calculateOverall(task.assignees);

    task.overallProgress = overallProgress;
    task.overallStatus = overallStatus;

  await task.save();

  // Log if overall changed
  if (oldOverallStatus !== task.overallStatus || oldOverallProgress !== task.overallProgress) {
    try {
      await createLog({
        taskId: task._id,
        userId: currentUser.id,
        message: `Overall — Status: ${oldOverallStatus} → ${task.overallStatus} | Progress: ${oldOverallProgress}% → ${task.overallProgress}%`,
        progress: task.overallProgress,
        status: task.overallStatus,
      });
    } catch (err) { console.error("Auto-log error:", err.message); }

    const populated = await Task.findById(task._id).populate(POPULATE);
    const assignedByName = populated.assignedBy?.name || "Admin";

    if (!isSuperAdmin) {
        const assignees = await User.find({ _id: { $in: task.assignees.map((a) => a.user) } });

        assignees.forEach((emp) =>
          sendTaskUpdatedToEmployee(emp, assignedByName, populated)
        );
      }

    if (!isSuperAdmin) {
    task.assignees.forEach(({ user: empId }) => {
      sendNotification(empId.toString(), "task_updated", {
        message: `Your task "${task.title}" was updated by ${assignedByName}`,
        task: populated,
      });
    });
  }
    const statusLabel    = task.overallStatus.replace(/_/g, " ");
    const isCompleted    = task.overallStatus === "COMPLETED";

    if (currentUser.role === "ADMIN") {
      sendNotificationToRole("SUPER_ADMIN", "task_updated", {
        message: `${assignedByName} updated "${task.title}" — ${statusLabel}, ${task.overallProgress}%`,
        task: populated,
      }, currentUser.id);
    }
    if (currentUser.role === "ADMIN") {
      const superAdmins = await User.find({ role: "SUPER_ADMIN" });
      superAdmins.forEach((sa) =>
        sendTaskUpdatedToAdmin(sa, assignedByName, populated, oldOverallStatus, oldOverallProgress)
      );
    }
  }

  return Task.findById(task._id).populate(POPULATE);
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE MY PROGRESS (employee updates only their own assignee entry)
// ─────────────────────────────────────────────────────────────────────────────
export const updateMyProgress = async (taskId, data, currentUser) => {
  const task = await Task.findById(taskId);
  if (!task || task.isDeleted) throw new Error("Task not found");

  const entry = task.assignees.find((a) => a.user.toString() === currentUser.id);
  if (!entry) throw new Error("You are not assigned to this task");

  const oldStatus   = entry.status;
  const oldProgress = entry.progress;

  if (data.status   !== undefined) entry.status   = data.status;
  if (data.progress !== undefined) entry.progress = data.progress;

      // ✅ recalculate overall BEFORE saving
    const { overallProgress, overallStatus } = calculateOverall(task.assignees);

    task.overallProgress = overallProgress;
    task.overallStatus = overallStatus;

    await task.save();

  // Auto-log
  if (oldStatus !== entry.status || oldProgress !== entry.progress) {
    try {
      await createLog({
        taskId: task._id,
        userId: currentUser.id,
        message: `${currentUser.name || "Employee"} — Status: ${oldStatus} → ${entry.status} | Progress: ${oldProgress}% → ${entry.progress}%`,
        progress: entry.progress,
        status: entry.status,
      });
    } catch (err) { console.error("Auto-log error:", err.message); }

    const populated = await Task.findById(task._id).populate(POPULATE);
        // ✅ Notify OTHER employees
    task.assignees.forEach(({ user: empId }) => {
      if (empId.toString() !== currentUser.id) {
        sendNotification(empId.toString(), "task_updated", {
          message: `${currentUser.name} updated "${task.title}" — ${entry.status}, ${entry.progress}%`,
          task: populated,
        });
      }
    });

        // ✅ Email OTHER employees
    const otherEmployees = await User.find({
      _id: {
        $in: task.assignees.map(a => a.user),
        $ne: currentUser.id
      }
    });

    otherEmployees.forEach(emp =>
      sendTaskUpdatedToEmployee(emp, currentUser.name, populated)
    );
    const empName    = currentUser.name || "Employee";
    const statusLabel = entry.status.replace(/_/g, " ");
    const isCompleted = entry.status === "COMPLETED";

    const adminMsg = isCompleted
      ? `✅ ${empName} completed their part of "${task.title}"!`
      : `${empName} updated "${task.title}" — ${statusLabel}, ${entry.progress}%`;

    sendNotification(task.assignedBy.toString(), "task_updated", { message: adminMsg, task: populated });
    sendNotificationToRole("SUPER_ADMIN", "task_updated", { message: adminMsg, task: populated }, currentUser.id);

    const assigningAdmin = await User.findById(task.assignedBy);
    if (assigningAdmin) sendTaskUpdatedToAdmin(assigningAdmin, empName, populated, oldStatus, oldProgress);

    const superAdmins = await User.find({ role: "SUPER_ADMIN", _id: { $ne: currentUser.id } });
    superAdmins.forEach((sa) => sendTaskUpdatedToAdmin(sa, empName, populated, oldStatus, oldProgress));
  }

  return Task.findById(task._id).populate(POPULATE);
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE TASK
// ─────────────────────────────────────────────────────────────────────────────
export const deleteTask = async (taskId, currentUser) => {
  const task = await Task.findById(taskId);
  if (!task) throw new Error("Task not found");

  if (currentUser.role === "ADMIN" && task.assignedBy.toString() !== currentUser.id)
    throw new Error("Not allowed to delete this task");

  const populated = await Task.findById(taskId).populate(POPULATE);
  const employeeNames  = populated.assignees.map((a) => a.user?.name).join(", ");
  const assignedByName = populated.assignedBy?.name || "Admin";
  const assigningAdmin = await User.findById(task.assignedBy);

  task.isDeleted = true;
  await task.save();

  // 🔔 Notify every assignee
  task.assignees.forEach(({ user: empId }) => {
    sendNotification(empId.toString(), "task_deleted", {
      message: `Your task "${task.title}" has been removed`,
      taskId: task._id,
    });
  });

  if (currentUser.role === "ADMIN") {
    sendNotificationToRole("SUPER_ADMIN", "task_deleted", {
      message: `${assignedByName} deleted task "${task.title}" (assigned to ${employeeNames})`,
      taskId: task._id,
    }, currentUser.id);
  }
  if (currentUser.role === "SUPER_ADMIN") {
    sendNotification(task.assignedBy.toString(), "task_deleted", {
      message: `Task "${task.title}" (assigned to ${employeeNames}) was removed by Super Admin`,
      taskId: task._id,
    });
  }

  // 📧 Email each assignee
  const assignees = await User.find({ _id: { $in: task.assignees.map((a) => a.user) } });
  assignees.forEach((emp) => sendTaskDeletedToEmployee(emp, task.title));

  if (currentUser.role === "SUPER_ADMIN" && assigningAdmin)
    sendTaskDeletedToAdmin(assigningAdmin, task.title, employeeNames);
  if (currentUser.role === "ADMIN") {
    const superAdmins = await User.find({ role: "SUPER_ADMIN" });
    superAdmins.forEach((sa) => sendTaskDeletedToAdmin(sa, task.title, employeeNames));
  }

  return { message: "Task deleted successfully" };
};
