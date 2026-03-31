import PersonalTask from "../models/personalTask.model.js";

export const createPersonalTask = async (data, currentUser) => {
  const { title, description, priority, deadline, status, progress } = data;
  if (!title) throw new Error("Title is required");

  return PersonalTask.create({
    title,
    description,
    priority:  priority  || "MEDIUM",
    deadline:  deadline  || null,
    status:    status    || "PENDING",
    progress:  progress  ?? 0,
    createdBy: currentUser.id,
  });
};

export const getPersonalTasks = async (currentUser) => {
  return PersonalTask.find({ createdBy: currentUser.id, isDeleted: false })
    .sort({ createdAt: -1 });
};

export const updatePersonalTask = async (taskId, data, currentUser) => {
  const task = await PersonalTask.findOne({
    _id: taskId,
    createdBy: currentUser.id,
    isDeleted: false,
  });
  if (!task) throw new Error("Task not found");

  const { title, description, priority, deadline, status, progress } = data;
  if (title       !== undefined) task.title       = title;
  if (description !== undefined) task.description = description;
  if (priority    !== undefined) task.priority    = priority;
  if (deadline    !== undefined) task.deadline    = deadline;
  if (status      !== undefined) task.status      = status;
  if (progress    !== undefined) task.progress    = Number(progress);

  await task.save();
  return task;
};

export const deletePersonalTask = async (taskId, currentUser) => {
  const task = await PersonalTask.findOne({
    _id: taskId,
    createdBy: currentUser.id,
    isDeleted: false,
  });
  if (!task) throw new Error("Task not found");

  task.isDeleted = true;
  await task.save();
  return { message: "Personal task deleted" };
};