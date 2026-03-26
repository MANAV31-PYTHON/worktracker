import express from "express";
import {
  create,
  getAll,
  remove,
  updateRole,
  toggleActive,
  reset,
  forgot,
} from "../controllers/user.controller.js";
import { protect, authorizeRoles, isRoleChange } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ── Public routes (NO auth required) ──────────────────────────
router.post("/forgot-password", forgot);
router.put("/reset-password/:token", reset);

// ── All routes below this line require authentication ──────────
router.use(protect, isRoleChange);

// Create user (SUPER_ADMIN creates any role; ADMIN creates only EMPLOYEE)
router.post("/", authorizeRoles("SUPER_ADMIN", "ADMIN"), create);

// Get all users (scoped by role in service)
router.get("/", authorizeRoles("SUPER_ADMIN", "ADMIN"), getAll);

// Update role (SUPER_ADMIN only)
router.patch("/:id/role", authorizeRoles("SUPER_ADMIN"), updateRole);

// Toggle active/inactive
router.patch("/:id/toggle-active", authorizeRoles("SUPER_ADMIN", "ADMIN"), toggleActive);

// Delete user
router.delete("/:id", authorizeRoles("SUPER_ADMIN", "ADMIN"), remove);

export default router;