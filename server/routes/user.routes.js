import express from "express";
import {
  create,
  getAll,
  remove,
  updateRole,
  toggleActive,
} from "../controllers/user.controller.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Create user (SUPER_ADMIN creates any role; ADMIN creates only EMPLOYEE)
router.post(
  "/",
  protect,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  create
);

// Get all users (scoped by role in service)
router.get(
  "/",
  protect,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  getAll
);

// Update role (SUPER_ADMIN only)
router.patch(
  "/:id/role",
  protect,
  authorizeRoles("SUPER_ADMIN"),
  updateRole
);

// Toggle active/inactive (SUPER_ADMIN only)
router.patch(
  "/:id/toggle-active",
  protect,
  authorizeRoles("SUPER_ADMIN"),
  toggleActive
);

// Delete user
router.delete(
  "/:id",
  protect,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  remove
);

export default router;
