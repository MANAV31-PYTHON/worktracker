import express from "express";
import { create, getAll, getOne, update, remove } from "../controllers/department.controller.js";
import { protect, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post(  "/",    protect, authorizeRoles("SUPER_ADMIN", "ADMIN"), create);
router.get(   "/",    protect, authorizeRoles("SUPER_ADMIN", "ADMIN"), getAll);
router.get(   "/:id", protect, authorizeRoles("SUPER_ADMIN", "ADMIN"), getOne);
router.put(   "/:id", protect, authorizeRoles("SUPER_ADMIN", "ADMIN"), update);
router.delete("/:id", protect, authorizeRoles("SUPER_ADMIN", "ADMIN"), remove);

export default router;
