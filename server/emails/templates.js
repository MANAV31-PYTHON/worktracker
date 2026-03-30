/**
 * templates.js — WorkTrack transactional email templates
 */

const APP_NAME = "WorkTrack";
const APP_URL  = process.env.APP_URL || "http://localhost:3000";

// ─────────────────────────────────────────────────────────────────
// Safe value guards — nothing renders as "undefined"
// ─────────────────────────────────────────────────────────────────
const safe         = (v, fb = "—")      => (v !== undefined && v !== null && v !== "") ? v : fb;
const safeNum      = (v, fb = 0)        => { const n = Number(v); return isNaN(n) ? fb : n; };
const safeStatus   = (v, fb = "PENDING") => {
  const VALID = ["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED"];
  return VALID.includes(v) ? v : fb;
};
const safePriority = (v, fb = "MEDIUM") => {
  const VALID = ["LOW", "MEDIUM", "HIGH"];
  return VALID.includes(v) ? v : fb;
};

// ─────────────────────────────────────────────────────────────────
// Base layout
// ─────────────────────────────────────────────────────────────────
const base = (title, content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f8;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background:#f0f2f8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#3b55e0 0%,#4f6ef7 60%,#7b8ff5 100%);
                        border-radius:14px 14px 0 0;padding:32px 40px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td style="background:rgba(255,255,255,.15);border-radius:10px;padding:8px 18px;">
                    <span style="font-size:20px;vertical-align:middle;">⚡</span>
                    <span style="font-size:20px;font-weight:800;color:#fff;
                                 letter-spacing:-0.5px;vertical-align:middle;margin-left:6px;">
                      ${APP_NAME}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;
                        border-left:1px solid #e2e5f1;border-right:1px solid #e2e5f1;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f7f8fc;border-radius:0 0 14px 14px;
                        border:1px solid #e2e5f1;border-top:none;
                        padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                Automated notification from <strong>${APP_NAME}</strong>.
                Please do not reply to this email.
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#c4c9d8;">
                &copy; ${new Date().getFullYear()} ${APP_NAME} &nbsp;·&nbsp; All rights reserved
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ─────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────
const STATUS_META = {
  PENDING:     { color: "#d97706", bg: "#fef3c7", label: "Pending" },
  IN_PROGRESS: { color: "#4f6ef7", bg: "#eff2ff", label: "In Progress" },
  COMPLETED:   { color: "#16a34a", bg: "#dcfce7", label: "Completed" },
  BLOCKED:     { color: "#dc2626", bg: "#fee2e2", label: "Blocked" },
};
const PRIORITY_META = {
  LOW:    { color: "#16a34a", icon: "↓" },
  MEDIUM: { color: "#d97706", icon: "→" },
  HIGH:   { color: "#dc2626", icon: "↑" },
};

// ─────────────────────────────────────────────────────────────────
// Shared components
// ─────────────────────────────────────────────────────────────────
const taskCard = (task) => {
  const status   = safeStatus  (task?.overallStatus  ?? task?.status);
  const priority = safePriority(task?.priority);
  const progress = safeNum     (task?.overallProgress ?? task?.progress);
  const sm       = STATUS_META[status]     ?? STATUS_META.PENDING;
  const pm       = PRIORITY_META[priority] ?? PRIORITY_META.MEDIUM;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background:#f7f8fc;border:1px solid #e2e5f1;border-radius:10px;
                  margin:20px 0;overflow:hidden;">
      <tr>
        <td style="background:${sm.color};height:4px;font-size:0;line-height:0;">&nbsp;</td>
      </tr>
      <tr>
        <td style="padding:20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

            <!-- Title -->
            <tr>
              <td style="padding-bottom:10px;">
                <p style="margin:0;font-size:17px;font-weight:700;color:#1a1d2e;line-height:1.3;">
                  ${safe(task?.title, "Untitled Task")}
                </p>
              </td>
            </tr>

            ${task?.description ? `
            <!-- Description -->
            <tr>
              <td style="padding-bottom:14px;">
                <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
                  ${task.description}
                </p>
              </td>
            </tr>` : ""}

            <!-- Badges -->
            <tr>
              <td style="padding-bottom:14px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:8px;">
                      <span style="display:inline-block;background:${sm.bg};color:${sm.color};
                                   font-size:11px;font-weight:700;padding:4px 12px;
                                   border-radius:20px;letter-spacing:0.4px;text-transform:uppercase;
                                   border:1px solid ${sm.color}30;">
                        ${sm.label}
                      </span>
                    </td>
                    <td>
                      <span style="font-size:11px;font-weight:700;color:${pm.color};
                                   text-transform:uppercase;letter-spacing:0.4px;">
                        ${pm.icon} ${priority} PRIORITY
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            ${task?.deadline ? `
            <!-- Deadline -->
            <tr>
              <td style="padding-bottom:14px;">
                <span style="font-size:12px;color:#6b7280;">
                  📅 Deadline:
                  <strong style="color:#374151;">
                    ${new Date(task.deadline).toLocaleDateString("en-US", { dateStyle: "medium" })}
                  </strong>
                </span>
              </td>
            </tr>` : ""}

            <!-- Progress bar -->
            <tr>
              <td style="padding-top:4px;">
                <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#374151;">
                  Progress &nbsp;
                  <span style="color:${sm.color};font-size:13px;">${progress}%</span>
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:#e4e6ef;border-radius:6px;height:10px;
                               overflow:hidden;font-size:0;line-height:0;">
                      <div style="background:linear-gradient(90deg,${sm.color}cc,${sm.color});
                                  height:10px;width:${progress}%;border-radius:6px;
                                  min-width:${progress > 0 ? "6px" : "0"};"></div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  `;
};

const ctaButton = (label, url) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 4px;">
    <tr>
      <td style="background:linear-gradient(135deg,#3b55e0,#4f6ef7);border-radius:8px;
                  box-shadow:0 4px 14px rgba(79,110,247,.35);">
        <a href="${url}"
           style="display:inline-block;padding:14px 32px;font-size:14px;
                  font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.2px;">
          ${label} &rarr;
        </a>
      </td>
    </tr>
  </table>
`;

const divider = () =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
     <tr><td style="border-top:1px solid #e2e5f1;font-size:0;line-height:0;">&nbsp;</td></tr>
   </table>`;

const greeting = (name) =>
  `<p style="margin:0 0 4px;font-size:14px;color:#9ca3af;">Hello,</p>
   <h2 style="margin:0 0 24px;font-size:22px;font-weight:800;color:#1a1d2e;letter-spacing:-0.5px;">
     ${safe(name, "there")} 👋
   </h2>`;

const alertBox = (message, type = "info") => {
  const c = {
    info:    { bg: "#eff2ff", border: "#4f6ef7", text: "#3b55e0", icon: "ℹ️" },
    success: { bg: "#dcfce7", border: "#16a34a", text: "#15803d", icon: "✅" },
    warning: { bg: "#fef3c7", border: "#d97706", text: "#92400e", icon: "⚠️" },
    danger:  { bg: "#fee2e2", border: "#dc2626", text: "#991b1b", icon: "🚨" },
  }[type] ?? { bg: "#eff2ff", border: "#4f6ef7", text: "#3b55e0", icon: "ℹ️" };
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background:${c.bg};border-left:4px solid ${c.border};
                  border-radius:0 8px 8px 0;margin:20px 0;">
      <tr>
        <td style="padding:14px 18px;">
          <p style="margin:0;font-size:14px;color:${c.text};font-weight:600;line-height:1.5;">
            ${c.icon}&nbsp; ${message}
          </p>
        </td>
      </tr>
    </table>
  `;
};

// ─────────────────────────────────────────────────────────────────
// Templates
// ─────────────────────────────────────────────────────────────────

/** Email verification */
export const verificationEmail = ({ name, verifyUrl }) =>
  base("Verify your email — WorkTrack", `
    ${greeting(name)}
    <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px;">
      Thanks for signing up! Verify your email to activate your <strong>${APP_NAME}</strong> account.
    </p>
    ${alertBox("This link expires in <strong>24 hours</strong>.", "warning")}
    ${ctaButton("Verify Email Address", verifyUrl)}
    ${divider()}
    <p style="font-size:13px;color:#9ca3af;margin:0;">
      If you didn't create an account, you can safely ignore this email.
    </p>
  `);

/** Password reset request */
export const passwordResetEmail = ({ name, resetURL }) =>
  base("Reset your password — WorkTrack", `
    ${greeting(name)}
    <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px;">
      We received a request to reset the password for your ${APP_NAME} account.
    </p>
    ${alertBox("This link expires in <strong>15 minutes</strong>.", "warning")}
    ${ctaButton("Reset Password", resetURL)}
    ${divider()}
    <p style="font-size:13px;color:#9ca3af;margin:0;">
      If you didn't request this, you can safely ignore this email.
    </p>
  `);

/** Password changed confirmation */
export const passwordChangedEmail = ({ name }) =>
  base("Password changed — WorkTrack", `
    ${greeting(name)}
    <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px;">
      Your ${APP_NAME} password was successfully changed.
    </p>
    ${alertBox(
      "If you did NOT make this change, contact support immediately.",
      "danger"
    )}
    ${ctaButton("Go to Login", `${APP_URL}/login`)}
    ${divider()}
    <p style="font-size:13px;color:#9ca3af;margin:0;">
      This is a security notification from ${APP_NAME}.
    </p>
  `);

/** Task assigned → employee */
export const taskAssignedEmail = ({ employeeName, assignedByName, task }) =>
  base(`New task assigned: ${safe(task?.title, "a task")}`, `
    ${greeting(employeeName)}
    <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 4px;">
      <strong>${safe(assignedByName, "An admin")}</strong> has assigned you a new task:
    </p>
    ${taskCard(task)}
    ${ctaButton("View My Tasks", `${APP_URL}/tasks`)}
  `);

/** Task assigned → super admin oversight */
export const taskAssignedAdminEmail = ({ superAdminName, assignedByName, employeeName, task }) =>
  base(`Task assigned: ${safe(task?.title, "a task")}`, `
    ${greeting(superAdminName)}
    <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 4px;">
      <strong>${safe(assignedByName, "An admin")}</strong> assigned a new task to
      <strong>${safe(employeeName, "an employee")}</strong>:
    </p>
    ${taskCard(task)}
    ${ctaButton("View All Tasks", `${APP_URL}/tasks`)}
  `);

/**
 * Task updated → admin
 * No "What Changed" diff — just the current task state.
 * Routes to completed variant automatically when overallStatus = COMPLETED.
 */
export const taskUpdatedAdminEmail = ({ adminName, employeeName, task }) =>
  base(`Task update: ${safe(task?.title, "a task")}`, `
    ${greeting(adminName)}
    <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 4px;">
      <strong>${safe(employeeName, "An employee")}</strong> made progress on your task:
    </p>
    ${taskCard(task)}
    ${ctaButton("View Task", `${APP_URL}/tasks`)}
  `);

/** Task completed → admin / super admin */
export const taskCompletedEmail = ({ recipientName, employeeName, task }) =>
  base(`✅ Task completed: ${safe(task?.title, "a task")}`, `
    ${greeting(recipientName)}
    <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 4px;">
      🎉 <strong>${safe(employeeName, "An employee")}</strong> has completed a task:
    </p>
    ${taskCard(task)}
    ${ctaButton("View All Tasks", `${APP_URL}/tasks`)}
  `);

/** Task updated → employee */
export const taskUpdatedEmployeeEmail = ({ employeeName, adminName, task }) =>
  base(`Your task was updated: ${safe(task?.title, "a task")}`, `
    ${greeting(employeeName)}
    <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 4px;">
      <strong>${safe(adminName, "An admin")}</strong> made changes to your task:
    </p>
    ${taskCard(task)}
    ${ctaButton("View My Tasks", `${APP_URL}/tasks`)}
  `);

/** Task deleted → employee */
export const taskDeletedEmployeeEmail = ({ employeeName, taskTitle }) =>
  base(`Task removed: ${safe(taskTitle, "a task")}`, `
    ${greeting(employeeName)}
    <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
      The task <strong>"${safe(taskTitle, "a task")}"</strong> has been removed by an administrator.
    </p>
    ${alertBox("If you have questions about this removal, please contact your manager.", "info")}
    ${ctaButton("View My Tasks", `${APP_URL}/tasks`)}
  `);

/** Task deleted → admin (when super admin deletes) */
export const taskDeletedAdminEmail = ({ adminName, taskTitle, employeeName }) =>
  base(`Task removed: ${safe(taskTitle, "a task")}`, `
    ${greeting(adminName)}
    <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px;">
      The task <strong>"${safe(taskTitle, "a task")}"</strong>
      (assigned to <strong>${safe(employeeName, "an employee")}</strong>)
      has been removed by a Super Admin.
    </p>
    ${ctaButton("View All Tasks", `${APP_URL}/tasks`)}
  `);