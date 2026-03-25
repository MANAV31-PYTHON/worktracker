import express from "express";
import { addLog, getLogs } from "../controllers/taskLog.controller.js";
import { protect ,isRoleChange } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect,isRoleChange);
router.post("/", addLog);
router.get("/:taskId", getLogs);

export default router;