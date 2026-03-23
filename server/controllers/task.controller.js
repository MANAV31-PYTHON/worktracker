import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} from "../services/task.service.js";

export const create = async (req, res) => {
  try {
    const task = await createTask(req.body, req.user);
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const tasks = await getTasks(req.user);
    res.json(tasks);
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const task = await updateTask(req.params.id, req.body, req.user);
    res.json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await deleteTask(req.params.id, req.user);
    res.json(result);
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
};