/**
 * task.service.js — WorkTrack
 *
 * Single source of truth for ALL notifications and emails.
 * taskLog.service.js only writes to DB — no side-effects there.
 *
 * Notification matrix (updateMyProgress):
 *   Co-assignees    → socket + email  (significant change only, skip actor)
 *   Assigning admin → socket + email  (exactly once)
 *   Super admins    → socket always   (email only on full task completion)
 */

import Task from "../models/task.model.js";
import User from "../models/user.model.js";
import { shouldSendUpdate } from "../utils/notificationHelper.js";
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

// ─────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────

const POPULATE = [
  { path: "assignees.user", select: "name email" },
  { path: "assignedBy",     select: "name email" },
];

const getPopulated = (taskId) => Task.findById(taskId).populate(POPULATE);

const calculateOverall = (assignees) => {
  if (!assignees?.length) return { overallProgress: 0, overallStatus: "PENDING" };
  const total = assignees.reduce((sum, a) => sum + (Number(a.progress) || 0), 0);
  const avg   = Math.round(total / assignees.length);
  let status  = "PENDING";
  if      (assignees.every((a) => a.status === "COMPLETED"))   status = "COMPLETED";
  else if (assignees.some ((a) => a.status === "IN_PROGRESS")) status = "IN_PROGRESS";
  else if (assignees.some ((a) => a.status === "BLOCKED"))     status = "BLOCKED";
  return { overallProgress: avg, overallStatus: status };
};

/**
 * Safe plain-object for mailer/templates.
 * Mongoose documents and plain objects both work.
 */
const toPayload = (doc) => ({
  title:           doc.title,
  description:     doc.description,
  priority:        doc.priority,
  deadline:        doc.deadline,
  overallStatus:   doc.overallStatus,
  overallProgress: doc.overallProgress,
});

// ─────────────────────────────────────────────────────────────────
// CREATE TASK
// ─────────────────────────────────────────────────────────────────
export const createTask = async (data, currentUser) => {
  const { title, description, assignedTo, priority, deadline } = data;

  if (!title || !assignedTo) throw new Error("Title and assignedTo are required");
  if (!["ADMIN", "SUPER_ADMIN"].includes(currentUser.role))
    throw new Error("Not authorized to assign tasks");

  const ids = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
  if (!ids.length) throw new Error("At least one employee must be assigned");

  const employees = await User.find({ _id: { $in: ids } });
  if (employees.length !== ids.length) throw new Error("One or more employees not found");
  if (employees.some((e) => e.role !== "EMPLOYEE"))
    throw new Error("Tasks can only be assigned to employees");

  const assignees = ids.map((id) => ({ user: id, status: "PENDING", progress: 0 }));
  const { overallProgress, overallStatus } = calculateOverall(assignees);

  const task = await Task.create({
    title, description, assignees,
    assignedBy: currentUser.id,
    priority:   priority || "MEDIUM",
    deadline:   deadline || null,
    overallStatus, overallProgress,
  });

  const populated      = await getPopulated(task._id);
  const assignedByName = populated.assignedBy?.name || "Admin";
  const employeeNames  = populated.assignees.map((a) => a.user?.name || "Employee").join(", ");

  // Sockets
  ids.forEach((id) =>
    sendNotification(id.toString(), "task_assigned", {
      message: `You have been assigned a new task: "${title}" by ${assignedByName}`,
      task:    populated,
    })
  );
  sendNotificationToRole("SUPER_ADMIN", "task_assigned", {
    message: `${assignedByName} assigned "${title}" to ${employeeNames}`,
    task:    populated,
  }, currentUser.id);

  // Emails
  employees.forEach((emp) => sendTaskAssignedToEmployee(emp, assignedByName, populated));
  const superAdmins = await User.find({ role: "SUPER_ADMIN", _id: { $ne: currentUser.id } });
  superAdmins.forEach((sa) =>
    sendTaskAssignedToSuperAdmin(sa, assignedByName, employeeNames, populated)
  );

  return populated;
};

// ─────────────────────────────────────────────────────────────────
// GET TASKS
// ─────────────────────────────────────────────────────────────────
export const getTasks = async (currentUser) => {
  const base = { isDeleted: false };
  const sort = { createdAt: -1 };
  if (currentUser.role === "SUPER_ADMIN")
    return Task.find(base).populate(POPULATE).sort(sort);
  if (currentUser.role === "ADMIN")
    return Task.find({ ...base, assignedBy: currentUser.id }).populate(POPULATE).sort(sort);
  if (currentUser.role === "EMPLOYEE")
    return Task.find({ ...base, "assignees.user": currentUser.id }).populate(POPULATE).sort(sort);
  throw new Error("Invalid role");
};

// ─────────────────────────────────────────────────────────────────
// UPDATE TASK  (admin edits metadata / reassigns employees)
// ─────────────────────────────────────────────────────────────────
export const updateTask = async (taskId, data, currentUser) => {
  const task = await Task.findById(taskId);
  if (!task || task.isDeleted) throw new Error("Task not found");
  if (!["ADMIN", "SUPER_ADMIN"].includes(currentUser.role))
    throw new Error("Use the my-progress endpoint to update your progress");
  if (currentUser.role === "ADMIN" && task.assignedBy.toString() !== currentUser.id)
    throw new Error("Not allowed to update this task");

  const oldStatus   = task.overallStatus;
  const oldProgress = task.overallProgress;

  const { title, description, priority, deadline, assignedTo } = data;
  if (title       !== undefined) task.title       = title;
  if (description !== undefined) task.description = description;
  if (priority    !== undefined) task.priority    = priority;
  if (deadline    !== undefined) task.deadline    = deadline;

  if (assignedTo !== undefined) {
    const ids  = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
    if (!ids.length) throw new Error("At least one employee must be assigned");
    const emps = await User.find({ _id: { $in: ids } });
    if (emps.length !== ids.length) throw new Error("One or more employees not found");
    if (emps.some((e) => e.role !== "EMPLOYEE"))
      throw new Error("Tasks can only be assigned to employees");
    const existing = new Map(task.assignees.map((a) => [a.user.toString(), a]));
    task.assignees = ids.map((id) =>
      existing.get(id.toString()) ?? { user: id, status: "PENDING", progress: 0 }
    );
  }

  const { overallProgress, overallStatus } = calculateOverall(task.assignees);
  task.overallProgress = overallProgress;
  task.overallStatus   = overallStatus;
  await task.save();

  const changed = shouldSendUpdate({
    oldStatus, newStatus: overallStatus,
    oldProgress, newProgress: overallProgress,
  });

  if (changed) {
    try {
      await createLog({
        taskId: task._id, userId: currentUser.id,
        message:  `Overall — ${oldStatus} → ${overallStatus} | ${oldProgress}% → ${overallProgress}%`,
        progress: overallProgress, status: overallStatus,
      });
    } catch (err) { console.error("Log error:", err.message); }

    const populated      = await getPopulated(task._id);
    const assignedByName = populated.assignedBy?.name || "Admin";

    // Notify & email assignees (admin is the actor, not an assignee)
    if (currentUser.role !== "SUPER_ADMIN") {
      const assigneeIds = task.assignees.map((a) => a.user.toString());
      const assignees   = await User.find({ _id: { $in: assigneeIds } });
      assignees.forEach((emp) => {
        sendNotification(emp._id.toString(), "task_updated", {
          message: `Your task "${task.title}" was updated by ${assignedByName}`,
          task:    populated,
        });
        sendTaskUpdatedToEmployee(emp, assignedByName, populated);
      });
    }

    // Super admin oversight — socket + email when actor is ADMIN
    if (currentUser.role === "ADMIN") {
      sendNotificationToRole("SUPER_ADMIN", "task_updated", {
        message: `${assignedByName} updated "${task.title}" — ${overallStatus.replace(/_/g, " ")}, ${overallProgress}%`,
        task:    populated,
      }, currentUser.id);
      const superAdmins = await User.find({ role: "SUPER_ADMIN" });
      superAdmins.forEach((sa) =>
        sendTaskUpdatedToAdmin(sa, assignedByName, toPayload(populated), oldStatus, oldProgress)
      );
    }
  }

  return getPopulated(task._id);
};

// ─────────────────────────────────────────────────────────────────
// UPDATE MY PROGRESS  (employee updates their own assignee entry)
// ─────────────────────────────────────────────────────────────────
export const updateMyProgress = async (taskId, data, currentUser) => {
  const task = await Task.findById(taskId);
  if (!task || task.isDeleted) throw new Error("Task not found");

  const entry = task.assignees.find((a) => a.user.toString() === currentUser.id);
  if (!entry) throw new Error("You are not assigned to this task");

  const oldStatus   = entry.status;
  const oldProgress = entry.progress;

  if (data.status   !== undefined) entry.status   = data.status;
  if (data.progress !== undefined) entry.progress = Number(data.progress);

  const { overallProgress, overallStatus } = calculateOverall(task.assignees);
  task.overallProgress = overallProgress;
  task.overallStatus   = overallStatus;
  await task.save();

  const changed = shouldSendUpdate({
    oldStatus, newStatus: entry.status,
    oldProgress, newProgress: entry.progress,
  });
  if (!changed) return getPopulated(task._id);

  // Always fetch name from DB — JWT payload may not carry it
  const actorDoc = await User.findById(currentUser.id).select("name").lean();
  const empName  = actorDoc?.name ?? currentUser?.name ?? "Employee";

  // DB-only log — no side effects in createLog anymore
  try {
    await createLog({
      taskId: task._id, userId: currentUser.id,
      message:  `${empName} — ${oldStatus} → ${entry.status} | ${oldProgress}% → ${entry.progress}%`,
      progress: entry.progress, status: entry.status,
    });
  } catch (err) { console.error("Log error:", err.message); }

  const populated         = await getPopulated(task._id);
  const isOverallComplete = overallStatus === "COMPLETED";
  const statusLabel       = entry.status.replace(/_/g, " ");
  const adminId           = task.assignedBy.toString();

  // ── 1. Co-assignees — socket + email, skip the actor ──────────────────────
  const coAssigneeIds = task.assignees
    .map((a) => a.user.toString())
    .filter((id) => id !== currentUser.id);

  if (coAssigneeIds.length) {
    const peerMsg    = `${empName} updated "${task.title}" — ${statusLabel}, ${entry.progress}%`;
    const coAssignees = await User.find({ _id: { $in: coAssigneeIds } });
    coAssigneeIds.forEach((id) =>
      sendNotification(id, "task_updated", { message: peerMsg, task: populated })
    );
    coAssignees.forEach((emp) => sendTaskUpdatedToEmployee(emp, empName, populated));
  }

  // ── 2. Assigning admin — exactly one socket + exactly one email ───────────
  const assigningAdmin = await User.findById(adminId);
  if (assigningAdmin) {
    const adminMsg = isOverallComplete
      ? `✅ All assignees completed "${task.title}"!`
      : entry.status === "COMPLETED"
        ? `✅ ${empName} completed their part of "${task.title}"!`
        : `${empName} updated "${task.title}" — ${statusLabel}, ${entry.progress}%`;

    sendNotification(adminId, "task_updated", { message: adminMsg, task: populated });
    // Routes to "completed" email template automatically when overallStatus = COMPLETED
    sendTaskUpdatedToAdmin(assigningAdmin, empName, toPayload(populated), oldStatus, oldProgress);
  }

  // ── 3. Super admins — socket always; email only on full completion ─────────
  //       Skip super admin if they are also the assigning admin (already notified above)
  const superAdmins = await User.find({ role: "SUPER_ADMIN" });
  superAdmins.forEach((sa) => {
    const saId     = sa._id.toString();
    const saMsg    = isOverallComplete
      ? `✅ All assignees completed "${task.title}"!`
      : `${empName} updated "${task.title}" — ${statusLabel}, ${entry.progress}%`;
    const saEvent  = isOverallComplete ? "task_completed" : "task_updated";

    sendNotification(saId, saEvent, { message: saMsg, task: populated });

    if (isOverallComplete && saId !== adminId) {
      sendTaskUpdatedToAdmin(sa, empName, toPayload(populated), oldStatus, oldProgress);
    }
  });

  return getPopulated(task._id);
};

// ─────────────────────────────────────────────────────────────────
// DELETE TASK
// ─────────────────────────────────────────────────────────────────
export const deleteTask = async (taskId, currentUser) => {
  const task = await Task.findById(taskId);
  if (!task)          throw new Error("Task not found");
  if (task.isDeleted) throw new Error("Task already deleted");
  if (currentUser.role === "ADMIN" && task.assignedBy.toString() !== currentUser.id)
    throw new Error("Not allowed to delete this task");

  const populated     = await getPopulated(taskId);
  const employeeNames = populated.assignees.map((a) => a.user?.name || "Employee").join(", ");
  const adminId       = task.assignedBy.toString();

  task.isDeleted = true;
  await task.save();

  // Notify every assignee
  task.assignees.forEach(({ user: empId }) =>
    sendNotification(empId.toString(), "task_deleted", {
      message: `Your task "${task.title}" has been removed`,
      taskId:  task._id,
    })
  );

  // Notify the assigning admin when super admin deletes
  if (currentUser.role === "SUPER_ADMIN") {
    sendNotification(adminId, "task_deleted", {
      message: `Your task "${task.title}" was removed by a Super Admin`,
      taskId:  task._id,
    });
  }

  // Notify super admins when admin deletes
  if (currentUser.role === "ADMIN") {
    sendNotificationToRole("SUPER_ADMIN", "task_deleted", {
      message: `${populated.assignedBy?.name || "Admin"} deleted "${task.title}" (assigned to ${employeeNames})`,
      taskId:  task._id,
    }, currentUser.id);
  }

  // Email every assignee
  const assignees = await User.find({ _id: { $in: task.assignees.map((a) => a.user) } });
  assignees.forEach((emp) => sendTaskDeletedToEmployee(emp, task.title));

  // Email the assigning admin when super admin deletes
  if (currentUser.role === "SUPER_ADMIN") {
    const assigningAdmin = await User.findById(adminId);
    if (assigningAdmin?.role === "ADMIN")
      sendTaskDeletedToAdmin(assigningAdmin, task.title, employeeNames);
  }

  // Email super admins when admin deletes
  if (currentUser.role === "ADMIN") {
    const superAdmins = await User.find({ role: "SUPER_ADMIN" });
    superAdmins.forEach((sa) => sendTaskDeletedToAdmin(sa, task.title, employeeNames));
  }

  return { message: "Task deleted successfully" };
};