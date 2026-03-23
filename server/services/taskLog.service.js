import TaskLog from "../models/taskLog.model.js";
import Task from "../models/task.model.js";
import User from "../models/user.model.js";
import { sendNotification, sendNotificationToRole } from "../sockets/socket.js";
import { sendTaskUpdatedToAdmin } from "../emails/mailer.js";

export const createLog = async ({ taskId, userId, message, progress, status }) => {
  const log = await TaskLog.create({ taskId, userId, message, progress, status });

  const updateFields = {};
  if (progress !== undefined) updateFields.progress = progress;
  if (status)                 updateFields.status   = status;

  let task = null;
  if (Object.keys(updateFields).length > 0) {
    task = await Task.findByIdAndUpdate(taskId, updateFields, { returnDocument: "after" })
      .populate("assignedTo", "name email")
      .populate("assignedBy", "name email");
  } else {
    task = await Task.findById(taskId)
      .populate("assignedTo", "name email")
      .populate("assignedBy", "name email");
  }

  if (!task) return log;

  const employeeName  = task.assignedTo?.name || "Employee";
  const assignedById  = task.assignedBy?._id?.toString();
  const isCompleted   = (status ?? task.status) === "COMPLETED";
  const statusLabel   = (status ?? task.status).replace(/_/g, " ");
  const progressValue = progress ?? task.progress;
  const oldStatus     = status ? task.status : undefined; // approximate
  const oldProgress   = progress ?? task.progress;

  const adminMsg = isCompleted
    ? `✅ ${employeeName} completed "${task.title}"!`
    : `${employeeName} updated "${task.title}" — ${statusLabel}, ${progressValue}%`;

  // 🔔 Socket — notify assigning admin
  if (assignedById && assignedById !== userId.toString()) {
    sendNotification(assignedById, "task_updated", { message: adminMsg, task });
  }

  // 🔔 Socket — notify all super admins
  sendNotificationToRole("SUPER_ADMIN", "task_updated", { message: adminMsg, task }, userId);

  // 📧 Email — assigning admin
  if (assignedById && assignedById !== userId.toString()) {
    const admin = await User.findById(assignedById);
    if (admin) sendTaskUpdatedToAdmin(admin, employeeName, task, oldStatus, oldProgress);
  }

  // 📧 Email — all super admins (excluding actor)
  const superAdmins = await User.find({ role: "SUPER_ADMIN", _id: { $ne: userId } });
  superAdmins.forEach((sa) =>
    sendTaskUpdatedToAdmin(sa, employeeName, task, oldStatus, oldProgress)
  );

  return log;
};

export const getTaskLogs = async (taskId) => {
  return await TaskLog.find({ taskId })
    .populate("userId", "name role")
    .sort({ createdAt: -1 });
};
