import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import Company from "../models/company.model.js";
import Department from "../models/department.model.js";
import Task from "../models/task.model.js";

const ensureOwnerCompany = async (owner) => {
  if (owner.companyId) {
    const existingCompany = await Company.findById(owner.companyId).select("_id");
    if (existingCompany) return existingCompany._id;
  }

  const configuredCompanyId = (process.env.SUPER_ADMIN_COMPANY_ID || "").trim();
  if (configuredCompanyId) {
    const configuredCompany = await Company.findById(configuredCompanyId).select("_id");
    if (!configuredCompany) {
      throw new Error("SUPER_ADMIN_COMPANY_ID is set but no matching company exists");
    }
    owner.companyId = configuredCompany._id;
    await owner.save();
    return configuredCompany._id;
  }

  const companyName = (process.env.SUPER_ADMIN_COMPANY_NAME || `${owner.name} Workspace`).trim();
  const createdCompany = await Company.create({
    name: companyName,
    ownerUserId: owner._id,
    address: "",
    gstNumber: "",
    phone: "",
  });

  owner.companyId = createdCompany._id;
  await owner.save();
  return createdCompany._id;
};

const run = async () => {
  const mongoUri = process.env.MONGO_URI;
  const ownerEmail = (process.env.SUPER_ADMIN_EMAIL || "").trim();

  if (!mongoUri) throw new Error("MONGO_URI is missing in .env");
  if (!ownerEmail) throw new Error("SUPER_ADMIN_EMAIL is missing in .env");

  await mongoose.connect(mongoUri);

  try {
    const owner = await User.findOne({
      email: { $regex: `^${ownerEmail}$`, $options: "i" },
    }).select("name email role companyId");

    if (!owner) throw new Error(`Owner user not found for ${ownerEmail}`);
    if (owner.role !== "SUPER_ADMIN") {
      owner.role = "SUPER_ADMIN";
      await owner.save();
    }

    const targetCompanyId = await ensureOwnerCompany(owner);

    const usersToLink = await User.find({
      companyId: null,
      $or: [
        { _id: owner._id },
        { createdBy: owner._id },
        { role: { $in: ["EMPLOYEE", "ADMIN"] } },
      ],
    }).select("_id");

    const userIdsToLink = usersToLink.map((u) => u._id);

    const userResult = await User.updateMany(
      { _id: { $in: userIdsToLink }, companyId: null },
      { $set: { companyId: targetCompanyId } }
    );

    const deptResult = await Department.updateMany(
      {
        companyId: null,
        $or: [
          { createdBy: owner._id },
          { members: { $in: userIdsToLink } },
        ],
      },
      { $set: { companyId: targetCompanyId } }
    );

    const taskResult = await Task.updateMany(
      {
        companyId: null,
        $or: [
          { assignedBy: owner._id },
          { "assignees.user": { $in: userIdsToLink } },
        ],
      },
      { $set: { companyId: targetCompanyId } }
    );

    console.log("Legacy company scope migration completed");
    console.log(`Owner: ${owner.email}`);
    console.log(`Company: ${targetCompanyId.toString()}`);
    console.log(`Users linked: ${userResult.modifiedCount}`);
    console.log(`Departments linked: ${deptResult.modifiedCount}`);
    console.log(`Tasks linked: ${taskResult.modifiedCount}`);
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
