/**
 * One-time migration: convert old single-assignee tasks to new assignees[] schema.
 *
 * Run once:  node seeders/migrate_tasks.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const OLD_TASK_FIELDS = {
  assignedTo: 1, status: 1, progress: 1,
  overallStatus: 1, overallProgress: 1, assignees: 1,
};

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;
  const tasks = db.collection("tasks");

  const cursor = tasks.find({
    assignedTo: { $exists: true },
    assignees: { $exists: false },
  });

  let count = 0;
  for await (const task of cursor) {
    await tasks.updateOne(
      { _id: task._id },
      {
        $set: {
          assignees: [{ user: task.assignedTo, status: task.status || "PENDING", progress: task.progress || 0 }],
          overallStatus: task.status || "PENDING",
          overallProgress: task.progress || 0,
        },
        $unset: { assignedTo: "", status: "", progress: "" },
      }
    );
    count++;
  }

  console.log(`Migrated ${count} tasks`);
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
