import Attendance from "../models/attendance.model.js";
import User from "../models/user.model.js";

const getUTCDateKey = (date = new Date()) => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const toMinutes = (ms) => Math.max(0, Math.floor(ms / 60000));

export const clockIn = async (userId) => {
  const now = new Date();
  const todayKey = getUTCDateKey(now);

  const active = await Attendance.findOne({ user: userId, clockOutAt: null });
  if (active) throw new Error("You are already clocked in");

  const existingToday = await Attendance.findOne({ user: userId, dateKey: todayKey });
  if (existingToday) throw new Error("Attendance already marked for today");

  return Attendance.create({
    user: userId,
    dateKey: todayKey,
    clockInAt: now,
  });
};

export const clockOut = async (userId) => {
  const now = new Date();
  const active = await Attendance.findOne({ user: userId, clockOutAt: null }).sort({ createdAt: -1 });
  if (!active) throw new Error("No active clock-in found");

  active.clockOutAt = now;
  active.totalMinutes = toMinutes(now - active.clockInAt);
  await active.save();
  return active;
};

export const getTodayAttendance = async (userId) => {
  const todayKey = getUTCDateKey();
  return Attendance.findOne({ user: userId, dateKey: todayKey });
};

export const getMyAttendanceHistory = async (userId, limit = 14) => {
  const safeLimit = Math.max(1, Math.min(90, Number(limit) || 14));
  return Attendance.find({ user: userId }).sort({ dateKey: -1 }).limit(safeLimit);
};

const ensureEmployee = async (userId) => {
  const user = await User.findById(userId).select("name role isActive");
  if (!user) throw new Error("Employee not found");
  if (user.role !== "EMPLOYEE") throw new Error("Attendance can only be marked for employees");
  if (!user.isActive) throw new Error("Cannot mark attendance for inactive employee");
  return user;
};

export const clockInForEmployee = async (employeeId) => {
  await ensureEmployee(employeeId);
  return clockIn(employeeId);
};

export const clockOutForEmployee = async (employeeId) => {
  await ensureEmployee(employeeId);
  return clockOut(employeeId);
};

export const getEmployeeTodayAttendance = async (employeeId) => {
  await ensureEmployee(employeeId);
  return getTodayAttendance(employeeId);
};

export const getEmployeeAttendanceHistory = async (employeeId, limit = 14) => {
  await ensureEmployee(employeeId);
  return getMyAttendanceHistory(employeeId, limit);
};
