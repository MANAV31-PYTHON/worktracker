import express from "express";
import { create, getAll, update, myProgress, remove } from "../controllers/task.controller.js";
import { protect, isRoleChange } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(protect, isRoleChange);

router.post("/", create);
router.get("/", getAll);
router.put("/:id", update);
router.patch("/:id/my-progress", myProgress); // employee updates their own entry
router.delete("/:id", remove);

export default router;
