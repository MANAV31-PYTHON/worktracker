const APP_NAME = "WorkTrack";
const APP_URL  = process.env.APP_URL || "http://localhost:3000";

// ── Base layout ──────────────────────────────────────────────────────────────
const base = (title, content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f6fa;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6fa;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#4f6ef7;border-radius:12px 12px 0 0;padding:28px 36px;text-align:center;">
              <span style="font-size:24px;">⚡</span>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
                ${APP_NAME}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:36px;border-left:1px solid #e4e6ef;border-right:1px solid #e4e6ef;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f0f1f5;border-radius:0 0 12px 12px;border:1px solid #e4e6ef;border-top:none;
                       padding:18px 36px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                This is an automated notification from ${APP_NAME}.
                <br/>Do not reply to this email.
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

// ── Shared components ────────────────────────────────────────────────────────
const taskCard = (task) => {
  const statusColors = {
    PENDING:     "#d97706",
    IN_PROGRESS: "#4f6ef7",
    COMPLETED:   "#16a34a",
    BLOCKED:     "#dc2626",
  };
  const priorityColors = {
    LOW:    "#16a34a",
    MEDIUM: "#d97706",
    HIGH:   "#dc2626",
  };
  const status   = task.status   || "PENDING";
  const priority = task.priority || "MEDIUM";

  return `
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#f5f6fa;border:1px solid #e4e6ef;border-radius:8px;
                  margin:20px 0;padding:0;overflow:hidden;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="margin:0 0 10px;font-size:17px;font-weight:700;color:#1a1d2e;">
            ${task.title}
          </p>
          ${task.description
            ? `<p style="margin:0 0 14px;font-size:14px;color:#6b7280;line-height:1.5;">${task.description}</p>`
            : ""}
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:10px;">
                <span style="background:${statusColors[status]}20;color:${statusColors[status]};
                             font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;
                             text-transform:uppercase;letter-spacing:0.3px;">
                  ${status.replace(/_/g, " ")}
                </span>
              </td>
              <td>
                <span style="color:${priorityColors[priority]};font-size:11px;font-weight:700;
                             text-transform:uppercase;">
                  ${priority}
                </span>
              </td>
            </tr>
          </table>
          ${task.deadline
            ? `<p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">
                 📅 Deadline: ${new Date(task.deadline).toLocaleDateString("en-US", { dateStyle: "medium" })}
               </p>`
            : ""}
          <div style="margin-top:14px;">
            <div style="background:#e4e6ef;border-radius:4px;height:8px;overflow:hidden;">
              <div style="background:#4f6ef7;height:8px;width:${task.progress || 0}%;border-radius:4px;"></div>
            </div>
            <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">Progress: ${task.progress || 0}%</p>
          </div>
        </td>
      </tr>
    </table>
  `;
};

const ctaButton = (label, url) => `
  <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="background:#4f6ef7;border-radius:6px;">
        <a href="${url}" style="display:inline-block;padding:12px 28px;font-size:14px;
                                font-weight:600;color:#ffffff;text-decoration:none;">
          ${label}
        </a>
      </td>
    </tr>
  </table>
`;

const greeting = (name) =>
  `<p style="margin:0 0 6px;font-size:15px;color:#6b7280;">Hello,</p>
   <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#1a1d2e;">${name} 👋</h2>`;

// ── Templates ────────────────────────────────────────────────────────────────

/**
 * Email verification
 */
export const verificationEmail = ({ name, verifyUrl }) =>
  base("Verify your email — WorkTrack", `
    ${greeting(name)}
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 20px;">
      Thanks for signing up! Please verify your email address to activate your WorkTrack account.
    </p>
    <p style="font-size:13px;color:#6b7280;margin:0 0 4px;">
      This link expires in <strong>24 hours</strong>.
    </p>
    ${ctaButton("Verify Email Address", verifyUrl)}
    <p style="font-size:13px;color:#9ca3af;margin:16px 0 0;">
      If you didn't create an account, you can safely ignore this email.
    </p>
  `);

/**
 * Task assigned → sent to employee
 */
export const taskAssignedEmail = ({ employeeName, assignedByName, task }) =>
  base(`New task assigned: ${task.title}`, `
    ${greeting(employeeName)}
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 4px;">
      <strong>${assignedByName}</strong> has assigned you a new task:
    </p>
    ${taskCard(task)}
    ${ctaButton("View Task", `${APP_URL}/tasks`)}
  `);

/**
 * Task assigned → sent to super admins (oversight view)
 */
export const taskAssignedAdminEmail = ({ superAdminName, assignedByName, employeeName, task }) =>
  base(`Task assigned: ${task.title}`, `
    ${greeting(superAdminName)}
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 4px;">
      <strong>${assignedByName}</strong> assigned a task to <strong>${employeeName}</strong>:
    </p>
    ${taskCard(task)}
    ${ctaButton("View All Tasks", `${APP_URL}/tasks`)}
  `);

/**
 * Task updated by employee → sent to admin
 */
export const taskUpdatedAdminEmail = ({ adminName, employeeName, task, oldStatus, oldProgress }) =>
  base(`Task update: ${task.title}`, `
    ${greeting(adminName)}
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 4px;">
      <strong>${employeeName}</strong> updated a task you assigned:
    </p>
    ${taskCard(task)}
    <table cellpadding="0" cellspacing="0" style="margin:4px 0 20px;width:100%;">
      <tr>
        <td style="font-size:13px;color:#6b7280;">
          Status: <strong>${oldStatus?.replace(/_/g, " ")} → ${task.status?.replace(/_/g, " ")}</strong>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          Progress: <strong>${oldProgress}% → ${task.progress}%</strong>
        </td>
      </tr>
    </table>
    ${ctaButton("View Task", `${APP_URL}/tasks`)}
  `);

/**
 * Task completed → sent to admin / super admin
 */
export const taskCompletedEmail = ({ recipientName, employeeName, task }) =>
  base(`✅ Task completed: ${task.title}`, `
    ${greeting(recipientName)}
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 4px;">
      🎉 <strong>${employeeName}</strong> has completed a task:
    </p>
    ${taskCard(task)}
    ${ctaButton("View All Tasks", `${APP_URL}/tasks`)}
  `);

/**
 * Task updated by admin → sent to employee
 */
export const taskUpdatedEmployeeEmail = ({ employeeName, adminName, task }) =>
  base(`Your task was updated: ${task.title}`, `
    ${greeting(employeeName)}
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 4px;">
      <strong>${adminName}</strong> made changes to your task:
    </p>
    ${taskCard(task)}
    ${ctaButton("View My Tasks", `${APP_URL}/tasks`)}
  `);

/**
 * Task deleted → sent to employee
 */
export const taskDeletedEmployeeEmail = ({ employeeName, taskTitle }) =>
  base(`Task removed: ${taskTitle}`, `
    ${greeting(employeeName)}
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0;">
      Your task <strong>"${taskTitle}"</strong> has been removed by an administrator.
    </p>
    <p style="font-size:14px;color:#6b7280;margin:12px 0 0;line-height:1.6;">
      If you have any questions, please contact your manager.
    </p>
    ${ctaButton("View My Tasks", `${APP_URL}/tasks`)}
  `);

/**
 * Task deleted → sent to admin (when super admin deletes)
 */
export const taskDeletedAdminEmail = ({ adminName, taskTitle, employeeName }) =>
  base(`Task removed: ${taskTitle}`, `
    ${greeting(adminName)}
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0;">
      The task <strong>"${taskTitle}"</strong> (assigned to <strong>${employeeName}</strong>)
      has been removed by Super Admin.
    </p>
    ${ctaButton("View All Tasks", `${APP_URL}/tasks`)}
  `);

/**
 * Password reset (for future use)
 */
export const passwordResetEmail = ({ name, resetUrl }) =>
  base("Reset your password — WorkTrack", `
    ${greeting(name)}
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 20px;">
      We received a request to reset your password. Click below to set a new one.
    </p>
    <p style="font-size:13px;color:#6b7280;margin:0 0 4px;">
      This link expires in <strong>1 hour</strong>.
    </p>
    ${ctaButton("Reset Password", resetUrl)}
    <p style="font-size:13px;color:#9ca3af;margin:16px 0 0;">
      If you didn't request a password reset, you can safely ignore this email.
    </p>
  `);
