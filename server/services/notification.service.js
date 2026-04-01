import Notification from "../models/notification.model.js";
import { sendNotification } from "../sockets/socket.js";

/**
 * Save notification to DB and attempt live socket delivery.
 * If user is offline the socket silently fails — DB record remains.
 */
export const notify = async ({ userId, message, type = "info", taskId = null }) => {
  // Always save to DB first
  const notification = await Notification.create({ userId, message, type, taskId });

  // Attempt live delivery — works only if user is currently connected
  sendNotification(userId.toString(), "notification", {
    notification: {
      _id:       notification._id,
      message:   notification.message,
      type:      notification.type,
      taskId:    notification.taskId,
      isRead:    notification.isRead,
      createdAt: notification.createdAt,
    },
  });

  return notification;
};

/** Get all unread (or all) notifications for a user, newest first */
export const getUserNotifications = async (userId) => {
  return Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
};

/** Mark one notification as read */
export const markAsRead = async (notificationId, userId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
    { new: true }
  );
};

/** Mark all notifications as read for a user */
export const markAllAsRead = async (userId) => {
  return Notification.updateMany({ userId, isRead: false }, { isRead: true });
};