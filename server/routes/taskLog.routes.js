import express from "express";
import { addLog, getLogs } from "../controllers/taskLog.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.post("/", protect, addLog);
router.get("/:taskId", protect, getLogs);

export default router;