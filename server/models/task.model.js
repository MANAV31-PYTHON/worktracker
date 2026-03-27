import mongoose from "mongoose";

// Per-assignee progress entry
const assigneeProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED"],
      default: "PENDING",
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,

    // Each assignee tracks their own status + progress
    assignees: {
      type: [assigneeProgressSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "At least one employee must be assigned",
      },
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Overall task view — admin-controlled
    overallStatus: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED"],
      default: "PENDING",
    },
    overallProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },
    deadline: Date,
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
