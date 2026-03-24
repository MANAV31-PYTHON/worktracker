import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};

export const isRoleChange = async (req, res, next) => {
  try {
    // req.user already exists from protect middleware
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // 🔥 Compare roles
    if (user.role !== req.user.role) {
      return res.status(401).json({
        message: "Role changed! Please login again",
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Something went wrong" });
  }
};