import { createContext, useContext, useState, useEffect, useCallback } from "react";
import socket from "../sockets/socket";
import { useAuth } from "./AuthContext";
import { getNotifications, markOneRead, markAllRead as markAllReadApi } from "../services/notificationService";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();                                    // ← ADD: watch auth user
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);

  const fetchFromDB = useCallback(async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n) => !n.isRead).length);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, []);

  // ← CHANGE: run when user logs in or out, not just on mount
  useEffect(() => {
    if (user) {
      fetchFromDB();                                             // fetch when logged in
    } else {
      setNotifications([]);                                      // clear when logged out
      setUnreadCount(0);
    }
  }, [user, fetchFromDB]);

  // Live socket delivery
  useEffect(() => {
    const handler = ({ notification }) => {
      setNotifications((prev) => {
        if (prev.some((n) => n._id === notification._id)) return prev;
        return [notification, ...prev];
      });
      setUnreadCount((c) => c + 1);
    };
    socket.on("notification", handler);
    return () => socket.off("notification", handler);
  }, []);

  const markOneAsRead = useCallback(async (id) => {
    try {
      await markOneRead(id);
      setNotifications((prev) =>
        prev.map((n) => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) { console.error(err); }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await markAllReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) { console.error(err); }
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markOneAsRead,
      markAllRead,
      clearAll,
      refetch: fetchFromDB,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);