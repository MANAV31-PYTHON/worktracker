import {
  createUser,
  getUsers,
  deleteUser,
  updateUserRole,
  toggleUserActive,
} from "../services/user.service.js";

export const create = async (req, res) => {
  try {
    const user = await createUser(req.body, req.user);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const users = await getUsers(req.user);
    res.json(users);
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
};

export const updateRole = async (req, res) => {
  try {
    const user = await updateUserRole(req.params.id, req.body.role, req.user);
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const toggleActive = async (req, res) => {
  try {
    const user = await toggleUserActive(req.params.id, req.user);
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const data = await deleteUser(req.params.id, req.user);
    res.json(data);
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
};
