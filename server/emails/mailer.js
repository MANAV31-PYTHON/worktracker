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
} from "./templates.js";

const clean = (val) => (val || "").replace(/^["']|["']$/g, "").trim();
const FROM = clean(process.env.EMAIL_FROM) || "WorkTrack <no-reply@worktrack.app>";

/**
 * Core send helper — never throws, always logs
 */
const send = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️  Email not configured — skipping send to:", to);
    return;
  }
  try {
    const info = await transporter.sendMail({ from: FROM, to, subject, html });
    console.log(`📧 Email sent to ${to} — ${info.messageId}`);
  } catch (err) {
    console.error(`❌ Email failed to ${to}:`, err.message);
  }
};

// ── Verification ─────────────────────────────────────────────────────────────

export const sendVerificationEmail = (user, token) => {
  const verifyUrl = `${process.env.APP_URL || "http://localhost:3000"}/verify-email?token=${token}`;
  return send({
    to: user.email,
    subject: "Verify your WorkTrack email",
    html: verificationEmail({ name: user.name, verifyUrl }),
  });
};

// ── Task notifications ────────────────────────────────────────────────────────

export const sendTaskAssignedToEmployee = (employee, assignedByName, task) =>
  send({
    to: employee.email,
    subject: `New task assigned: "${task.title}"`,
    html: taskAssignedEmail({ employeeName: employee.name, assignedByName, task }),
  });

export const sendTaskAssignedToSuperAdmin = (superAdmin, assignedByName, employeeName, task) =>
  send({
    to: superAdmin.email,
    subject: `[WorkTrack] Task assigned: "${task.title}"`,
    html: taskAssignedAdminEmail({
      superAdminName: superAdmin.name,
      assignedByName,
      employeeName,
      task,
    }),
  });

export const sendTaskUpdatedToAdmin = (admin, employeeName, task, oldStatus, oldProgress) => {
  const isCompleted = task.status === "COMPLETED";
  if (isCompleted) {
    return send({
      to: admin.email,
      subject: `✅ Task completed: "${task.title}"`,
      html: taskCompletedEmail({ recipientName: admin.name, employeeName, task }),
    });
  }
  return send({
    to: admin.email,
    subject: `Task update: "${task.title}"`,
    html: taskUpdatedAdminEmail({ adminName: admin.name, employeeName, task, oldStatus, oldProgress }),
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
