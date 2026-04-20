import {
  clockIn,
  clockOut,
  clockInForEmployee,
  clockOutForEmployee,
  getEmployeeAttendanceHistory,
  getEmployeeTodayAttendance,
  getMyAttendanceHistory,
  getTodayAttendance,
} from "../services/attendance.service.js";

export const markClockIn = async (req, res) => {
  try {
    const record = await clockIn(req.user.id);
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const markClockOut = async (req, res) => {
  try {
    const record = await clockOut(req.user.id);
    res.json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const todayAttendance = async (req, res) => {
  try {
    const record = await getTodayAttendance(req.user.id);
    res.json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const myAttendanceHistory = async (req, res) => {
  try {
    const records = await getMyAttendanceHistory(req.user.id, req.query.limit);
    res.json(records);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const markEmployeeClockIn = async (req, res) => {
  try {
    const record = await clockInForEmployee(req.params.userId);
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const markEmployeeClockOut = async (req, res) => {
  try {
    const record = await clockOutForEmployee(req.params.userId);
    res.json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const employeeTodayAttendance = async (req, res) => {
  try {
    const record = await getEmployeeTodayAttendance(req.params.userId);
    res.json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const employeeAttendanceHistory = async (req, res) => {
  try {
    const records = await getEmployeeAttendanceHistory(req.params.userId, req.query.limit);
    res.json(records);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
