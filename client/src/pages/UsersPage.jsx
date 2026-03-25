import { useState, useEffect, useCallback } from "react";
import {
  UserPlus, Pencil, Trash2, ShieldCheck, UserCheck, UserX,
  Check, Building2, X, Shield, User, Crown,
  AlertCircle, Loader2, Users, Eye, EyeOff, Calendar,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useDialog } from "../components/Dialog";

/* ═══════════════════════════════════════════════════════════
   GLOBAL STYLES
═══════════════════════════════════════════════════════════ */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap');

.up, .up *, .up *::before, .up *::after {
  box-sizing: border-box; margin: 0; padding: 0;
}

/* ── Tokens ── */
.up {
  --white:         #ffffff;
  --bg:            #f0f3ff;
  --surface:       #ffffff;
  --surface-2:     #f7f9ff;
  --surface-3:     #edf0fc;
  --border:        #e2e7f6;
  --border-2:      #ccd3ed;

  --ink-900:       #0e1630;
  --ink-700:       #354068;
  --ink-500:       #6672a0;
  --ink-300:       #a6aecb;
  --ink-100:       #dde3f5;

  --blue:          #4361ee;
  --blue-hover:    #2d4ad4;
  --blue-bg:       #eaedff;
  --blue-border:   #c5ccf8;

  --green:         #15803d;
  --green-bg:      #dcfce7;
  --green-border:  #bbf7d0;

  --red:           #b91c1c;
  --red-bg:        #fee2e2;
  --red-border:    #fecaca;

  --amber:         #92400e;
  --amber-bg:      #fef3c7;
  --amber-border:  #fde68a;

  --violet:        #6d28d9;
  --violet-bg:     #ede9fe;
  --violet-border: #c4b5fd;

  --r-xs:   6px;
  --r-sm:   10px;
  --r-md:   14px;
  --r-lg:   18px;
  --r-xl:   22px;

  --sh-xs:  0 1px 2px rgba(14,22,48,0.05);
  --sh-sm:  0 1px 3px rgba(14,22,48,0.06), 0 2px 8px rgba(14,22,48,0.04);
  --sh-md:  0 4px 16px rgba(14,22,48,0.09), 0 1px 4px rgba(14,22,48,0.05);
  --sh-lg:  0 8px 32px rgba(14,22,48,0.13), 0 2px 8px rgba(14,22,48,0.06);

  --ease:   cubic-bezier(0.4,0,0.2,1);
  --spring: cubic-bezier(0.34,1.56,0.64,1);
  --dur:    0.18s;

  font-family: 'Plus Jakarta Sans', sans-serif;
  color: var(--ink-900);
  background: var(--bg);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ── Page ── */
.up-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 28px 16px 96px;
}
@media (min-width: 640px)  { .up-page { padding: 32px 24px 96px; } }
@media (min-width: 1024px) { .up-page { padding: 40px 32px 96px; } }

/* ── Page Header ── */
.up-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.up-header-meta { display: flex; align-items: center; gap: 8px; margin-top: 7px; flex-wrap: wrap; }
.up-title { font-size: clamp(22px, 4vw, 30px); font-weight: 800; letter-spacing: -0.6px; color: var(--ink-900); }
.up-live { width: 7px; height: 7px; border-radius: 50%; background: var(--green); flex-shrink: 0; animation: upPulse 2.4s ease infinite; }
@keyframes upPulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(21,128,61,0.35); }
  50%      { box-shadow: 0 0 0 5px rgba(21,128,61,0); }
}
.up-count {
  display: inline-flex; align-items: center; gap: 5px;
  background: var(--blue-bg); color: var(--blue);
  font-size: 12px; font-weight: 600;
  padding: 3px 10px; border-radius: 20px;
  font-family: 'JetBrains Mono', monospace;
  border: 1px solid var(--blue-border);
}

/* ── Buttons ── */
.up-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 600; font-size: 14px; line-height: 1;
  border: none; cursor: pointer;
  border-radius: var(--r-sm);
  padding: 10px 18px;
  transition: background var(--dur) var(--ease),
              box-shadow var(--dur) var(--ease),
              transform var(--dur) var(--ease),
              border-color var(--dur) var(--ease),
              color var(--dur) var(--ease);
  white-space: nowrap; flex-shrink: 0;
  text-decoration: none;
}
.up-btn:disabled { opacity: 0.55; pointer-events: none; }
.up-btn:active   { transform: scale(0.97); }

.up-btn-primary {
  background: var(--blue); color: #fff;
  box-shadow: 0 2px 10px rgba(67,97,238,0.28);
}
.up-btn-primary:hover {
  background: var(--blue-hover);
  box-shadow: 0 4px 18px rgba(67,97,238,0.38);
  transform: translateY(-1px);
}
.up-btn-ghost {
  background: var(--surface); color: var(--ink-700);
  border: 1.5px solid var(--border-2);
  box-shadow: var(--sh-xs);
}
.up-btn-ghost:hover { background: var(--surface-2); }

.up-btn-danger  { background: var(--red-bg);   color: var(--red);   border: 1.5px solid var(--red-border); }
.up-btn-danger:hover  { background: #fecaca; }
.up-btn-success { background: var(--green-bg); color: var(--green); border: 1.5px solid var(--green-border); }
.up-btn-success:hover { background: #bbf7d0; }
.up-btn-warn    { background: var(--amber-bg); color: var(--amber); border: 1.5px solid var(--amber-border); }
.up-btn-warn:hover    { background: #fde68a; }

.up-btn-sm  { padding: 7px 13px; font-size: 13px; border-radius: var(--r-xs); }
.up-btn-xs  { padding: 5px 10px; font-size: 12px; border-radius: var(--r-xs); }

.up-icon-btn {
  width: 32px; height: 32px; padding: 0;
  background: transparent; color: var(--ink-300);
  border: 1.5px solid transparent;
  border-radius: var(--r-xs);
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0;
  font-family: inherit;
  transition: all var(--dur) var(--ease);
}
.up-icon-btn:hover {
  background: var(--blue-bg); color: var(--blue);
  border-color: var(--blue-border);
}

/* ── Alert ── */
.up-alert {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px 16px; border-radius: var(--r-sm);
  font-size: 13.5px; font-weight: 500; margin-bottom: 20px;
  background: var(--red-bg); color: var(--red);
  border: 1.5px solid var(--red-border);
  animation: upFadeUp 0.25s var(--ease);
}
.up-alert svg { flex-shrink: 0; margin-top: 1px; }

/* ── Loading ── */
.up-spin { animation: upSpin 0.75s linear infinite; }
@keyframes upSpin { to { transform: rotate(360deg); } }
.up-loading-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 14px; padding: 72px 24px;
  color: var(--ink-500); font-size: 14px; font-weight: 500;
}

/* ── Empty ── */
.up-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; padding: 64px 24px; text-align: center;
}
.up-empty-ico {
  width: 64px; height: 64px; border-radius: var(--r-lg);
  background: var(--blue-bg); color: var(--blue);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 6px; border: 1.5px solid var(--blue-border);
}
.up-empty h3 { font-size: 17px; font-weight: 700; color: var(--ink-700); }
.up-empty p  { font-size: 14px; color: var(--ink-500); max-width: 260px; line-height: 1.55; }

/* ── Card shell ── */
.up-card {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--r-xl);
  box-shadow: var(--sh-sm);
  overflow: hidden;
}

/* ═══════════════════════════════════════════════════════════
   DESKTOP TABLE  (≥ 768px)
═══════════════════════════════════════════════════════════ */
.up-table { width: 100%; border-collapse: collapse; }
.up-table thead tr {
  background: var(--surface-2);
  border-bottom: 1.5px solid var(--border);
}
.up-table th {
  padding: 11px 16px;
  text-align: left; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--ink-300);
  font-family: 'JetBrains Mono', monospace;
}
.up-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
  font-size: 13.5px;
}
.up-table tbody tr { transition: background var(--dur) var(--ease); }
.up-table tbody tr:hover { background: var(--surface-2); }
.up-table tbody tr:last-child td { border-bottom: none; }
.up-table tbody tr { animation: upRowIn 0.3s var(--ease) both; }
@keyframes upRowIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }

/* user cell */
.up-user-cell  { display: flex; align-items: center; gap: 11px; }
.up-user-name  { font-size: 14px; font-weight: 700; color: var(--ink-900); line-height: 1.2; }
.up-user-email { font-size: 12px; color: var(--ink-500); margin-top: 2px; }

/* avatar */
.up-av {
  width: 38px; height: 38px; border-radius: var(--r-sm);
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 800; flex-shrink: 0;
  border: 1.5px solid transparent;
}
.up-av-lg { width: 48px; height: 48px; font-size: 18px; border-radius: var(--r-md); }
.up-av-blue   { background: var(--blue-bg);   color: var(--blue);   border-color: var(--blue-border); }
.up-av-green  { background: var(--green-bg);  color: var(--green);  border-color: var(--green-border); }
.up-av-violet { background: var(--violet-bg); color: var(--violet); border-color: var(--violet-border); }
.up-av-amber  { background: var(--amber-bg);  color: var(--amber);  border-color: var(--amber-border); }

/* badge */
.up-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 9px; border-radius: 20px;
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.06em;
  font-family: 'JetBrains Mono', monospace;
  border: 1.5px solid transparent; white-space: nowrap;
}
.up-badge-active   { background: var(--green-bg);  color: var(--green);  border-color: var(--green-border); }
.up-badge-inactive { background: var(--red-bg);    color: var(--red);    border-color: var(--red-border); }
.up-badge-employee { background: var(--green-bg);  color: var(--green);  border-color: var(--green-border); }
.up-badge-admin    { background: var(--amber-bg);  color: var(--amber);  border-color: var(--amber-border); }
.up-badge-super    { background: var(--violet-bg); color: var(--violet); border-color: var(--violet-border); }

/* role wrap */
.up-role-cell { display: flex; align-items: center; gap: 7px; }

/* dept chip */
.up-dept-list { display: flex; flex-wrap: wrap; gap: 5px; }
.up-dept-chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 9px; border-radius: 6px; font-size: 12px; font-weight: 500;
  background: var(--blue-bg); color: var(--blue);
  border: 1px solid var(--blue-border);
  white-space: nowrap;
}

/* action cell */
.up-action-cell { display: flex; align-items: center; gap: 6px; flex-wrap: nowrap; }

/* dim text */
.up-dim  { color: var(--ink-300); font-size: 12px; }
.up-muted{ color: var(--ink-500); }

/* ═══════════════════════════════════════════════════════════
   MOBILE CARDS  (< 768px)
═══════════════════════════════════════════════════════════ */
.up-cards { display: flex; flex-direction: column; gap: 12px; }

.up-ucard {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--r-lg);
  padding: 16px;
  box-shadow: var(--sh-sm);
  animation: upFadeUp 0.35s var(--ease) both;
  transition: box-shadow var(--dur) var(--ease);
  position: relative; overflow: hidden;
}
.up-ucard::before {
  content: ''; position: absolute;
  left: 0; top: 0; bottom: 0; width: 3.5px;
  background: linear-gradient(180deg, var(--blue) 0%, var(--violet) 100%);
  opacity: 0; transition: opacity var(--dur) var(--ease);
}
.up-ucard:hover { box-shadow: var(--sh-md); }
.up-ucard:hover::before { opacity: 1; }

@keyframes upFadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }

.up-ucard-top {
  display: flex; align-items: flex-start;
  justify-content: space-between; gap: 10px;
}
.up-ucard-identity { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
.up-ucard-text { min-width: 0; }
.up-ucard-name  { font-size: 15px; font-weight: 700; color: var(--ink-900); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.up-ucard-email { font-size: 12.5px; color: var(--ink-500); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
.up-ucard-badges{ display: flex; flex-direction: column; align-items: flex-end; gap: 5px; flex-shrink: 0; }

.up-ucard-divider { height: 1px; background: var(--border); margin: 12px 0; }

.up-ucard-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 10px 12px;
}
.up-ucard-field-label {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.09em; color: var(--ink-300);
  font-family: 'JetBrains Mono', monospace;
  margin-bottom: 4px;
}
.up-ucard-field-val {
  display: flex; align-items: center; flex-wrap: wrap; gap: 4px;
  font-size: 13px; font-weight: 500; color: var(--ink-700);
}

.up-ucard-footer { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
.up-ucard-footer .up-btn { flex: 1; min-width: 0; justify-content: center; }

/* ── Responsive switch ── */
.up-desktop-only { display: none; }
.up-mobile-only  { display: block; }
@media (min-width: 768px) {
  .up-desktop-only { display: block; }
  .up-mobile-only  { display: none;  }
}

/* ═══════════════════════════════════════════════════════════
   MODAL
═══════════════════════════════════════════════════════════ */
.up-overlay {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; align-items: flex-end; justify-content: center;
  background: rgba(14,22,48,0.38);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 0;
  animation: upOverlayIn 0.22s var(--ease);
}
@keyframes upOverlayIn { from { opacity:0; } to { opacity:1; } }
@media (min-width: 600px) { .up-overlay { align-items: center; padding: 24px; } }

.up-modal {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--r-xl) var(--r-xl) 0 0;
  width: 100%; max-height: 93vh;
  overflow-y: auto; overscroll-behavior: contain;
  box-shadow: var(--sh-lg);
  animation: upSlideUp 0.3s var(--spring);
}
.up-modal::-webkit-scrollbar { width: 4px; }
.up-modal::-webkit-scrollbar-thumb { background: var(--border-2); border-radius: 4px; }
.up-modal-handle {
  display: block; width: 40px; height: 4px;
  background: var(--ink-100); border-radius: 4px;
  margin: 14px auto 0;
}

@media (min-width: 600px) {
  .up-modal {
    border-radius: var(--r-xl);
    max-width: 480px;
    animation: upScaleIn 0.28s var(--spring);
  }
  .up-modal-lg { max-width: 530px; }
  .up-modal-handle { display: none; }
}
@keyframes upSlideUp { from { transform:translateY(100%); opacity:.6; } to { transform:none; opacity:1; } }
@keyframes upScaleIn { from { transform:scale(0.92) translateY(8px); opacity:0; } to { transform:none; opacity:1; } }

.up-modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 22px 0;
}
.up-modal-title { font-size: 18px; font-weight: 800; letter-spacing: -0.3px; color: var(--ink-900); }

.up-modal-x {
  width: 32px; height: 32px; border-radius: var(--r-xs);
  background: var(--surface-2); border: 1.5px solid var(--border);
  color: var(--ink-500); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all var(--dur) var(--ease); flex-shrink: 0;
  font-family: inherit;
}
.up-modal-x:hover { background: var(--red-bg); color: var(--red); border-color: var(--red-border); }

.up-modal-body { padding: 20px 22px; }

.up-modal-foot {
  display: flex; gap: 10px; justify-content: flex-end;
  padding: 16px 22px; border-top: 1.5px solid var(--border);
  background: var(--surface-2);
  border-radius: 0 0 var(--r-xl) var(--r-xl);
}
@media (max-width: 599px) {
  .up-modal-foot {
    flex-direction: column-reverse; border-radius: 0;
  }
  .up-modal-foot .up-btn { width: 100%; padding: 13px; font-size: 15px; }
}

/* ── Form Fields ── */
.up-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 0; }
@media (max-width: 520px) { .up-form-row { grid-template-columns: 1fr; } }

.up-field { margin-bottom: 16px; }
.up-field:last-child { margin-bottom: 0; }

.up-label {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 11.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.07em; color: var(--ink-500);
  font-family: 'JetBrains Mono', monospace;
  margin-bottom: 7px;
}
.up-label-opt {
  font-size: 11px; text-transform: none; letter-spacing: 0;
  font-weight: 500; color: var(--ink-300); font-family: 'Plus Jakarta Sans', sans-serif;
}
.up-input {
  width: 100%; padding: 11px 14px;
  background: var(--surface); border: 1.5px solid var(--border);
  border-radius: var(--r-sm); color: var(--ink-900);
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 500;
  outline: none;
  transition: border-color var(--dur), box-shadow var(--dur);
  -webkit-appearance: none; appearance: none;
}
.up-input:hover:not(:focus) { border-color: var(--border-2); }
.up-input:focus { border-color: var(--blue); box-shadow: 0 0 0 3.5px rgba(67,97,238,0.11); }
.up-input::placeholder { color: var(--ink-300); font-weight: 400; }

.up-input-wrap { position: relative; }
.up-input-wrap .up-input { padding-right: 42px; }
.up-input-btn {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer;
  color: var(--ink-300); padding: 5px;
  display: flex; align-items: center;
  border-radius: 5px;
  transition: color var(--dur);
  font-family: inherit;
}
.up-input-btn:hover { color: var(--ink-700); }

/* ── Inline dept ── */
.up-inline-dept {
  margin-top: 10px; padding: 16px;
  background: var(--surface-2); border: 1.5px solid var(--border);
  border-radius: var(--r-md);
  animation: upFadeUp 0.2s var(--ease);
}
.up-inline-dept-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px;
}
.up-inline-dept-head p { font-size: 13px; font-weight: 700; color: var(--ink-700); }
.up-dept-ok { display: flex; align-items: center; gap: 6px; margin-top: 8px; font-size: 13px; color: var(--green); font-weight: 600; }

/* ── Role selector ── */
.up-role-who {
  display: flex; align-items: center; gap: 11px;
  padding: 12px 14px;
  background: var(--surface-2); border: 1.5px solid var(--border);
  border-radius: var(--r-sm); margin-bottom: 16px;
  font-size: 14px; color: var(--ink-700);
}
.up-role-who strong { color: var(--ink-900); font-weight: 700; }

.up-role-opts { display: flex; flex-direction: column; gap: 8px; }
.up-role-opt {
  display: flex; align-items: center; gap: 13px;
  padding: 14px 16px; border-radius: var(--r-md);
  background: var(--surface); border: 1.5px solid var(--border);
  cursor: pointer; transition: all var(--dur) var(--ease);
  user-select: none;
}
.up-role-opt:hover { border-color: var(--border-2); background: var(--surface-2); }
.up-role-opt.active { border-color: var(--blue); background: var(--blue-bg); }
.up-role-opt input[type="radio"] { display: none; }

.up-role-ico {
  width: 40px; height: 40px; border-radius: var(--r-sm);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; border: 1.5px solid transparent;
}
.up-role-ico-emp  { background: var(--green-bg);  color: var(--green);  border-color: var(--green-border); }
.up-role-ico-adm  { background: var(--amber-bg);  color: var(--amber);  border-color: var(--amber-border); }
.up-role-ico-sup  { background: var(--violet-bg); color: var(--violet); border-color: var(--violet-border); }

.up-role-txt { flex: 1; min-width: 0; }
.up-role-name { font-size: 14px; font-weight: 700; color: var(--ink-900); display: block; }
.up-role-desc { font-size: 12.5px; color: var(--ink-500); margin-top: 2px; display: block; line-height: 1.4; }

.up-radio {
  width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
  border: 2px solid var(--border-2); background: var(--surface);
  display: flex; align-items: center; justify-content: center;
  transition: all var(--dur) var(--ease);
}
.up-role-opt.active .up-radio { background: var(--blue); border-color: var(--blue); }
`;

/* ═══════════════════════════════════════════════════════════
   CONSTANTS & HELPERS
═══════════════════════════════════════════════════════════ */
const ALL_ROLES = ["EMPLOYEE", "ADMIN", "SUPER_ADMIN"];

const AV_COLORS = ["up-av-blue", "up-av-green", "up-av-violet", "up-av-amber"];
const avColor = (name = "") => AV_COLORS[(name.charCodeAt(0) || 0) % AV_COLORS.length];

const ROLE_CFG = {
  EMPLOYEE:    { label: "Employee",    badge: "up-badge-employee", Icon: User,   icoCls: "up-role-ico-emp",  desc: "Can view & update their own tasks" },
  ADMIN:       { label: "Admin",       badge: "up-badge-admin",    Icon: Shield, icoCls: "up-role-ico-adm",  desc: "Creates tasks, manages employees" },
  SUPER_ADMIN: { label: "Super Admin", badge: "up-badge-super",    Icon: Crown,  icoCls: "up-role-ico-sup",  desc: "Full access — all users & settings" },
};

/* ── Reusable atoms ── */
function Avatar({ name, lg = false }) {
  return (
    <div className={`up-av ${avColor(name)} ${lg ? "up-av-lg" : ""}`}>
      {name?.charAt(0)?.toUpperCase() ?? "?"}
    </div>
  );
}

function RoleBadge({ role }) {
  const cfg = ROLE_CFG[role] ?? ROLE_CFG.EMPLOYEE;
  return <span className={`up-badge ${cfg.badge}`}>{cfg.label}</span>;
}

function StatusBadge({ active }) {
  return (
    <span className={`up-badge ${active ? "up-badge-active" : "up-badge-inactive"}`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function Spinner({ size = 18 }) {
  return <Loader2 size={size} className="up-spin" />;
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
═══════════════════════════════════════════════════════════ */
export default function UsersPage() {
  const { user }    = useAuth();
  const { confirm } = useDialog();
  const isSA = user?.role === "SUPER_ADMIN";

  const [users,       setUsers]       = useState([]);
  const [departments, setDepts]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [showCreate,  setShowCreate]  = useState(false);
  const [roleModal,   setRoleModal]   = useState(null);

  const fetchAll = useCallback(async () => {
    setError("");
    try {
      const [uR, dR] = await Promise.all([api.get("/users"), api.get("/departments")]);
      setUsers(uR.data);
      setDepts(dR.data);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Build user → dept[] map
  const deptMap = {};
  departments.forEach(d => {
    d.members?.forEach(m => {
      const id = m._id || m;
      if (!deptMap[id]) deptMap[id] = [];
      deptMap[id].push(d.name);
    });
  });

  const doDelete = async (uid, uname) => {
    const ok = await confirm({ title: "Delete User", message: `Delete "${uname}"? This cannot be undone.`, icon: "🗑️", danger: true, confirmLabel: "Delete" });
    if (!ok) return;
    try   { await api.delete(`/users/${uid}`); fetchAll(); }
    catch (e) { await confirm({ type: "alert", title: "Error", message: e.response?.data?.message || "Delete failed", icon: "⚠️", confirmLabel: "OK" }); }
  };

  const doToggle = async (uid) => {
    try   { await api.patch(`/users/${uid}/toggle-active`); fetchAll(); }
    catch (e) { await confirm({ type: "alert", title: "Error", message: e.response?.data?.message || "Update failed", icon: "⚠️", confirmLabel: "OK" }); }
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="up">
      <style>{css}</style>
      <div className="up-page">

        {/* ── Header ── */}
        <div className="up-header">
          <div>
            <h1 className="up-title">Users</h1>
            <div className="up-header-meta">
              <span className="up-live" />
              <span className="up-count">
                <Users size={11} /> {users.length} member{users.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <button className="up-btn up-btn-primary" onClick={() => setShowCreate(true)}>
            <UserPlus size={15} strokeWidth={2.5} /> New User
          </button>
        </div>

        {error && (
          <div className="up-alert"><AlertCircle size={15} /> {error}</div>
        )}

        {/* ── Body ── */}
        {loading ? (
          <div className="up-card">
            <div className="up-loading-state">
              <Spinner size={26} />
              <span>Loading users…</span>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="up-card">
            <div className="up-empty">
              <div className="up-empty-ico"><Users size={28} /></div>
              <h3>No users yet</h3>
              <p>Add your first team member to get started.</p>
              <button className="up-btn up-btn-primary" style={{ marginTop: 8 }} onClick={() => setShowCreate(true)}>
                <UserPlus size={15} /> Add First User
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="up-desktop-only">
              <div className="up-card">
                <table className="up-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => {
                      const depts = deptMap[u._id] || [];
                      return (
                        <tr key={u._id} style={{ animationDelay: `${i * 30}ms` }}>
                          {/* User */}
                          <td>
                            <div className="up-user-cell">
                              <Avatar name={u.name} />
                              <div>
                                <div className="up-user-name">{u.name}</div>
                                <div className="up-user-email">{u.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td>
                            <div className="up-role-cell">
                              <RoleBadge role={u.role} />
                              {isSA && (
                                <button
                                  className="up-icon-btn"
                                  title="Change role"
                                  onClick={() => setRoleModal({ userId: u._id, currentRole: u.role, name: u.name })}
                                >
                                  <Pencil size={13} />
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Department */}
                          <td>
                            {depts.length > 0 ? (
                              <div className="up-dept-list">
                                {depts.map(n => (
                                  <span key={n} className="up-dept-chip">
                                    <Building2 size={10} />{n}
                                  </span>
                                ))}
                              </div>
                            ) : <span className="up-dim">—</span>}
                          </td>

                          {/* Status */}
                          <td><StatusBadge active={u.isActive} /></td>

                          {/* Joined */}
                          <td>
                            <span className="up-muted" style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                              {fmtDate(u.createdAt)}
                            </span>
                          </td>

                          {/* Actions */}
                          <td>
                            <div className="up-action-cell">
                              {isSA && (
                                <button
                                  className={`up-btn up-btn-xs ${u.isActive ? "up-btn-warn" : "up-btn-success"}`}
                                  onClick={() => doToggle(u._id)}
                                >
                                  {u.isActive
                                    ? <><UserX    size={12} strokeWidth={2.5} /> Deactivate</>
                                    : <><UserCheck size={12} strokeWidth={2.5} /> Activate</>}
                                </button>
                              )}
                              <button
                                className="up-btn up-btn-xs up-btn-danger"
                                onClick={() => doDelete(u._id, u.name)}
                              >
                                <Trash2 size={12} strokeWidth={2.5} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MOBILE CARDS */}
            <div className="up-mobile-only">
              <div className="up-cards">
                {users.map((u, i) => {
                  const depts = deptMap[u._id] || [];
                  return (
                    <div key={u._id} className="up-ucard" style={{ animationDelay: `${i * 45}ms` }}>
                      {/* Top row */}
                      <div className="up-ucard-top">
                        <div className="up-ucard-identity">
                          <Avatar name={u.name} lg />
                          <div className="up-ucard-text">
                            <div className="up-ucard-name">{u.name}</div>
                            <div className="up-ucard-email">{u.email}</div>
                          </div>
                        </div>
                        <div className="up-ucard-badges">
                          <StatusBadge active={u.isActive} />
                          <RoleBadge role={u.role} />
                        </div>
                      </div>

                      <div className="up-ucard-divider" />

                      {/* Meta grid */}
                      <div className="up-ucard-grid">
                        <div>
                          <div className="up-ucard-field-label">Department</div>
                          <div className="up-ucard-field-val">
                            {depts.length > 0
                              ? depts.map(n => <span key={n} className="up-dept-chip" style={{ fontSize: 11 }}><Building2 size={10} />{n}</span>)
                              : <span className="up-dim">—</span>}
                          </div>
                        </div>
                        <div>
                          <div className="up-ucard-field-label">Joined</div>
                          <div className="up-ucard-field-val">
                            <Calendar size={12} style={{ color: "var(--ink-300)" }} />
                            {fmtDate(u.createdAt)}
                          </div>
                        </div>
                      </div>

                      {/* Footer actions */}
                      <div className="up-ucard-footer">
                        {isSA && (
                          <button
                            className={`up-btn up-btn-sm ${u.isActive ? "up-btn-warn" : "up-btn-success"}`}
                            onClick={() => doToggle(u._id)}
                          >
                            {u.isActive
                              ? <><UserX    size={14} strokeWidth={2.5} /> Deactivate</>
                              : <><UserCheck size={14} strokeWidth={2.5} /> Activate</>}
                          </button>
                        )}
                        {isSA && (
                          <button
                            className="up-btn up-btn-sm up-btn-ghost"
                            onClick={() => setRoleModal({ userId: u._id, currentRole: u.role, name: u.name })}
                          >
                            <Pencil size={14} strokeWidth={2.5} /> Role
                          </button>
                        )}
                        <button
                          className="up-btn up-btn-sm up-btn-danger"
                          onClick={() => doDelete(u._id, u.name)}
                        >
                          <Trash2 size={14} strokeWidth={2.5} /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {showCreate && (
        <CreateUserModal
          currentUser={user}
          onClose={() => setShowCreate(false)}
          onCreated={fetchAll}
        />
      )}
      {roleModal && (
        <ChangeRoleModal
          {...roleModal}
          onClose={() => setRoleModal(null)}
          onUpdated={fetchAll}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CREATE USER MODAL
═══════════════════════════════════════════════════════════ */
function CreateUserModal({ currentUser, onClose, onCreated }) {
  const isSA = currentUser?.role === "SUPER_ADMIN";
  const allowedRoles = isSA ? ALL_ROLES : ["EMPLOYEE"];

  const [form, setForm]             = useState({ name: "", email: "", password: "", role: "EMPLOYEE", departmentId: "" });
  const [departments, setDepts]     = useState([]);
  const [deptsLoading, setDL]       = useState(true);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [showPwd, setShowPwd]       = useState(false);
  const [inlineDept, setInlineDept] = useState(false);
  const [newDept, setNewDept]       = useState({ name: "", description: "" });
  const [deptSaving, setDS]         = useState(false);
  const [deptError, setDE]          = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const loadDepts = async () => {
    try { const r = await api.get("/departments"); setDepts(r.data); }
    catch {}
    finally { setDL(false); }
  };
  useEffect(() => { loadDepts(); }, []);

  const saveDept = async () => {
    if (!newDept.name.trim()) return;
    setDS(true); setDE("");
    try {
      const r = await api.post("/departments", { name: newDept.name.trim(), description: newDept.description.trim(), memberIds: [] });
      await loadDepts();
      set("departmentId", r.data._id);
      setInlineDept(false);
      setNewDept({ name: "", description: "" });
    } catch (e) { setDE(e.response?.data?.message || "Failed to create"); }
    finally { setDS(false); }
  };

  const submit = async () => {
    setLoading(true); setError("");
    try { await api.post("/users", form); onCreated(); onClose(); }
    catch (e) { setError(e.response?.data?.message || "Failed to create user"); }
    finally { setLoading(false); }
  };

  const selDept = departments.find(d => d._id === form.departmentId);
  const canSubmit = form.name.trim() && form.email.trim() && form.password.length >= 6;

  return (
    <div className="up">
      <div className="up-overlay" onClick={onClose}>
        <div className="up-modal up-modal-lg" onClick={e => e.stopPropagation()}>
          <span className="up-modal-handle" />

          <div className="up-modal-head">
            <span className="up-modal-title">Create User</span>
            <button className="up-modal-x" onClick={onClose}><X size={15} /></button>
          </div>

          <div className="up-modal-body">
            {error && <div className="up-alert"><AlertCircle size={15} /> {error}</div>}

            <div className="up-form-row up-field">
              <div className="up-field" style={{ marginBottom: 0 }}>
                <div className="up-label">Full Name</div>
                <input className="up-input" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Jane Doe" />
              </div>
              <div className="up-field" style={{ marginBottom: 0 }}>
                <div className="up-label">Role</div>
                <select className="up-input" value={form.role} onChange={e => { set("role", e.target.value); set("departmentId", ""); }}>
                  {allowedRoles.map(r => (
                    <option key={r} value={r}>{ROLE_CFG[r]?.label ?? r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="up-field">
              <div className="up-label">Email Address</div>
              <input className="up-input" type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="jane@company.com" />
            </div>

            <div className="up-field">
              <div className="up-label">Password</div>
              <div className="up-input-wrap">
                <input
                  className="up-input"
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={e => set("password", e.target.value)}
                  placeholder="Min. 6 characters"
                  minLength={6}
                />
                <button type="button" className="up-input-btn" onClick={() => setShowPwd(p => !p)}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {form.role === "EMPLOYEE" && (
              <div className="up-field">
                <div className="up-label">
                  Department <span className="up-label-opt">optional</span>
                </div>
                {deptsLoading ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 0", color: "var(--ink-500)", fontSize: 13 }}>
                    <Spinner size={14} /> Loading…
                  </div>
                ) : (
                  <>
                    <select
                      className="up-input"
                      value={form.departmentId}
                      onChange={e => {
                        if (e.target.value === "__new__") {
                          setInlineDept(true); set("departmentId", "");
                        } else {
                          setInlineDept(false); set("departmentId", e.target.value);
                        }
                      }}
                    >
                      <option value="">No department</option>
                      {departments.map(d => (
                        <option key={d._id} value={d._id}>{d.name} ({d.members?.length ?? 0} members)</option>
                      ))}
                      <option value="__new__">＋ Create new department…</option>
                    </select>

                    {selDept && !inlineDept && (
                      <div className="up-dept-ok">
                        <Check size={14} /> Will join <strong style={{ marginLeft: 3 }}>{selDept.name}</strong>
                      </div>
                    )}

                    {inlineDept && (
                      <div className="up-inline-dept">
                        <div className="up-inline-dept-head">
                          <p>New Department</p>
                          <button type="button" className="up-modal-x" style={{ width: 26, height: 26 }} onClick={() => { setInlineDept(false); setDE(""); }}>
                            <X size={13} />
                          </button>
                        </div>
                        {deptError && <div className="up-alert" style={{ marginBottom: 12 }}><AlertCircle size={14} /> {deptError}</div>}
                        <div className="up-field">
                          <div className="up-label">Name *</div>
                          <input className="up-input" value={newDept.name} onChange={e => setNewDept(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Engineering" />
                        </div>
                        <div className="up-field">
                          <div className="up-label">Description</div>
                          <input className="up-input" value={newDept.description} onChange={e => setNewDept(p => ({ ...p, description: e.target.value }))} placeholder="Optional" />
                        </div>
                        <button
                          type="button"
                          className="up-btn up-btn-primary up-btn-sm"
                          onClick={saveDept}
                          disabled={deptSaving || !newDept.name.trim()}
                        >
                          {deptSaving ? <Spinner size={14} /> : <><Check size={14} /> Create & Select</>}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="up-modal-foot">
            <button type="button" className="up-btn up-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="button" className="up-btn up-btn-primary" disabled={loading || !canSubmit} onClick={submit}>
              {loading ? <Spinner size={15} /> : <><UserPlus size={15} /> Create User</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CHANGE ROLE MODAL
═══════════════════════════════════════════════════════════ */
function ChangeRoleModal({ userId, currentRole, name, onClose, onUpdated }) {
  const [role,    setRole]    = useState(currentRole);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const submit = async () => {
    if (role === currentRole) { onClose(); return; }
    setLoading(true); setError("");
    try { await api.patch(`/users/${userId}/role`, { role }); onUpdated(); onClose(); }
    catch (e) { setError(e.response?.data?.message || "Failed to update role"); }
    finally { setLoading(false); }
  };

  const OPTS = [
    { value: "EMPLOYEE",    Icon: User,   cls: "up-role-ico-emp",  label: "Employee",    desc: "Can view & update their own tasks" },
    { value: "ADMIN",       Icon: Shield, cls: "up-role-ico-adm",  label: "Admin",       desc: "Creates tasks, manages employees" },
    { value: "SUPER_ADMIN", Icon: Crown,  cls: "up-role-ico-sup",  label: "Super Admin", desc: "Full access — all users & settings" },
  ];

  return (
    <div className="up">
      <div className="up-overlay" onClick={onClose}>
        <div className="up-modal" onClick={e => e.stopPropagation()}>
          <span className="up-modal-handle" />

          <div className="up-modal-head">
            <span className="up-modal-title">Change Role</span>
            <button className="up-modal-x" onClick={onClose}><X size={15} /></button>
          </div>

          <div className="up-modal-body">
            {error && <div className="up-alert"><AlertCircle size={15} /> {error}</div>}

            <div className="up-role-who">
              <Avatar name={name} />
              <span>Updating role for <strong>{name}</strong></span>
            </div>

            <div className="up-role-opts">
              {OPTS.map(o => (
                <label
                  key={o.value}
                  className={`up-role-opt ${role === o.value ? "active" : ""}`}
                  onClick={() => setRole(o.value)}
                >
                  <input type="radio" name="role" value={o.value} checked={role === o.value} onChange={() => setRole(o.value)} />
                  <div className={`up-role-ico ${o.cls}`}>
                    <o.Icon size={18} strokeWidth={2} />
                  </div>
                  <div className="up-role-txt">
                    <span className="up-role-name">{o.label}</span>
                    <span className="up-role-desc">{o.desc}</span>
                  </div>
                  <div className="up-radio">
                    {role === o.value && <Check size={11} color="#fff" strokeWidth={3} />}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="up-modal-foot">
            <button type="button" className="up-btn up-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="button" className="up-btn up-btn-primary" disabled={loading} onClick={submit}>
              {loading ? <Spinner size={15} /> : <><ShieldCheck size={15} /> Update Role</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}