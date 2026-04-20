import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    dateKey: { type: String, required: true, index: true }, // YYYY-MM-DD (UTC)
    clockInAt: { type: Date, required: true },
    clockOutAt: { type: Date, default: null },
    totalMinutes: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

attendanceSchema.index({ user: 1, dateKey: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);

