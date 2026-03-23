// ⚠️ MUST be first
import "./config/env.js";

import http from "http";
import path from "path";
import { fileURLToPath } from "url";

import express from "express";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initSocket } from "./sockets/socket.js";
import { seedSuperAdmin } from "./seeders/superAdmin.seeder.js";

const PORT = process.env.PORT || 5000;

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 👇 Serve frontend build
const clientPath = path.join(__dirname, "../client/dist");

app.use(express.static(clientPath));

// 👇 Handle React routing (VERY IMPORTANT)
app.get("*", (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

const server = http.createServer(app);
initSocket(server);

connectDB().then(() => {
  seedSuperAdmin();
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});