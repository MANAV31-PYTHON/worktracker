import "../config/env.js";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { runSubscriptionExpiryReminderCheck } from "../services/subscriptionReminder.service.js";

const run = async () => {
  try {
    await connectDB();
    await runSubscriptionExpiryReminderCheck();
    console.log("[SubscriptionReminder] Manual check completed");
  } catch (error) {
    console.error("[SubscriptionReminder] Manual check failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
