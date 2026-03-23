import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

export const seedSuperAdmin = async () => {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;
    const name = process.env.SUPER_ADMIN_NAME || "Super Admin";

    if (!email || !password) {
      console.warn(
        "⚠️  SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set in .env — skipping seed"
      );
      return;
    }

    const existing = await User.findOne({ email });

    if (existing) {
      // If exists but isn't SUPER_ADMIN, upgrade them
      if (existing.role !== "SUPER_ADMIN") {
        existing.role = "SUPER_ADMIN";
        await existing.save();
        console.log(`🔑 Upgraded ${email} to SUPER_ADMIN`);
      } else {
        console.log(`✅ Super admin already exists: ${email}`);
      }
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "SUPER_ADMIN",
    });

    console.log(`🌱 Super admin seeded: ${email}`);
  } catch (err) {
    console.error("❌ Super admin seed failed:", err.message);
  }
};
