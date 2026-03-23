import mongoose from "mongoose";

const taskLogSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    progress: {
      type: Number,
      min: 0,
      max: 100,
    },

    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("TaskLog", taskLogSchema);