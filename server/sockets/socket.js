import { Server } from "socket.io";

let io;

// userId → { socketId, role }
const users = new Map();

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:5173"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    // Client sends { userId, role } after connecting
    socket.on("register", ({ userId, role }) => {
      if (userId) {
        users.set(userId, { socketId: socket.id, role });
        console.log(`✅ Registered user ${userId} (${role}) → socket ${socket.id}`);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
      for (const [userId, data] of users.entries()) {
        if (data.socketId === socket.id) {
          users.delete(userId);
          break;
        }
      }
    });
  });
};

/**
 * Send a notification to a specific user by userId
 */
export const sendNotification = (userId, event, data) => {
  const entry = users.get(userId);
  if (entry && io) {
    io.to(entry.socketId).emit(event, data);
    console.log(`📨 Sent [${event}] to user ${userId}`);
  } else {
    console.log(`⚠️  User ${userId} not connected — notification skipped`);
  }
};

/**
 * Send a notification to all users with a given role
 * Optionally exclude a specific userId (e.g. the actor)
 */
export const sendNotificationToRole = (role, event, data, excludeUserId = null) => {
  if (!io) return;
  for (const [userId, entry] of users.entries()) {
    if (entry.role === role && userId !== excludeUserId?.toString()) {
      io.to(entry.socketId).emit(event, data);
      console.log(`📨 Sent [${event}] to ${role} user ${userId}`);
    }
  }
};
