import Department from "../models/department.model.js";
import User from "../models/user.model.js";

const getActor = async (currentUser) => {
  const actor = await User.findById(currentUser.id).select("role companyId");
  if (!actor) throw new Error("Current user not found");
  if (!actor.companyId) throw new Error("Your account is not linked to any company");
  return actor;
};

/**
 * 📌 CREATE DEPARTMENT
 */
export const createDepartment = async (data, currentUser) => {
  const { name, description, memberIds = [] } = data;
  const actor = await getActor(currentUser);

  if (!name?.trim()) throw new Error("Department name is required");

  const existing = await Department.findOne({
    companyId: actor.companyId,
    name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
  });
  if (existing) throw new Error("A department with this name already exists");

  // Validate all members are employees
  if (memberIds.length > 0) {
    const members = await User.find({
      _id: { $in: memberIds },
      role: "EMPLOYEE",
      companyId: actor.companyId,
    });
    if (members.length !== memberIds.length) {
      throw new Error("Some selected users are not employees");
    }
  }

  const department = await Department.create({
    name: name.trim(),
    description: description?.trim() || "",
    createdBy: currentUser.id,
    companyId: actor.companyId,
    members: memberIds,
  });

  return await Department.findById(department._id)
    .populate("members", "name email")
    .populate("createdBy", "name email role");
};

/**
 * 📌 GET DEPARTMENTS
 */
export const getDepartments = async (currentUser) => {
  const actor = await getActor(currentUser);
  // Super admin sees all departments
  if (actor.role === "SUPER_ADMIN") {
    return await Department.find({ companyId: actor.companyId })
      .populate("members", "name email role")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });
  }

  // Admin sees ALL departments (needed to show dept names in user list)
  // but can only edit/delete their own (enforced in update/delete)
  if (actor.role === "ADMIN") {
    return await Department.find({ companyId: actor.companyId })
      .populate("members", "name email role")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });
  }

  throw new Error("Not allowed");
};

/**
 * 📌 GET SINGLE DEPARTMENT
 */
export const getDepartmentById = async (deptId, currentUser) => {
  const actor = await getActor(currentUser);

  const dept = await Department.findOne({ _id: deptId, companyId: actor.companyId })
    .populate("members", "name email role")
    .populate("createdBy", "name email role");

  if (!dept) throw new Error("Department not found");

  return dept;
};

/**
 * 📌 UPDATE DEPARTMENT (name, description, members)
 */
export const updateDepartment = async (deptId, data, currentUser) => {
  const actor = await getActor(currentUser);
  const dept = await Department.findOne({ _id: deptId, companyId: actor.companyId });
  if (!dept) throw new Error("Department not found");

  // All admins and super admins can edit any department

  const { name, description, memberIds } = data;

  if (name !== undefined) {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Department name cannot be empty");

    // Check name collision (exclude self)
    const existing = await Department.findOne({
      companyId: actor.companyId,
      name: { $regex: new RegExp(`^${trimmed}$`, "i") },
      _id: { $ne: deptId },
    });
    if (existing) throw new Error("A department with this name already exists");

    dept.name = trimmed;
  }

  if (description !== undefined) dept.description = description.trim();

  if (memberIds !== undefined) {
    if (memberIds.length > 0) {
      const members = await User.find({
        _id: { $in: memberIds },
        role: "EMPLOYEE",
        companyId: actor.companyId,
      });
      if (members.length !== memberIds.length) {
        throw new Error("Some selected users are not employees");
      }
    }
    dept.members = memberIds;
  }

  await dept.save();

  return await Department.findById(dept._id)
    .populate("members", "name email role")
    .populate("createdBy", "name email role");
};

/**
 * 📌 DELETE DEPARTMENT
 */
export const deleteDepartment = async (deptId, currentUser) => {
  const actor = await getActor(currentUser);
  const dept = await Department.findOne({ _id: deptId, companyId: actor.companyId });
  if (!dept) throw new Error("Department not found");

  // All admins and super admins can delete any department

  await dept.deleteOne();
  return { message: "Department deleted successfully" };
};
