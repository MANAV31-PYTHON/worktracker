import mongoose from "mongoose";
import dotenv from "dotenv";

import Task from "../models/task.model.js";
import TaskLog from "../models/taskLog.model.js";

dotenv.config(); // load .env

const syncLogs = async () => {
  try {
    // ✅ CONNECT FIRST
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected ✅");

    const tasks = await Task.find();

    for (const task of tasks) {
      for (const a of task.assignees) {
        await TaskLog.create({
          taskId: task._id,
          userId: a.user,
          message: "Initial sync from task",
          progress: a.progress,
          status: a.status,
        });
      }
    }

    console.log("Logs synced ✅");

    // ✅ CLOSE CONNECTION
    await mongoose.disconnect();
    process.exit(0);

  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
};

syncLogs();