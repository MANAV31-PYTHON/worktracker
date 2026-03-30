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
export const getTaskLogs = async (taskId) => {
  return TaskLog.find({ taskId })
    .populate("userId", "name role")
    .sort({ createdAt: -1 });
};