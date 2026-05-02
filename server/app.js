import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import authRoutes       from "./routes/auth.routes.js";
import userRoutes       from "./routes/user.routes.js";
import taskRoutes       from "./routes/task.routes.js";
import taskLogRoutes    from "./routes/taskLog.routes.js";
import departmentRoutes from "./routes/department.routes.js";
import personalTaskRoutes from "./routes/personalTask.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";

const app = express();

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173",process.env.CLIENT_URL],
  credentials: true,
  
}));
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

app.use("/api/auth",        authRoutes);
app.use("/api/users",       userRoutes);
app.use("/api/tasks",       taskRoutes);
app.use("/api/logs",        taskLogRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/personal-tasks", personalTaskRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

// app.get("/", (req, res) => res.send("WorkTrack API is running..."));

export default app;
