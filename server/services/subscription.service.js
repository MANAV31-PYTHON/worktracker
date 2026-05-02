import Company from "../models/company.model.js";
import Subscription from "../models/subscription.model.js";
import User from "../models/user.model.js";
import Task from "../models/task.model.js";
import Department from "../models/department.model.js";
import TaskLog from "../models/taskLog.model.js";
import Attendance from "../models/attendance.model.js";
import Notification from "../models/notification.model.js";
import PersonalTask from "../models/personalTask.model.js";
import { sendSubscriptionPaymentSuccessToSuperAdmin } from "../emails/mailer.js";

const normalizeStatus = (status) => {
  const value = (status || "").toLowerCase();
  const allowed = ["active", "trialing", "past_due", "cancelled", "expired"];
  return allowed.includes(value) ? value : "active";
};

export const handlePaymentSuccess = async (payload) => {
  const {
    userId,
    planName,
    startDate,
    endDate,
    nextBillingDate,
    status,
    paymentProvider,
    paymentProviderSubscriptionId,
    paymentId,
    company,
    isRenewal,
  } = payload || {};

  if (!userId) throw new Error("userId is required");
  if (!planName) throw new Error("planName is required");
  if (!startDate || !endDate) throw new Error("startDate and endDate are required");
  if (!company?.name) throw new Error("company.name is required");

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const parsedStartDate = new Date(startDate);
  const parsedEndDate = new Date(endDate);
  const parsedNextBillingDate = nextBillingDate ? new Date(nextBillingDate) : null;

  if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedEndDate.getTime())) {
    throw new Error("Invalid startDate or endDate");
  }

  let companyRecord = null;

  if (user.companyId) {
    companyRecord = await Company.findById(user.companyId);
    if (!companyRecord) {
      throw new Error("Mapped company not found for this user");
    }

    if (!isRenewal) {
      throw new Error(
        "This account is already linked with a company. Create a new account/email to onboard another company."
      );
    }

    const existingName = (companyRecord.name || "").trim().toLowerCase();
    const incomingName = (company.name || "").trim().toLowerCase();

    if (incomingName && existingName && incomingName !== existingName) {
      throw new Error(
        "This account is already mapped to another company. Use a different email/account for a new company."
      );
    }
  }

  if (!companyRecord) {
    companyRecord = await Company.create({
      name: company.name,
      address: company.address || "",
      gstNumber: company.gstNumber || "",
      phone: company.phone || "",
      ownerUserId: user._id,
    });
  } else {
    // Same company renewal/update flow
    companyRecord.name = company.name || companyRecord.name;
    companyRecord.address = company.address || companyRecord.address;
    companyRecord.gstNumber = company.gstNumber || companyRecord.gstNumber;
    companyRecord.phone = company.phone || companyRecord.phone;
    await companyRecord.save();
  }

  user.role = "SUPER_ADMIN";
  user.companyId = companyRecord._id;
  await user.save();

  const subscriptionUpdate = {
    companyId: companyRecord._id,
    planName,
    status: normalizeStatus(status),
    startDate: parsedStartDate,
    endDate: parsedEndDate,
    nextBillingDate: parsedNextBillingDate,
    paymentProvider: paymentProvider || "manual",
    paymentProviderSubscriptionId: paymentProviderSubscriptionId || "",
    paymentId: paymentId || "",
  };

  const subscription = await Subscription.findOneAndUpdate(
    { companyId: companyRecord._id },
    { $set: subscriptionUpdate },
    { new: true, upsert: true }
  );

  try {
    await sendSubscriptionPaymentSuccessToSuperAdmin({
      superAdmin: user,
      companyName: companyRecord.name,
      planName: subscription.planName,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      paymentId: subscription.paymentId,
      paymentProvider: subscription.paymentProvider,
    });
  } catch (mailError) {
    console.error("[Subscription] Payment success email failed:", mailError.message);
  }

  return {
    message: "Subscription recorded and user promoted to SUPER_ADMIN",
    user: {
      id: user._id,
      role: user.role,
      companyId: user.companyId,
    },
    company: {
      id: companyRecord._id,
      name: companyRecord.name,
      address: companyRecord.address,
      gstNumber: companyRecord.gstNumber,
      phone: companyRecord.phone,
    },
    subscription: {
      planName: subscription.planName,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      nextBillingDate: subscription.nextBillingDate,
      paymentProvider: subscription.paymentProvider,
    },
  };
};

export const getSubscriptionOverview = async (currentUser) => {
  const user = await User.findById(currentUser.id).select("companyId role");
  if (!user) throw new Error("User not found");
  if (!user.companyId) throw new Error("Company not mapped for this user");

  const [company, subscription] = await Promise.all([
    Company.findById(user.companyId).select("name address gstNumber phone"),
    Subscription.findOne({ companyId: user.companyId }).select(
      "planName status startDate endDate nextBillingDate paymentProvider"
    ),
  ]);

  if (!company) throw new Error("Company not found");
  if (!subscription) throw new Error("Subscription not found");

  return {
    company: {
      name: company.name,
      address: company.address,
      gstNumber: company.gstNumber,
      phone: company.phone,
    },
    subscription: {
      planName: subscription.planName,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      nextBillingDate: subscription.nextBillingDate,
      paymentProvider: subscription.paymentProvider,
    },
  };
};

export const getPlatformCompanies = async (currentUser) => {
  const user = await User.findById(currentUser.id).select("email role companyId");
  if (!user) throw new Error("User not found");

  const ownerEmail = (process.env.SUPER_ADMIN_EMAIL || "").toLowerCase();
  if (user.role !== "SUPER_ADMIN" || !ownerEmail || user.email.toLowerCase() !== ownerEmail) {
    throw new Error("Only platform owner can access this data");
  }

  const records = await Subscription.find({})
    .populate({ path: "companyId", select: "name address gstNumber phone createdAt" })
    .sort({ createdAt: -1 });

  return records
    .filter((record) => record.companyId)
    .map((record) => ({
      company: {
        id: record.companyId._id,
        name: record.companyId.name,
        address: record.companyId.address,
        gstNumber: record.companyId.gstNumber,
        phone: record.companyId.phone,
        createdAt: record.companyId.createdAt,
      },
      subscription: {
        planName: record.planName,
        status: record.status,
        startDate: record.startDate,
        endDate: record.endDate,
        nextBillingDate: record.nextBillingDate,
        paymentProvider: record.paymentProvider,
      },
      isOwnerCompany:
        Boolean(user.companyId) &&
        user.companyId.toString() === record.companyId._id.toString(),
    }));
};

export const deletePlatformCompany = async (currentUser, companyId) => {
  if (!companyId) throw new Error("companyId is required");

  const owner = await User.findById(currentUser.id).select("email role companyId");
  if (!owner) throw new Error("User not found");

  const ownerEmail = (process.env.SUPER_ADMIN_EMAIL || "").toLowerCase();
  if (owner.role !== "SUPER_ADMIN" || !ownerEmail || owner.email.toLowerCase() !== ownerEmail) {
    throw new Error("Only platform owner can delete company data");
  }

  const company = await Company.findById(companyId).select("_id name");
  if (!company) throw new Error("Company not found");

  if (owner.companyId && owner.companyId.toString() === companyId.toString()) {
    throw new Error("You cannot delete your own platform owner company");
  }

  const users = await User.find({ companyId: companyId }).select("_id");
  const userIds = users.map((u) => u._id);

  const tasks = await Task.find({ companyId: companyId }).select("_id");
  const taskIds = tasks.map((t) => t._id);

  await TaskLog.deleteMany({
    $or: [{ userId: { $in: userIds } }, { taskId: { $in: taskIds } }],
  });
  await Attendance.deleteMany({ user: { $in: userIds } });
  await Notification.deleteMany({
    $or: [{ userId: { $in: userIds } }, { taskId: { $in: taskIds } }],
  });
  await PersonalTask.deleteMany({ createdBy: { $in: userIds } });

  await Subscription.deleteMany({ companyId: companyId });
  await Department.deleteMany({ companyId: companyId });
  await Task.deleteMany({ companyId: companyId });
  await User.deleteMany({ companyId: companyId });
  await Company.deleteOne({ _id: companyId });

  return {
    message: "Company and related data deleted successfully",
    deletedCompanyId: companyId,
    deletedCompanyName: company.name,
  };
};
