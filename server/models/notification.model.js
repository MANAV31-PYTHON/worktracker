import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message:  { type: String, required: true },
    type:     { type: String, default: "info" }, // task_assigned, task_updated, task_deleted, task_completed
    taskId:   { type: mongoose.Schema.Types.ObjectId, ref: "Task", default: null },
    isRead:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);