/**
 * taskLog.service.js — WorkTrack
 *
 * Responsibility: persist audit log entries. Nothing else.
 *
 * All socket notifications and emails are handled by task.service.js
 * which has full context (populated doc, old/new values, actor role).
 * Doing it here caused every update to fire a duplicate set of emails.
 */

import TaskLog from "../models/taskLog.model.js";
import Task from "../models/task.model.js";
import User from "../models/user.model.js";

/**
 * Write one log entry and return it.
 * Never throws — errors are caught by the caller.
 */
export const createLog = async ({ taskId, userId, message, progress, status }) => {
  return TaskLog.create({ taskId, userId, message, progress, status });
};

/**
 * Fetch all logs for a task, newest first.
 */
export const getTaskLogs = async (taskId, currentUser) => {
  const actor = await User.findById(currentUser.id).select("companyId");
  if (!actor || !actor.companyId) throw new Error("Not allowed");

  const task = await Task.findOne({ _id: taskId, companyId: actor.companyId }).select("_id");
  if (!task) throw new Error("Task not found");

  return TaskLog.find({ taskId })
    .populate("userId", "name role")
    .sort({ createdAt: -1 });
};
