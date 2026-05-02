import User from "../models/user.model.js";
import Department from "../models/department.model.js";
import crypto from "crypto";
import {
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendEmployeeWelcomeCredentialsEmail,
} from "../emails/mailer.js";

const getActor = async (currentUser) => {
  const actor = await User.findById(currentUser.id).select("role companyId name");
  if (!actor) throw new Error("Current user not found");
  return actor;
};

const createPasswordResetTokenForUser = async (userId) => {
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  const expire = Date.now() + 7 * 24 * 60 * 60 * 1000;

  await User.updateOne(
    { _id: userId },
    {
      resetPasswordToken: hashedToken,
      resetPasswordExpire: expire,
    }
  );

  return resetToken;
};

/**
 * 📌 CREATE USER — optionally add to a department
 */
export const createUser = async (data, currentUser) => {
  const { name, email, password, role, departmentId } = data;
  const actor = await getActor(currentUser);

  if (!name || !email || !password) {
    throw new Error("Name, email and password are required");
  }

  if (!actor.companyId) throw new Error("Your account is not linked to any company");

  if (actor.role === "ADMIN" && role !== "EMPLOYEE") {
    throw new Error("Admins can only create Employee accounts");
  }

  const allowedRoles = ["EMPLOYEE", "ADMIN"];
  if (!allowedRoles.includes(role)) throw new Error("Invalid role");

  const existingUser = await User.findOne({
      email: { $regex: `^${email}$`, $options: "i" }
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

  // const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password,
    role: role || "EMPLOYEE",
    createdBy: currentUser.id,
    companyId: actor.companyId,
  });

  // If a department was selected, add the user to its members
  if (departmentId) {
    const dept = await Department.findOne({ _id: departmentId, companyId: actor.companyId });
    if (!dept) throw new Error("Selected department not found");

    // Only add employees to departments
    if (user.role === "EMPLOYEE") {
      if (!dept.members.includes(user._id)) {
        dept.members.push(user._id);
        await dept.save();
      }
    }
  }

  try {
    const resetToken = await createPasswordResetTokenForUser(user._id);
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const resetURL = `${appUrl}/reset-password/${resetToken}`;
    const createdByName = actor.name || "Administrator";

    await sendEmployeeWelcomeCredentialsEmail({
      employee: user,
      createdByName,
      temporaryPassword: password,
      resetURL,
    });
  } catch (err) {
    console.error("Welcome credentials email failed:", err.message);
  }

  return user;
};

/**
 * 📌 GET USERS
 */
export const getUsers = async (currentUser) => {
  const actor = await getActor(currentUser);
  if (!actor.companyId) throw new Error("Your account is not linked to any company");

  if (actor.role === "SUPER_ADMIN") {
    return await User.find({ _id: { $ne: currentUser.id }, companyId: actor.companyId })
      .select("-password")
      .sort({ createdAt: -1 });
  }
  if (actor.role === "ADMIN") {
    return await User.find({ role: "EMPLOYEE", companyId: actor.companyId })
      .select("-password")
      .sort({ createdAt: -1 });
  }
  throw new Error("Not allowed");
};

/**
 * 📌 UPDATE USER ROLE
 */
export const updateUserRole = async (userId, newRole, currentUser) => {
  const actor = await getActor(currentUser);
  if (actor.role !== "SUPER_ADMIN") throw new Error("Only Super Admin can change user roles");
  if (!actor.companyId) throw new Error("Your account is not linked to any company");

  const allowedRoles = ["EMPLOYEE", "ADMIN", "SUPER_ADMIN"];
  if (!allowedRoles.includes(newRole)) throw new Error("Invalid role");

  const user = await User.findOne({ _id: userId, companyId: actor.companyId });
  if (!user) throw new Error("User not found");
  if (user._id.toString() === currentUser.id) throw new Error("Cannot change your own role");

  await User.updateOne({ _id: userId }, { role: newRole });
  return { ...user.toObject(), role: newRole };
};

/**
 * 📌 TOGGLE ACTIVE
 */
export const toggleUserActive = async (userId, currentUser) => {
  const actor = await getActor(currentUser);
  if (actor.role !== "SUPER_ADMIN") throw new Error("Only Super Admin can activate/deactivate users");
  if (!actor.companyId) throw new Error("Your account is not linked to any company");

  const user = await User.findOne({ _id: userId, companyId: actor.companyId });
  if (!user) throw new Error("User not found");
  if (user._id.toString() === currentUser.id) throw new Error("Cannot deactivate yourself");
  const newActiveState = !user.isActive;

    await User.updateOne({ _id: userId }, { isActive: newActiveState });

    return { ...user.toObject(), isActive: newActiveState };
};

/**
 * 📌 DELETE USER — also remove from any departments
 */
export const deleteUser = async (userId, currentUser) => {
  const actor = await getActor(currentUser);
  if (!actor.companyId) throw new Error("Your account is not linked to any company");

  const user = await User.findOne({ _id: userId, companyId: actor.companyId });
  if (!user) throw new Error("User not found");
  if (user._id.toString() === currentUser.id) throw new Error("Cannot delete yourself");
  if (actor.role === "ADMIN" && user.role !== "EMPLOYEE") throw new Error("Admins can only delete employees");

  // Remove from all departments
  await Department.updateMany(
    { members: userId, companyId: actor.companyId },
    { $pull: { members: userId } }
  );

  await user.deleteOne();
  return { message: "User deleted successfully" };
};

export const forgotPassword = async (email) => {

  const user = await User.findOne({
    email: { $regex: `^${email}$`, $options: "i" }
  });
  if (!user) {
  return { message: "If an account exists, a reset email has been sent" };
}

   const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const expire = Date.now() + 15 * 60 * 1000;

  await User.updateOne(
    { _id: user._id },
    {
      resetPasswordToken: hashedToken,
      resetPasswordExpire: expire,
    }
  );

  const resetURL = `${process.env.APP_URL || "http://localhost:3000"}/reset-password/${resetToken}`;

  const mailResult = await sendPasswordResetEmail(user, resetURL);
  if (!mailResult?.ok) {
    if (mailResult.reason === "NOT_CONFIGURED") {
      throw new Error("Email is not configured. Set EMAIL_USER and EMAIL_PASS in .env");
    }
    if (mailResult.reason === "SEND_FAILED") {
      throw new Error("Email send failed. For Gmail, use 2-Step Verification + App Password.");
    }
    throw new Error("Password reset email could not be sent.");
  }

return { message: "Password reset email sent" };
};


export const resetPassword = async (token, newPassword) => {

  if (newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
    const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpire +password");

    if (!user) {
      throw new Error("Invalid or expired token");
    }
    user.password = newPassword;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    await sendPasswordChangedEmail(user);

    return { message: "Password reset successful" };
};
