import {
  registerUser,
  loginUser,
  getCurrentUser,
} from "../services/auth.service.js";

export const register = async (req, res) => {
  try {
    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const data = await loginUser(req.body);
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const me = async (req, res) => {
  try {
    const user = await getCurrentUser(req.user.id);
    res.status(200).json({ user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
