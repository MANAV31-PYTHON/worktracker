import TaskLog from "../models/taskLog.model.js";
import Task from "../models/task.model.js";
import User from "../models/user.model.js";
import { sendNotification, sendNotificationToRole } from "../sockets/socket.js";
import { sendTaskUpdatedToAdmin } from "../emails/mailer.js";

export const createLog = async ({ taskId, userId, message, progress, status }) => {
  const log = await TaskLog.create({ taskId, userId, message, progress, status });

  const task = await Task.findById(taskId)
    .populate("assignees.user", "name email")
    .populate("assignedBy", "name email");

  if (!task) return log;

  const assignedById  = task.assignedBy?._id?.toString();
  const isCompleted   = (status ?? task.overallStatus) === "COMPLETED";
  const statusLabel   = (status ?? task.overallStatus).replace(/_/g, " ");
  const progressValue = progress ?? task.overallProgress;

  // Try to find the employee name from the userId
  const actorEntry = task.assignees.find((a) => a.user?._id?.toString() === userId?.toString());
  const employeeName = actorEntry?.user?.name || "Employee";

  const adminMsg = isCompleted
    ? `✅ ${employeeName} completed their part of "${task.title}"!`
    : `${employeeName} updated "${task.title}" — ${statusLabel}, ${progressValue}%`;

  if (assignedById && assignedById !== userId?.toString()) {
    sendNotification(assignedById, "task_updated", { message: adminMsg, task });
  }
  sendNotificationToRole("SUPER_ADMIN", "task_updated", { message: adminMsg, task }, userId);

  if (assignedById && assignedById !== userId?.toString()) {
    const admin = await User.findById(assignedById);
    if (admin) sendTaskUpdatedToAdmin(admin, employeeName, task, status, progress);
  }

  const superAdmins = await User.find({ role: "SUPER_ADMIN", _id: { $ne: userId } });
  superAdmins.forEach((sa) => sendTaskUpdatedToAdmin(sa, employeeName, task, status, progress));

  return log;
};

export const getTaskLogs = async (taskId) => {
  return TaskLog.find({ taskId })
    .populate("userId", "name role")
    .sort({ createdAt: -1 });
};
