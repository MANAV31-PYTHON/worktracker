import express from "express";
import {
  markClockIn,
  markClockOut,
  myAttendanceHistory,
  todayAttendance,
} from "../controllers/attendance.controller.js";
import { isRoleChange, protect } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(protect, isRoleChange);

router.post("/clock-in", markClockIn);
router.post("/clock-out", markClockOut);
router.get("/today", todayAttendance);
router.get("/my", myAttendanceHistory);

export default router;

