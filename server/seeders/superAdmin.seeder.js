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

    const existing = await User.findOne({ email }).select("+password");

    if (existing) {
      let updated = false;

      // Always update password
      existing.password = password; // will be hashed by pre-save hook
      updated = true;

      // Ensure role is SUPER_ADMIN
      if (existing.role !== "SUPER_ADMIN") {
        existing.role = "SUPER_ADMIN";
        updated = true;
      }

      if (updated) {
        await existing.save();
        console.log(`🔄 Super admin updated: ${email}`);
      } else {
        console.log(`✅ Super admin already up-to-date: ${email}`);
      }

      return;
    }

    // Create new super admin
    await User.create({
      name,
      email,
      password, // will be hashed automatically
      role: "SUPER_ADMIN",
    });

    console.log(`🌱 Super admin seeded: ${email}`);
  } catch (err) {
    console.error("❌ Super admin seed failed:", err.message);
  }
};