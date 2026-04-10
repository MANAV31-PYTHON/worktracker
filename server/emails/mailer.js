/**
 * mailer.js — BOMEGROW email dispatch layer
 * Fire-and-forget. Never throws. Always logs.
 */

import transporter from "../config/email.js";
import {
  verificationEmail,
  taskAssignedEmail,
  taskAssignedAdminEmail,
  taskUpdatedAdminEmail,
  taskCompletedEmail,
  taskUpdatedEmployeeEmail,
  taskDeletedEmployeeEmail,
  taskDeletedAdminEmail,
  passwordResetEmail,
  passwordChangedEmail,
} from "./templates.js";

const clean = (val) => (val || "").replace(/^["']|["']$/g, "").trim();
const FROM  = clean(process.env.EMAIL_FROM) || "BOMEGROW <no-reply@bomegro.com>";

const safeStatus = (v) => {
  const VALID = ["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED"];
  return VALID.includes(v) ? v : "PENDING";
};

const send = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(`⚠️  [Mailer] Not configured — skipping: ${to}`);
    return;
  }
  if (!to) {
    console.warn("⚠️  [Mailer] No recipient — skipping.");
    return;
  }
  try {
    const info = await transporter.sendMail({ from: FROM, to, subject, html });
    console.log(`📧 [Mailer] Sent to ${to} — id: ${info.messageId}`);
  } catch (err) {
    console.error(`❌ [Mailer] Failed to ${to} — "${subject}" — ${err.message}`);
  }
};

// ── Auth ──────────────────────────────────────────────────────────────────────

export const sendVerificationEmail = (user, token) => {
  const verifyUrl = `${process.env.APP_URL || "http://localhost:3000"}/verify-email?token=${token}`;
  return send({
    to: user.email,
    subject: "Verify your BOMEGROW email",
    html: verificationEmail({ name: user.name, verifyUrl }),
  });
};

export const sendPasswordResetEmail = (user, resetURL) =>
  send({
    to: user.email,
    subject: "Reset your BOMEGROW password",
    html: passwordResetEmail({ name: user.name, resetURL }),
  });

export const sendPasswordChangedEmail = (user) =>
  send({
    to: user.email,
    subject: "Your BOMEGROW password was changed",
    html: passwordChangedEmail({ name: user.name }),
  });

// ── Task ──────────────────────────────────────────────────────────────────────

export const sendTaskAssignedToEmployee = (employee, assignedByName, task) =>
  send({
    to: employee.email,
    subject: `New task assigned: "${task.title}"`,
    html: taskAssignedEmail({ employeeName: employee.name, assignedByName, task }),
  });

export const sendTaskAssignedToSuperAdmin = (superAdmin, assignedByName, employeeName, task) =>
  send({
    to: superAdmin.email,
    subject: `[BOMEGROW] Task assigned: "${task.title}"`,
    html: taskAssignedAdminEmail({
      superAdminName: superAdmin.name,
      assignedByName,
      employeeName,
      task,
    }),
  });

/**
 * sendTaskUpdatedToAdmin
 *
 * Single entry point for all admin update emails.
 * Automatically routes to taskCompletedEmail when overallStatus = COMPLETED,
 * otherwise sends taskUpdatedAdminEmail (no diff / "What Changed" section).
 *
 * Works with both Mongoose documents and plain objects.
 */
export const sendTaskUpdatedToAdmin = (admin, employeeName, task, _oldStatus, _oldProgress) => {
  const effectiveStatus = safeStatus(task?.overallStatus ?? task?.status);
  const isCompleted     = effectiveStatus === "COMPLETED";

  if (isCompleted) {
    return send({
      to: admin.email,
      subject: `✅ Task completed: "${task.title}"`,
      html: taskCompletedEmail({
        recipientName: admin.name,
        employeeName,
        task,
      }),
    });
  }

  return send({
    to: admin.email,
    subject: `Task update: "${task.title}"`,
    html: taskUpdatedAdminEmail({
      adminName: admin.name,
      employeeName,
      task,
      // oldStatus and oldProgress intentionally NOT passed —
      // "What Changed" section has been removed from the template.
    }),
  });
};

export const sendTaskUpdatedToEmployee = (employee, adminName, task) =>
  send({
    to: employee.email,
    subject: `Your task was updated: "${task.title}"`,
    html: taskUpdatedEmployeeEmail({ employeeName: employee.name, adminName, task }),
  });

export const sendTaskDeletedToEmployee = (employee, taskTitle) =>
  send({
    to: employee.email,
    subject: `Task removed: "${taskTitle}"`,
    html: taskDeletedEmployeeEmail({ employeeName: employee.name, taskTitle }),
  });

export const sendTaskDeletedToAdmin = (admin, taskTitle, employeeName) =>
  send({
    to: admin.email,
    subject: `Task removed: "${taskTitle}"`,
    html: taskDeletedAdminEmail({ adminName: admin.name, taskTitle, employeeName }),
  });
