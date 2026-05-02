import Subscription from "../models/subscription.model.js";
import Company from "../models/company.model.js";
import User from "../models/user.model.js";
import { sendSubscriptionExpiryReminderToSuperAdmin } from "../emails/mailer.js";

const REMINDER_DAYS_BEFORE_EXPIRY = 3;
const DEFAULT_INTERVAL_HOURS = 12;

let reminderInterval = null;
let isRunning = false;

const startOfUtcDay = (date = new Date()) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const addDays = (date, days) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const isSameInstant = (a, b) => {
  if (!a || !b) return false;
  return new Date(a).getTime() === new Date(b).getTime();
};

export const runSubscriptionExpiryReminderCheck = async () => {
  if (isRunning) return;
  isRunning = true;

  try {
    const ownerEmail = (process.env.SUPER_ADMIN_EMAIL || "").trim().toLowerCase();
    const todayUtc = startOfUtcDay(new Date());
    const reminderWindowStart = addDays(todayUtc, REMINDER_DAYS_BEFORE_EXPIRY);
    const reminderWindowEnd = addDays(reminderWindowStart, 1);

    const subscriptions = await Subscription.find({
      status: { $in: ["active", "trialing", "past_due"] },
      endDate: { $gte: reminderWindowStart, $lt: reminderWindowEnd },
    }).select("companyId planName endDate expiryReminder");

    if (!subscriptions.length) {
      return;
    }

    for (const subscription of subscriptions) {
      if (isSameInstant(subscription?.expiryReminder?.remindedForEndDate, subscription.endDate)) {
        continue;
      }

      const [company, superAdmin] = await Promise.all([
        Company.findById(subscription.companyId).select("name"),
        User.findOne({
          companyId: subscription.companyId,
          role: "SUPER_ADMIN",
          isActive: true,
        }).select("name email"),
      ]);

      if (!company || !superAdmin?.email) {
        continue;
      }
      if (ownerEmail && superAdmin.email.toLowerCase() === ownerEmail) {
        continue;
      }

      const result = await sendSubscriptionExpiryReminderToSuperAdmin({
        superAdmin,
        companyName: company.name,
        planName: subscription.planName,
        endDate: subscription.endDate,
        daysLeft: REMINDER_DAYS_BEFORE_EXPIRY,
      });

      if (result?.ok) {
        subscription.expiryReminder = {
          lastSentAt: new Date(),
          remindedForEndDate: subscription.endDate,
        };
        await subscription.save();
      }
    }
  } catch (error) {
    console.error("[SubscriptionReminder] Failed to process reminders:", error.message);
  } finally {
    isRunning = false;
  }
};

export const startSubscriptionExpiryReminderJob = () => {
  if (reminderInterval) return;

  const intervalHours = Number(process.env.SUBSCRIPTION_REMINDER_INTERVAL_HOURS || DEFAULT_INTERVAL_HOURS);
  const safeIntervalHours = Number.isFinite(intervalHours) && intervalHours > 0 ? intervalHours : DEFAULT_INTERVAL_HOURS;
  const intervalMs = safeIntervalHours * 60 * 60 * 1000;

  runSubscriptionExpiryReminderCheck();
  reminderInterval = setInterval(runSubscriptionExpiryReminderCheck, intervalMs);

  console.log(
    `[SubscriptionReminder] Job started (every ${safeIntervalHours} hour${safeIntervalHours > 1 ? "s" : ""})`
  );
};
