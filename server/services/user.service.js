import User from "../models/user.model.js";
import Department from "../models/department.model.js";
import bcrypt from "bcryptjs";

/**
 * 📌 CREATE USER — optionally add to a department
 */
export const createUser = async (data, currentUser) => {
  const { name, email, password, role, departmentId } = data;

  if (!name || !email || !password) {
    throw new Error("Name, email and password are required");
  }

  if (currentUser.role === "ADMIN" && role !== "EMPLOYEE") {
    throw new Error("Admins can only create Employee accounts");
  }

  const allowedRoles = ["EMPLOYEE", "ADMIN", "SUPER_ADMIN"];
  if (!allowedRoles.includes(role)) throw new Error("Invalid role");

  const existing = await User.findOne({ email });
  if (existing) throw new Error("User already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role || "EMPLOYEE",
    createdBy: currentUser.id,
  });

  // If a department was selected, add the user to its members
  if (departmentId) {
    const dept = await Department.findById(departmentId);
    if (!dept) throw new Error("Selected department not found");

    // Only add employees to departments
    if (user.role === "EMPLOYEE") {
      if (!dept.members.includes(user._id)) {
        dept.members.push(user._id);
        await dept.save();
      }
    }
  }

  return user;
};

/**
 * 📌 GET USERS
 */
export const getUsers = async (currentUser) => {
  if (currentUser.role === "SUPER_ADMIN") {
    return await User.find({ _id: { $ne: currentUser.id } })
      .select("-password")
      .sort({ createdAt: -1 });
  }
  if (currentUser.role === "ADMIN") {
    return await User.find({ role: "EMPLOYEE" })
      .select("-password")
      .sort({ createdAt: -1 });
  }
  throw new Error("Not allowed");
};

/**
 * 📌 UPDATE USER ROLE
 */
export const updateUserRole = async (userId, newRole, currentUser) => {
  if (currentUser.role !== "SUPER_ADMIN") throw new Error("Only Super Admin can change user roles");

  const allowedRoles = ["EMPLOYEE", "ADMIN", "SUPER_ADMIN"];
  if (!allowedRoles.includes(newRole)) throw new Error("Invalid role");

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  if (user._id.toString() === currentUser.id) throw new Error("Cannot change your own role");

  user.role = newRole;
  await user.save();
  return user;
};

/**
 * 📌 TOGGLE ACTIVE
 */
export const toggleUserActive = async (userId, currentUser) => {
  if (currentUser.role !== "SUPER_ADMIN") throw new Error("Only Super Admin can activate/deactivate users");

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  if (user._id.toString() === currentUser.id) throw new Error("Cannot deactivate yourself");

  user.isActive = !user.isActive;
  await user.save();
  return user;
};

/**
 * 📌 DELETE USER — also remove from any departments
 */
export const deleteUser = async (userId, currentUser) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  if (user._id.toString() === currentUser.id) throw new Error("Cannot delete yourself");
  if (currentUser.role === "ADMIN" && user.role !== "EMPLOYEE") throw new Error("Admins can only delete employees");

  // Remove from all departments
  await Department.updateMany(
    { members: userId },
    { $pull: { members: userId } }
  );

  await user.deleteOne();
  return { message: "User deleted successfully" };
};
