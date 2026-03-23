import {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} from "../services/department.service.js";

export const create = async (req, res) => {
  try {
    const dept = await createDepartment(req.body, req.user);
    res.status(201).json(dept);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const depts = await getDepartments(req.user);
    res.json(depts);
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
};

export const getOne = async (req, res) => {
  try {
    const dept = await getDepartmentById(req.params.id, req.user);
    res.json(dept);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const dept = await updateDepartment(req.params.id, req.body, req.user);
    res.json(dept);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await deleteDepartment(req.params.id, req.user);
    res.json(result);
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
};
