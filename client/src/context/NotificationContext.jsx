import { createContext, useContext, useState, useEffect, useCallback } from "react";
import socket from "../sockets/socket";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = useCallback((type, data) => {
    const n = {
      id: Date.now(),
      type,
      message: data.message,
      task: data.task,
      taskId: data.taskId,
      time: new Date(),
      read: false,
    };
    setNotifications((prev) => [n, ...prev].slice(0, 50));
    setUnreadCount((c) => c + 1);
  }, []);

  useEffect(() => {
    // Keep named handler references so we can remove exactly these listeners
    // without accidentally removing listeners registered by other components
    const onAssigned = (data) => addNotification("task_assigned", data);
    const onUpdated  = (data) => addNotification("task_updated", data);
    const onDeleted  = (data) => addNotification("task_deleted", data);

    socket.on("task_assigned", onAssigned);
    socket.on("task_updated",  onUpdated);
    socket.on("task_deleted",  onDeleted);

    return () => {
      socket.off("task_assigned", onAssigned);
      socket.off("task_updated",  onUpdated);
      socket.off("task_deleted",  onDeleted);
    };
  }, [addNotification]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
