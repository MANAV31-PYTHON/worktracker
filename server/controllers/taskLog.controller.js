import { createLog, getTaskLogs } from "../services/taskLog.service.js";

export const addLog = async (req, res) => {
  try {
    const log = await createLog({
      ...req.body,
      userId: req.user.id,
    });

    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getLogs = async (req, res) => {
  try {
    const logs = await getTaskLogs(req.params.taskId, req.user);
    res.json(logs);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
