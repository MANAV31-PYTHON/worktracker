import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const registerUser = async (data) => {
  const { name, email, password } = data;

  if (!name || !email || !password) {
    throw new Error("Name, email and password are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error("User already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    name,
    email,
    password: hashedPassword,
    role: "EMPLOYEE",
  });

  return { message: "Account created successfully. You can now log in." };
};

export const loginUser = async (data) => {
  if (!data) throw new Error("Request body is missing");

  const { email, password } = data;
  if (!email || !password) throw new Error("Email and password required");

  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid credentials");

  if (!user.isActive) throw new Error("Account is deactivated. Contact your administrator.");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return { user, token };
};
