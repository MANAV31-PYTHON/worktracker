import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";
import { Lock, Eye, EyeOff, Zap, ShieldCheck, AlertCircle, ArrowRight, CheckCircle } from "lucide-react";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  /* Basic strength meter */
  const getStrength = (pw) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const strength = getStrength(form.password);
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["", "#dc2626", "#d97706", "#2563eb", "#059669"];
  const strengthBg    = ["", "#fecaca", "#fde68a", "#bfdbfe", "#a7f3d0"];

  const passwordsMatch = form.confirmPassword && form.password === form.confirmPassword;
  const passwordsMismatch = form.confirmPassword && form.password !== form.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return setMessage("Passwords do not match");
    }
    setLoading(true);
    setMessage("");
    try {
      await api.put(`/users/reset-password/${token}`, { password: form.password });
      setSuccess(true);
      toast.success("Password reset successful!");
      setTimeout(() => navigate("/login"), 2200);
    } catch (err) {
      setMessage(err.response?.data?.message || "Reset failed. Link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .rp-root {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(150deg, #eef3ff 0%, #f4f6fb 55%, #f0f4ff 100%);
          padding: 32px 24px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative; overflow: hidden;
        }

        .rp-blob1 {
          position: absolute;
          width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 65%);
          top: -240px; right: -180px; pointer-events: none;
          animation: blobDrift 10s ease-in-out infinite alternate;
        }
        .rp-blob2 {
          position: absolute;
          width: 420px; height: 420px; border-radius: 50%;
          background: radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 65%);
          bottom: -140px; left: -140px; pointer-events: none;
          animation: blobDrift2 13s ease-in-out infinite alternate;
        }
        @keyframes blobDrift  { to { transform: translate(24px, 16px) scale(1.06); } }
        @keyframes blobDrift2 { to { transform: translate(-18px, -22px) scale(1.04); } }

        .rp-card {
          background: #ffffff;
          border: 1px solid #e3e8f4;
          border-radius: 22px;
          width: 100%; max-width: 440px;
          padding: 38px 34px 32px;
          box-shadow: 0 20px 60px rgba(13,21,38,0.11), 0 6px 18px rgba(13,21,38,0.06);
          position: relative; z-index: 1;
          animation: rpCardIn 0.5s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes rpCardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Brand row */
        .rp-brand {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 32px;
          animation: rpCardIn 0.45s cubic-bezier(0.16,1,0.3,1) 0.05s both;
        }
        .rp-brand-mark {
          width: 38px; height: 38px; border-radius: 11px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          box-shadow: 0 3px 12px rgba(37,99,235,0.35);
          display: flex; align-items: center; justify-content: center;
        }
        .rp-brand-name {
          font-family: 'Manrope', sans-serif;
          font-size: 18px; font-weight: 900; color: #0d1526; letter-spacing: -0.4px;
        }

        .rp-header {
          margin-bottom: 28px;
          animation: rpCardIn 0.45s cubic-bezier(0.16,1,0.3,1) 0.1s both;
        }
        .rp-shield {
          width: 52px; height: 52px; border-radius: 50%;
          background: linear-gradient(135deg, #eef3ff, #dbeafe);
          border: 2px solid #bfdbfe;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
        }
        .rp-header h1 {
          font-family: 'Manrope', sans-serif;
          font-size: 23px; font-weight: 900; color: #0d1526;
          letter-spacing: -0.5px; margin-bottom: 6px;
        }
        .rp-header p { font-size: 13.5px; color: #5f7191; line-height: 1.6; }

        /* Error */
        .rp-error {
          display: flex; align-items: center; gap: 8px;
          background: #fef2f2; border: 1.5px solid #fecaca;
          color: #dc2626; border-radius: 10px;
          padding: 11px 14px; font-size: 13px; font-weight: 500;
          margin-bottom: 20px; line-height: 1.5;
          animation: shake 0.38s cubic-bezier(0.36,0.07,0.19,0.97);
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-5px); }
          40%      { transform: translateX(5px); }
          60%      { transform: translateX(-3px); }
          80%      { transform: translateX(3px); }
        }

        /* Field */
        .rp-field {
          margin-bottom: 16px;
          animation: rpCardIn 0.45s cubic-bezier(0.16,1,0.3,1) both;
        }
        .rp-label {
          display: block;
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.7px;
          color: #5f7191; margin-bottom: 7px;
        }
        .rp-input-wrap {
          position: relative;
          transition: transform 0.18s;
        }
        .rp-input-wrap:focus-within { transform: translateY(-1px); }
        .rp-input-icon {
          position: absolute; top: 50%; left: 13px;
          transform: translateY(-50%);
          color: #9baabf; pointer-events: none;
          transition: color 0.2s;
        }
        .rp-input-wrap:focus-within .rp-input-icon { color: #2563eb; }

        .rp-input {
          width: 100%;
          padding: 11px 42px 11px 40px;
          background: #f4f6fb;
          border: 1.5px solid #e3e8f4;
          border-radius: 10px;
          color: #0d1526;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .rp-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3.5px rgba(37,99,235,0.12);
          background: #fff;
        }
        .rp-input.match   { border-color: #059669; box-shadow: 0 0 0 3px rgba(5,150,105,0.12); }
        .rp-input.mismatch{ border-color: #dc2626; box-shadow: 0 0 0 3px rgba(220,38,38,0.1); }
        .rp-input::placeholder { color: #c5cfe0; }

        .rp-eye-btn {
          position: absolute; top: 50%; right: 11px;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #9baabf; padding: 4px; border-radius: 6px;
          display: flex; align-items: center;
          transition: color 0.15s, background 0.15s;
        }
        .rp-eye-btn:hover { color: #2d3d5c; background: #e8ecf5; }

        /* Strength bar */
        .rp-strength-bar {
          display: flex; gap: 4px; margin-top: 8px;
        }
        .rp-strength-seg {
          flex: 1; height: 3.5px; border-radius: 9px;
          background: #e8ecf5;
          transition: background 0.3s;
        }
        .rp-strength-label {
          display: flex; justify-content: flex-end;
          font-size: 11px; font-weight: 600; margin-top: 5px;
          transition: color 0.3s;
        }

        /* Match indicator */
        .rp-match-msg {
          display: flex; align-items: center; gap: 5px;
          font-size: 12px; font-weight: 600; margin-top: 7px;
        }

        /* Submit */
        .rp-submit-wrap {
          margin-top: 22px;
          animation: rpCardIn 0.45s cubic-bezier(0.16,1,0.3,1) 0.28s both;
        }
        .rp-submit {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 12px 20px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white; border: none; border-radius: 11px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14.5px; font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(37,99,235,0.38);
          transition: all 0.22s cubic-bezier(0.16,1,0.3,1);
          position: relative; overflow: hidden;
        }
        .rp-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(37,99,235,0.45);
        }
        .rp-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .rp-spinner {
          width: 18px; height: 18px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: white; border-radius: 50%;
          animation: spin 0.65s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Back link */
        .rp-back {
          text-align: center; margin-top: 18px;
          font-size: 13px; color: #5f7191;
          animation: rpCardIn 0.45s cubic-bezier(0.16,1,0.3,1) 0.32s both;
        }
        .rp-back a {
          color: #2563eb; font-weight: 600;
          text-decoration: none; transition: color 0.15s;
        }
        .rp-back a:hover { color: #1d4ed8; text-decoration: underline; }

        /* Success state */
        .rp-success {
          text-align: center; padding: 12px 0;
          animation: rpCardIn 0.4s cubic-bezier(0.16,1,0.3,1);
        }
        .rp-success-ring {
          width: 72px; height: 72px; border-radius: 50%;
          background: linear-gradient(135deg, #ecfdf5, #d1fae5);
          border: 2.5px solid #6ee7b7;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 22px;
          animation: rpSuccessPop 0.5s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes rpSuccessPop {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        .rp-success h2 {
          font-family: 'Manrope', sans-serif;
          font-size: 22px; font-weight: 900; color: #0d1526;
          letter-spacing: -0.4px; margin-bottom: 8px;
        }
        .rp-success p { font-size: 13.5px; color: #5f7191; line-height: 1.6; }
        .rp-redirect-note {
          margin-top: 20px; font-size: 12.5px; color: #9baabf;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .rp-redirect-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #059669;
          animation: rpPulse 1.6s ease-out infinite;
        }
        @keyframes rpPulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>

      <div className="rp-root">
        <div className="rp-blob1" />
        <div className="rp-blob2" />

        <div className="rp-card">
          {/* Brand */}
          <div className="rp-brand">
            <div className="rp-brand-mark">
              <Zap size={18} color="white" strokeWidth={2.5} />
            </div>
            <span className="rp-brand-name">WorkTrack</span>
          </div>

          {success ? (
            <div className="rp-success">
              <div className="rp-success-ring">
                <CheckCircle size={34} color="#059669" strokeWidth={2} />
              </div>
              <h2>Password updated!</h2>
              <p>Your password has been reset successfully. You can now sign in with your new password.</p>
              <div className="rp-redirect-note">
                <span className="rp-redirect-dot" />
                Redirecting to login…
              </div>
            </div>
          ) : (
            <>
              <div className="rp-header">
                <div className="rp-shield">
                  <ShieldCheck size={26} color="#2563eb" strokeWidth={1.8} />
                </div>
                <h1>Set new password</h1>
                <p>Create a strong password for your account. Make it at least 8 characters.</p>
              </div>

              {message && (
                <div className="rp-error">
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* New password */}
                <div className="rp-field" style={{ animationDelay: "0.14s" }}>
                  <label className="rp-label">New Password</label>
                  <div className="rp-input-wrap">
                    <Lock size={17} className="rp-input-icon" />
                    <input
                      className="rp-input"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="rp-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {form.password && (
                    <>
                      <div className="rp-strength-bar">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="rp-strength-seg"
                            style={{ background: i <= strength ? strengthColors[strength] : "#e8ecf5" }}
                          />
                        ))}
                      </div>
                      <div className="rp-strength-label" style={{ color: strengthColors[strength] }}>
                        {strengthLabels[strength]}
                      </div>
                    </>
                  )}
                </div>

                {/* Confirm password */}
                <div className="rp-field" style={{ animationDelay: "0.2s" }}>
                  <label className="rp-label">Confirm Password</label>
                  <div className="rp-input-wrap">
                    <Lock size={17} className="rp-input-icon" />
                    <input
                      className={`rp-input ${passwordsMatch ? "match" : ""} ${passwordsMismatch ? "mismatch" : ""}`}
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repeat your password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      className="rp-eye-btn"
                      onClick={() => setShowConfirm(!showConfirm)}
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {passwordsMatch && (
                    <div className="rp-match-msg" style={{ color: "#059669" }}>
                      <CheckCircle size={13} /> Passwords match
                    </div>
                  )}
                  {passwordsMismatch && (
                    <div className="rp-match-msg" style={{ color: "#dc2626" }}>
                      <AlertCircle size={13} /> Passwords do not match
                    </div>
                  )}
                </div>

                <div className="rp-submit-wrap">
                  <button
                    type="submit"
                    className="rp-submit"
                    disabled={loading || passwordsMismatch}
                  >
                    {loading ? (
                      <span className="rp-spinner" />
                    ) : (
                      <>Update Password <ArrowRight size={16} strokeWidth={2.5} /></>
                    )}
                  </button>
                </div>
              </form>

              <div className="rp-back">
                Remember your password? <a href="/login">Sign in</a>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ResetPassword;