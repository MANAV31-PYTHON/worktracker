import {
  clockIn,
  clockOut,
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

