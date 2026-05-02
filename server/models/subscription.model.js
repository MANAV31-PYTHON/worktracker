import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      unique: true,
    },
    planName: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["active", "trialing", "past_due", "cancelled", "expired"],
      default: "active",
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    nextBillingDate: { type: Date, default: null },
    paymentProvider: { type: String, default: "manual", trim: true },
    paymentProviderSubscriptionId: { type: String, default: "", trim: true },
    paymentId: { type: String, default: "", trim: true },
    expiryReminder: {
      lastSentAt: { type: Date, default: null },
      remindedForEndDate: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

subscriptionSchema.index({ paymentId: 1 }, { sparse: true });

export default mongoose.model("Subscription", subscriptionSchema);
