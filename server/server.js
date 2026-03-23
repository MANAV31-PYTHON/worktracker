// ⚠️  This MUST be the very first import — loads .env before any other module reads process.env
import "./config/env.js";

import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initSocket } from "./sockets/socket.js";
import { seedSuperAdmin } from "./seeders/superAdmin.seeder.js";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

connectDB().then(() => {
  seedSuperAdmin();
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
