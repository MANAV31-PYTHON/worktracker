import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";   

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: { type: String, unique: true, required: true },

    password: { 
      type: String, 
      required: true,
      select: false   // 🔐 hide password by default
    },

    role: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"],
      default: "EMPLOYEE",
    },

    isActive: { type: Boolean, default: true },

    // 🔐 Reset password fields
    resetPasswordToken: {
      type: String,
      select: false   // hide from queries
    },

    resetPasswordExpire: {
      type: Date,
      select: false   // hide from queries
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

export default mongoose.model("User", userSchema);
