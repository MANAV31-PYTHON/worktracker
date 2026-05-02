import { createContext, useContext, useState, useEffect, useRef } from "react";
import socket from "../sockets/socket";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Keep a ref to current user so the socket handler always has fresh data
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    const syncCurrentUser = async () => {
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) return;

        const data = await res.json();
        if (data?.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
          setUser(data.user);
        }
      } catch (err) {
        console.error("Failed to sync current user", err);
      }
    };

    syncCurrentUser();
  }, [API_BASE, token]);

  useEffect(() => {
    if (!user || !token) {
      socket.disconnect();
      return;
    }

    // This handler fires on every (re)connection — covers:
    //  • fresh connect after login
    //  • page refresh where socket reconnects
    //  • StrictMode double-invoke
    //  • network drop + reconnect
    const handleConnect = () => {
      const u = userRef.current;
      if (u) {
        socket.emit("register", { userId: u._id, role: u.role });
        console.log("📡 Registered socket for", u.email, u.role);
      }
    };

    socket.on("connect", handleConnect);

    // If already connected right now, register immediately
    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);
    };
  }, [user, token]);

  const login = (userData, authToken) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", authToken);
    setUser(userData);
    setToken(authToken);
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
    socket.disconnect();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
