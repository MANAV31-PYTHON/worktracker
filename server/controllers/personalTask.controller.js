import {
  createPersonalTask,
  getPersonalTasks,
  updatePersonalTask,
  deletePersonalTask,
} from "../services/personalTask.service.js";

export const create = async (req, res) => {
  try {
    const task = await createPersonalTask(req.body, req.user);
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const tasks = await getPersonalTasks(req.user);
    res.json(tasks);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const task = await updatePersonalTask(req.params.id, req.body, req.user);
    res.json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await deletePersonalTask(req.params.id, req.user);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};