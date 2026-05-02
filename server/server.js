// ⚠️ MUST be first
import "./config/env.js";

import http from "http";
import path from "path";
import { fileURLToPath } from "url";

import app from "./app.js";
import express from "express";
import connectDB from "./config/db.js";
import { initSocket } from "./sockets/socket.js";
import { seedSuperAdmin } from "./seeders/superAdmin.seeder.js";
import { startSubscriptionExpiryReminderJob } from "./services/subscriptionReminder.service.js";
import { ensureOwnerLifetimeAccess } from "./services/ownerSubscription.service.js";

const PORT = process.env.PORT || 5000;

// Fix __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer(app);
initSocket(server);

// ✅ Serve frontend ONLY in production
if (process.env.NODE_ENV === "production") {
  const clientPath = path.join(__dirname, "../client/dist");

  // Static files
  app.use(express.static(clientPath));

  // ✅ EXPRESS 5 SAFE FALLBACK
  app.use((req, res, next) => {
    if (
      req.method === "GET" &&
      !req.originalUrl.startsWith("/api")
    ) {
      return res.sendFile(path.join(clientPath, "index.html"));
    }
    next();
  });
}

// DB
connectDB().then(async () => {
  await seedSuperAdmin();
  await ensureOwnerLifetimeAccess();
  startSubscriptionExpiryReminderJob();
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
