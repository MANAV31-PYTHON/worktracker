import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
} from "../services/notification.service.js";

export const getAll = async (req, res) => {
  try {
    const notifications = await getUserNotifications(req.user.id);
    res.json(notifications);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const readOne = async (req, res) => {
  try {
    const notification = await markAsRead(req.params.id, req.user.id);
    if (!notification) return res.status(404).json({ message: "Not found" });
    res.json(notification);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const readAll = async (req, res) => {
  try {
    await markAllAsRead(req.user.id);
    res.json({ message: "All marked as read" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};