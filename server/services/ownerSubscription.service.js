import Company from "../models/company.model.js";
import Subscription from "../models/subscription.model.js";
import User from "../models/user.model.js";

const LIFETIME_END_DATE = new Date("2099-12-31T23:59:59.999Z");

export const ensureOwnerLifetimeAccess = async () => {
  const ownerEmail = (process.env.SUPER_ADMIN_EMAIL || "").trim().toLowerCase();
  if (!ownerEmail) {
    return;
  }

  const ownerCompanyName = (process.env.OWNER_COMPANY_NAME || "BOMEGROW Owner Workspace").trim();
  const ownerPlanName = (process.env.OWNER_LIFETIME_PLAN_NAME || "BOMEGROW Lifetime (Owner Free)").trim();

  const owner = await User.findOne({
    email: { $regex: `^${ownerEmail}$`, $options: "i" },
  }).select("_id email role companyId createdAt");

  if (!owner) {
    return;
  }

  let company = null;

  if (owner.companyId) {
    company = await Company.findById(owner.companyId);
  }

  if (!company) {
    company = await Company.findOne({ ownerUserId: owner._id });
  }

  if (!company) {
    company = await Company.create({
      name: ownerCompanyName,
      ownerUserId: owner._id,
      address: "",
      gstNumber: "",
      phone: "",
    });
  } else if (company.name !== ownerCompanyName) {
    company.name = ownerCompanyName;
    await company.save();
  }

  let ownerUpdated = false;
  if (owner.role !== "SUPER_ADMIN") {
    owner.role = "SUPER_ADMIN";
    ownerUpdated = true;
  }
  if (!owner.companyId || owner.companyId.toString() !== company._id.toString()) {
    owner.companyId = company._id;
    ownerUpdated = true;
  }
  if (ownerUpdated) {
    await owner.save();
  }

  await Subscription.findOneAndUpdate(
    { companyId: company._id },
    {
      $set: {
        companyId: company._id,
        planName: ownerPlanName,
        status: "active",
        startDate: owner.createdAt || new Date(),
        endDate: LIFETIME_END_DATE,
        nextBillingDate: null,
        paymentProvider: "owner_free",
        paymentProviderSubscriptionId: "owner_lifetime_free",
        paymentId: "owner_lifetime_free",
        expiryReminder: {
          lastSentAt: null,
          remindedForEndDate: null,
        },
      },
    },
    { upsert: true, new: true }
  );

  console.log(`[OwnerSubscription] Owner company set to "${ownerCompanyName}" with lifetime free plan.`);
};

