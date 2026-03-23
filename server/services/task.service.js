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

/**
 * 📌 CREATE TASK
 */
export const createTask = async (data, currentUser) => {
  const { title, description, assignedTo, priority, deadline } = data;

  if (!title || !assignedTo) throw new Error("Title and assignedTo are required");
  if (!["ADMIN", "SUPER_ADMIN"].includes(currentUser.role)) throw new Error("Not authorized to assign tasks");

  const employee = await User.findById(assignedTo);
  if (!employee) throw new Error("Employee not found");
  if (employee.role !== "EMPLOYEE") throw new Error("Tasks can only be assigned to employees");

  const task = await Task.create({
    title, description, assignedTo,
    assignedBy: currentUser.id,
    priority: priority || "MEDIUM",
    deadline: deadline || null,
  });

  const populated = await task.populate([
    { path: "assignedTo", select: "name email" },
    { path: "assignedBy", select: "name email" },
  ]);

  const assignedByName = populated.assignedBy?.name || "Admin";
  const employeeName   = populated.assignedTo?.name || "Employee";

  // 🔔 Socket notifications
  sendNotification(assignedTo.toString(), "task_assigned", {
    message: `You have been assigned a new task: "${title}" by ${assignedByName}`,
    task: populated,
  });
  sendNotificationToRole("SUPER_ADMIN", "task_assigned", {
    message: `${assignedByName} assigned "${title}" to ${employeeName}`,
    task: populated,
  }, currentUser.id);

  // 📧 Email notifications
  sendTaskAssignedToEmployee(employee, assignedByName, populated);

  const superAdmins = await User.find({ role: "SUPER_ADMIN", _id: { $ne: currentUser.id } });
  superAdmins.forEach((sa) =>
    sendTaskAssignedToSuperAdmin(sa, assignedByName, employeeName, populated)
  );

  return populated;
};

/**
 * 📌 GET TASKS
 */
export const getTasks = async (currentUser) => {
  if (currentUser.role === "SUPER_ADMIN") {
    return await Task.find({ isDeleted: false })
      .populate("assignedTo", "name email")
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 });
  }
  if (currentUser.role === "ADMIN") {
    return await Task.find({ assignedBy: currentUser.id, isDeleted: false })
      .populate("assignedTo", "name email")
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 });
  }
  if (currentUser.role === "EMPLOYEE") {
    return await Task.find({ assignedTo: currentUser.id, isDeleted: false })
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 });
  }
  throw new Error("Invalid role");
};

/**
 * 📌 UPDATE TASK
 */
export const updateTask = async (taskId, data, currentUser) => {
  const task = await Task.findById(taskId);
  if (!task || task.isDeleted) throw new Error("Task not found");

  const oldStatus   = task.status;
  const oldProgress = task.progress;

  if (currentUser.role === "EMPLOYEE" && task.assignedTo.toString() !== currentUser.id)
    throw new Error("Not allowed to update this task");
  if (currentUser.role === "ADMIN" && task.assignedBy.toString() !== currentUser.id)
    throw new Error("Not allowed to update this task");

  if (currentUser.role === "EMPLOYEE") {
    if (data.progress !== undefined) task.progress = data.progress;
    if (data.status)                 task.status   = data.status;
  } else {
    const { title, description, status, priority, progress, deadline } = data;
    if (title       !== undefined) task.title       = title;
    if (description !== undefined) task.description = description;
    if (status      !== undefined) task.status      = status;
    if (priority    !== undefined) task.priority    = priority;
    if (progress    !== undefined) task.progress    = progress;
    if (deadline    !== undefined) task.deadline    = deadline;
  }

  await task.save();

  if (oldStatus !== task.status || oldProgress !== task.progress) {
    try {
      await createLog({
        taskId: task._id, userId: currentUser.id,
        message: `Status: ${oldStatus} → ${task.status} | Progress: ${oldProgress}% → ${task.progress}%`,
        progress: task.progress, status: task.status,
      });
    } catch (err) { console.error("Auto-log error:", err.message); }

    const populated = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("assignedBy", "name email");

    const employee       = await User.findById(task.assignedTo);
    const assigningAdmin = await User.findById(task.assignedBy);
    const employeeName   = populated.assignedTo?.name || "Employee";
    const assignedByName = populated.assignedBy?.name || "Admin";
    const isCompleted    = task.status === "COMPLETED";
    const statusLabel    = task.status.replace(/_/g, " ");
    const actorId        = currentUser.id;

    if (currentUser.role === "EMPLOYEE") {
      // Employee updated → notify admin + super admins
      const adminMsg = isCompleted
        ? `✅ ${employeeName} completed "${task.title}"!`
        : `${employeeName} updated "${task.title}" — ${statusLabel}, ${task.progress}%`;

      sendNotification(task.assignedBy.toString(), "task_updated", { message: adminMsg, task: populated });
      sendNotificationToRole("SUPER_ADMIN", "task_updated", { message: adminMsg, task: populated }, actorId);

      // 📧 Email the assigning admin
      if (assigningAdmin) {
        sendTaskUpdatedToAdmin(assigningAdmin, employeeName, populated, oldStatus, oldProgress);
      }
      // 📧 Email all super admins
      const superAdmins = await User.find({ role: "SUPER_ADMIN", _id: { $ne: actorId } });
      superAdmins.forEach((sa) =>
        sendTaskUpdatedToAdmin(sa, employeeName, populated, oldStatus, oldProgress)
      );

    } else {
      // Admin/Super Admin updated → notify employee
      const employeeMsg = isCompleted
        ? `✅ Your task "${task.title}" has been marked as completed`
        : `Your task "${task.title}" was updated by ${assignedByName} — ${statusLabel}, ${task.progress}%`;

      sendNotification(task.assignedTo.toString(), "task_updated", { message: employeeMsg, task: populated });

      if (currentUser.role === "ADMIN") {
        sendNotificationToRole("SUPER_ADMIN", "task_updated", {
          message: `${assignedByName} updated "${task.title}" — ${statusLabel}, ${task.progress}%`,
          task: populated,
        }, actorId);
      }

      // 📧 Email the employee
      if (employee) {
        sendTaskUpdatedToEmployee(employee, assignedByName, populated);
      }
      // 📧 If admin updated, email super admins too
      if (currentUser.role === "ADMIN") {
        const superAdmins = await User.find({ role: "SUPER_ADMIN" });
        superAdmins.forEach((sa) =>
          sendTaskUpdatedToAdmin(sa, assignedByName, populated, oldStatus, oldProgress)
        );
      }
    }
  }

  return task;
};

/**
 * 📌 DELETE TASK
 */
export const deleteTask = async (taskId, currentUser) => {
  const task = await Task.findById(taskId);
  if (!task) throw new Error("Task not found");

  if (currentUser.role === "ADMIN" && task.assignedBy.toString() !== currentUser.id)
    throw new Error("Not allowed to delete this task");

  const populated = await Task.findById(taskId)
    .populate("assignedTo", "name email")
    .populate("assignedBy", "name email");

  const employee       = await User.findById(task.assignedTo);
  const assigningAdmin = await User.findById(task.assignedBy);
  const employeeName   = populated.assignedTo?.name || "Employee";
  const assignedByName = populated.assignedBy?.name || "Admin";

  task.isDeleted = true;
  await task.save();

  // 🔔 Socket
  sendNotification(task.assignedTo.toString(), "task_deleted", {
    message: `Your task "${task.title}" has been removed`, taskId: task._id,
  });
  if (currentUser.role === "ADMIN") {
    sendNotificationToRole("SUPER_ADMIN", "task_deleted", {
      message: `${assignedByName} deleted task "${task.title}" (was assigned to ${employeeName})`,
      taskId: task._id,
    }, currentUser.id);
  }
  if (currentUser.role === "SUPER_ADMIN") {
    sendNotification(task.assignedBy.toString(), "task_deleted", {
      message: `Task "${task.title}" (assigned to ${employeeName}) was removed by Super Admin`,
      taskId: task._id,
    });
  }

  // 📧 Email
  if (employee) sendTaskDeletedToEmployee(employee, task.title);

  if (currentUser.role === "SUPER_ADMIN" && assigningAdmin) {
    sendTaskDeletedToAdmin(assigningAdmin, task.title, employeeName);
  }
  if (currentUser.role === "ADMIN") {
    const superAdmins = await User.find({ role: "SUPER_ADMIN" });
    superAdmins.forEach((sa) => sendTaskDeletedToAdmin(sa, task.title, employeeName));
  }

  return { message: "Task deleted successfully" };
};
