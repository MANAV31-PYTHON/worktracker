/**
 * notificationHelper.js — WorkTrack
 *
 * Decides whether a status/progress change is significant enough to notify.
 * Rules:
 *   Any status change        → always notify
 *   Progress jump >= 10%     → notify
 *   Anything smaller         → skip (prevents noise on every small keystroke)
 */
export const shouldSendUpdate = ({ oldStatus, newStatus, oldProgress, newProgress }) => {
  if (!oldStatus || !newStatus) return false;
  if (oldStatus !== newStatus)  return true;
  const prev = Number(oldProgress ?? 0);
  const next  = Number(newProgress  ?? 0);
  return Math.abs(next - prev) >= 10;
};