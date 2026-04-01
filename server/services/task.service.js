import Task from "../models/task.model.js";
import User from "../models/user.model.js";
import { shouldSendUpdate } from "../utils/notificationHelper.js";
import { createLog } from "./taskLog.service.js";
import { notify } from "./notification.service.js";
import { sendNotificationToRole } from "../sockets/socket.js";
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

const getActorName = async (userId, fallback = "Admin") => {
  try {
    const user = await User.findById(userId).select("name").lean();
    return user?.name || fallback;
  } catch {
    return fallback;
  }
};

const POPULATE = [
  { path: "assignees.user", select: "name email" },
  { path: "assignedBy", select: "name email" },
];

const getPopulated = (taskId) => Task.findById(taskId).populate(POPULATE);

const calculateOverall = (assignees) => {
  if (!assignees?.length) return { overallProgress: 0, overallStatus: "PENDING" };
  const total = assignees.reduce((sum, a) => sum + (Number(a.progress) || 0), 0);
  const avg = Math.round(total / assignees.length);
  let status = "PENDING";
  if (assignees.every((a) => a.status === "COMPLETED")) status = "COMPLETED";
  else if (assignees.some((a) => a.status === "IN_PROGRESS")) status = "IN_PROGRESS";
  else if (assignees.some((a) => a.status === "BLOCKED")) status = "BLOCKED";
  return { overallProgress: avg, overallStatus: status };
};

const toPayload = (doc) => ({
  title: doc.title,
  description: doc.description,
  priority: doc.priority,
  deadline: doc.deadline,
  overallStatus: doc.overallStatus,
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
    priority: priority || "MEDIUM",
    deadline: deadline || null,
    overallStatus, overallProgress,
  });

  const populated = await getPopulated(task._id);

  try {
    const actorName = await getActorName(currentUser.id);
    await createLog({
      taskId: task._id,
      userId: currentUser.id,
      message: `${actorName} created task "${task.title}"`,
      progress: task.overallProgress,
      status: task.overallStatus,
    });
  } catch (err) { console.error("Log error:", err.message); }

  const assignedByName = populated.assignedBy?.name || "Admin";
  const employeeNames = populated.assignees.map((a) => a.user?.name || "Employee").join(", ");

  // Notify each employee — saved to DB + attempted live delivery
  await Promise.all(ids.map((id) =>
    notify({
      userId: id,
      message: `You have been assigned a new task: "${title}" by ${assignedByName}`,
      type: "task_assigned",
      taskId: task._id,
    })
  ));

  // Super admins — broadcast via role socket (they are online-only oversight)
  // Also save individually to DB so they see it on next login
  const superAdmins = await User.find({ role: "SUPER_ADMIN", _id: { $ne: currentUser.id } });
  await Promise.all(superAdmins.map((sa) =>
    notify({
      userId: sa._id,
      message: `${assignedByName} assigned "${title}" to ${employeeNames}`,
      type: "task_assigned",
      taskId: task._id,
    })
  ));

  // Emails
  employees.forEach((emp) => sendTaskAssignedToEmployee(emp, assignedByName, populated));
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

  const oldStatus = task.overallStatus;
  const oldProgress = task.overallProgress;

  const { title, description, priority, deadline, assignedTo } = data;
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (priority !== undefined) task.priority = priority;
  if (deadline !== undefined) task.deadline = deadline;

  if (assignedTo !== undefined) {
    const ids = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
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
  task.overallStatus = overallStatus;
  await task.save();

  const changed = shouldSendUpdate({
    oldStatus, newStatus: overallStatus,
    oldProgress, newProgress: overallProgress,
  });

  if (changed) {
    try {
      await createLog({
        taskId: task._id,
        userId: currentUser.id,
        message: `Overall — ${oldStatus} → ${overallStatus} | ${oldProgress}% → ${overallProgress}%`,
        progress: overallProgress,
        status: overallStatus,
      });
    } catch (err) { console.error("Log error:", err.message); }

    const populated = await getPopulated(task._id);
    const assignedByName = populated.assignedBy?.name || "Admin";

    // Notify assignees
    if (currentUser.role !== "SUPER_ADMIN") {
      const assigneeIds = task.assignees.map((a) => a.user.toString());
      const assignees = await User.find({ _id: { $in: assigneeIds } });
      await Promise.all(assigneeIds.map((id) =>
        notify({
          userId: id,
          message: `Your task "${task.title}" was updated by ${assignedByName}`,
          type: "task_updated",
          taskId: task._id,
        })
      ));
      assignees.forEach((emp) => sendTaskUpdatedToEmployee(emp, assignedByName, populated));
    }

    // Notify super admins
    if (currentUser.role === "ADMIN") {
      const superAdmins = await User.find({ role: "SUPER_ADMIN" });
      await Promise.all(superAdmins.map((sa) =>
        notify({
          userId: sa._id,
          message: `${assignedByName} updated "${task.title}" — ${overallStatus.replace(/_/g, " ")}, ${overallProgress}%`,
          type: "task_updated",
          taskId: task._id,
        })
      ));
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

  const oldStatus = entry.status;
  const oldProgress = entry.progress;

  if (data.status !== undefined) entry.status = data.status;
  if (data.progress !== undefined) entry.progress = Number(data.progress);

  const { overallProgress, overallStatus } = calculateOverall(task.assignees);
  task.overallProgress = overallProgress;
  task.overallStatus = overallStatus;
  await task.save();

  const changed = shouldSendUpdate({
    oldStatus, newStatus: entry.status,
    oldProgress, newProgress: entry.progress,
  });

  const empName = await getActorName(currentUser.id, "Employee");
  const hasNote = data.note && data.note.trim().length > 0;

  if (changed || hasNote) {
    try {
      await createLog({
        taskId: task._id,
        userId: currentUser.id,
        message: `${empName} — ${oldStatus} → ${entry.status} | ${oldProgress}% → ${entry.progress}%`,
        note: data.note?.trim() || "",
        progress: entry.progress,
        status: entry.status,
      });
    } catch (err) { console.error("Log error:", err.message); }
  }

  if (!changed) return getPopulated(task._id);

  const populated = await getPopulated(task._id);
  const isOverallComplete = overallStatus === "COMPLETED";
  const statusLabel = entry.status.replace(/_/g, " ");
  const adminId = task.assignedBy.toString();

  // ── 1. Co-assignees ───────────────────────────────────────────────────────
  const coAssigneeIds = task.assignees
    .map((a) => a.user.toString())
    .filter((id) => id !== currentUser.id);

  if (coAssigneeIds.length) {
    const peerMsg = `${empName} updated "${task.title}" — ${statusLabel}, ${entry.progress}%`;
    const coAssignees = await User.find({ _id: { $in: coAssigneeIds } });
    await Promise.all(coAssigneeIds.map((id) =>
      notify({ userId: id, message: peerMsg, type: "task_updated", taskId: task._id })
    ));
    coAssignees.forEach((emp) => sendTaskUpdatedToEmployee(emp, empName, populated));
  }

  // ── 2. Assigning admin ────────────────────────────────────────────────────
  const adminMsg = isOverallComplete
    ? `✅ All assignees completed "${task.title}"!`
    : entry.status === "COMPLETED"
      ? `✅ ${empName} completed their part of "${task.title}"!`
      : `${empName} updated "${task.title}" — ${statusLabel}, ${entry.progress}%`;

  const assigningAdmin = await User.findById(adminId);
  await notify({ userId: adminId, message: adminMsg, type: "task_updated", taskId: task._id });
  if (assigningAdmin) {
    sendTaskUpdatedToAdmin(assigningAdmin, empName, toPayload(populated), oldStatus, oldProgress);
  }

  // ── 3. Super admins ───────────────────────────────────────────────────────
  const superAdmins = await User.find({ role: "SUPER_ADMIN" });
  await Promise.all(superAdmins.map(async (sa) => {
    const saId = sa._id.toString();
    const saMsg = isOverallComplete
      ? `✅ All assignees completed "${task.title}"!`
      : `${empName} updated "${task.title}" — ${statusLabel}, ${entry.progress}%`;

    await notify({
      userId: saId,
      message: saMsg,
      type: isOverallComplete ? "task_completed" : "task_updated",
      taskId: task._id,
    });

    if (isOverallComplete && saId !== adminId) {
      sendTaskUpdatedToAdmin(sa, empName, toPayload(populated), oldStatus, oldProgress);
    }
  }));

  return getPopulated(task._id);
};

// ─────────────────────────────────────────────────────────────────
// DELETE TASK
// ─────────────────────────────────────────────────────────────────
export const deleteTask = async (taskId, currentUser) => {
  const task = await Task.findById(taskId);
  if (!task) throw new Error("Task not found");
  if (task.isDeleted) throw new Error("Task already deleted");
  if (currentUser.role === "ADMIN" && task.assignedBy.toString() !== currentUser.id)
    throw new Error("Not allowed to delete this task");

  const populated = await getPopulated(taskId);
  const employeeNames = populated.assignees.map((a) => a.user?.name || "Employee").join(", ");
  const adminId = task.assignedBy.toString();

  task.isDeleted = true;
  await task.save();

  try {
    const actorName = await getActorName(currentUser.id);
    await createLog({
      taskId: task._id,
      userId: currentUser.id,
      message: `${actorName} deleted task "${task.title}"`,
      progress: task.overallProgress,
      status: task.overallStatus,
    });
  } catch (err) { console.error("Log error:", err.message); }

  // Notify every assignee
  await Promise.all(task.assignees.map(({ user: empId }) =>
    notify({
      userId: empId,
      message: `Your task "${task.title}" has been removed`,
      type: "task_deleted",
      taskId: task._id,
    })
  ));

  // Notify assigning admin when super admin deletes
  if (currentUser.role === "SUPER_ADMIN") {
    await notify({
      userId: adminId,
      message: `Your task "${task.title}" was removed by a Super Admin`,
      type: "task_deleted",
      taskId: task._id,
    });
  }

  // Notify super admins when admin deletes
  if (currentUser.role === "ADMIN") {
    const superAdmins = await User.find({ role: "SUPER_ADMIN" });
    await Promise.all(superAdmins.map((sa) =>
      notify({
        userId: sa._id,
        message: `${populated.assignedBy?.name || "Admin"} deleted "${task.title}" (assigned to ${employeeNames})`,
        type: "task_deleted",
        taskId: task._id,
      })
    ));
  }

  // Emails
  const assignees = await User.find({ _id: { $in: task.assignees.map((a) => a.user) } });
  assignees.forEach((emp) => sendTaskDeletedToEmployee(emp, task.title));

  if (currentUser.role === "SUPER_ADMIN") {
    const assigningAdmin = await User.findById(adminId);
    if (assigningAdmin?.role === "ADMIN")
      sendTaskDeletedToAdmin(assigningAdmin, task.title, employeeNames);
  }

  if (currentUser.role === "ADMIN") {
    const superAdmins = await User.find({ role: "SUPER_ADMIN" });
    superAdmins.forEach((sa) => sendTaskDeletedToAdmin(sa, task.title, employeeNames));
  }

  return { message: "Task deleted successfully" };
};