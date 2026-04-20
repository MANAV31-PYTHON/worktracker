import express from "express";
import {
  employeeAttendanceHistory,
  employeeTodayAttendance,
  markEmployeeClockIn,
  markEmployeeClockOut,
  markClockIn,
  markClockOut,
  myAttendanceHistory,
  todayAttendance,
} from "../controllers/attendance.controller.js";
import { authorizeRoles, isRoleChange, protect } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(protect, isRoleChange);

router.post("/clock-in", markClockIn);
router.post("/clock-out", markClockOut);
router.get("/today", todayAttendance);
router.get("/my", myAttendanceHistory);
router.post("/employee/:userId/clock-in", authorizeRoles("SUPER_ADMIN"), markEmployeeClockIn);
router.post("/employee/:userId/clock-out", authorizeRoles("SUPER_ADMIN"), markEmployeeClockOut);
router.get("/employee/:userId/today", authorizeRoles("SUPER_ADMIN"), employeeTodayAttendance);
router.get("/employee/:userId/history", authorizeRoles("SUPER_ADMIN"), employeeAttendanceHistory);

export default router;
