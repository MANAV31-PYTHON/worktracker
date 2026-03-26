import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Zap, AlertCircle, Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import api from "../services/api";
import ForgotPasswordModal from "../components/ForgotPass";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", form);
      login(res.data.user, res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .lp-root {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: linear-gradient(145deg, #eef3ff 0%, #f4f6fb 55%, #f0f4ff 100%);
          padding: 24px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .lp-root::before {
          content: '';
          position: absolute;
          width: 700px; height: 700px; border-radius: 50%;
          background: radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 65%);
          top: -260px; right: -200px; pointer-events: none;
        }
        .lp-root::after {
          content: '';
          position: absolute;
          width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 65%);
          bottom: -150px; left: -150px; pointer-events: none;
        }

        .lp-card {
          background: #ffffff;
          border: 1px solid #e3e8f4;
          border-radius: 20px;
          padding: 40px 36px 36px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 20px 60px rgba(13,21,38,0.09), 0 4px 16px rgba(13,21,38,0.05);
          position: relative; z-index: 1;
          animation: cardEnter 0.48s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes cardEnter {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Brand */
        .lp-brand {
          text-align: center;
          margin-bottom: 30px;
          animation: cardEnter 0.45s cubic-bezier(0.16,1,0.3,1) 0.05s both;
        }
        .lp-brand-mark {
          display: inline-flex;
          align-items: center; justify-content: center;
          width: 54px; height: 54px;
          border-radius: 16px;
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          box-shadow: 0 6px 22px rgba(37,99,235,0.38);
          margin-bottom: 14px;
        }
        .lp-brand h1 {
          font-family: 'Manrope', sans-serif;
          font-size: 22px; font-weight: 900;
          color: #0d1526; letter-spacing: -0.4px;
          margin-bottom: 4px;
        }
        .lp-brand p { font-size: 13px; color: #5f7191; }

        /* Heading */
        .lp-heading {
          font-family: 'Manrope', sans-serif;
          font-size: 17px; font-weight: 800;
          color: #0d1526; letter-spacing: -0.3px;
          margin-bottom: 20px;
          animation: cardEnter 0.45s cubic-bezier(0.16,1,0.3,1) 0.1s both;
        }

        /* Error */
        .lp-error {
          display: flex; align-items: center; gap: 8px;
          background: #fef2f2; border: 1.5px solid #fecaca;
          color: #dc2626; border-radius: 10px;
          padding: 11px 14px; font-size: 13px; font-weight: 500;
          margin-bottom: 18px;
          animation: shake 0.38s cubic-bezier(0.36,0.07,0.19,0.97);
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-6px); }
          40%      { transform: translateX(6px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }

        /* Field */
        .lp-field {
          margin-bottom: 15px;
          animation: cardEnter 0.45s cubic-bezier(0.16,1,0.3,1) both;
        }
        .lp-label {
          display: block;
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.7px;
          color: #5f7191; margin-bottom: 7px;
        }

        .lp-input-wrap {
          position: relative;
          transition: transform 0.18s;
        }
        .lp-input-wrap:focus-within { transform: translateY(-1px); }

        .lp-input-icon {
          position: absolute; top: 50%; left: 13px;
          transform: translateY(-50%);
          color: #9baabf; pointer-events: none;
          transition: color 0.2s;
        }
        .lp-input-wrap:focus-within .lp-input-icon { color: #2563eb; }

        .lp-input {
          width: 100%;
          padding: 11px 14px 11px 40px;
          background: #f4f6fb;
          border: 1.5px solid #e3e8f4;
          border-radius: 10px;
          color: #0d1526;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .lp-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3.5px rgba(37,99,235,0.12);
          background: #fff;
        }
        .lp-input.has-toggle { padding-right: 42px; }
        .lp-input::placeholder { color: #c5cfe0; }

        .lp-eye-btn {
          position: absolute; top: 50%; right: 11px;
          transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #9baabf; padding: 4px; border-radius: 6px;
          display: flex; align-items: center;
          transition: color 0.15s, background 0.15s;
        }
        .lp-eye-btn:hover { color: #2d3d5c; background: #e8ecf5; }

        /* Forgot */
        .lp-forgot-row {
          display: flex; justify-content: flex-end;
          margin-top: -6px; margin-bottom: 20px;
          animation: cardEnter 0.45s cubic-bezier(0.16,1,0.3,1) 0.22s both;
        }
        .lp-forgot-btn {
          background: none; border: none; cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12.5px; font-weight: 600;
          color: #2563eb; padding: 0;
          transition: color 0.15s;
        }
        .lp-forgot-btn:hover { color: #1d4ed8; text-decoration: underline; }

        /* Submit */
        .lp-submit-wrap {
          animation: cardEnter 0.45s cubic-bezier(0.16,1,0.3,1) 0.26s both;
        }
        .lp-submit {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 12px 20px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white; border: none; border-radius: 11px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14.5px; font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(37,99,235,0.38);
          transition: all 0.22s cubic-bezier(0.16,1,0.3,1);
          position: relative; overflow: hidden;
        }
        .lp-submit::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
          opacity: 0; transition: opacity 0.2s;
        }
        .lp-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(37,99,235,0.45);
        }
        .lp-submit:hover:not(:disabled)::before { opacity: 1; }
        .lp-submit:active:not(:disabled) { transform: translateY(0); }
        .lp-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        .lp-spinner {
          width: 18px; height: 18px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: white; border-radius: 50%;
          animation: spin 0.65s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Footer */
        .lp-footer {
          text-align: center;
          font-size: 13px; color: #5f7191;
          margin-top: 18px;
          animation: cardEnter 0.45s cubic-bezier(0.16,1,0.3,1) 0.3s both;
        }
        .lp-footer a {
          color: #2563eb; font-weight: 600;
          text-decoration: none; transition: color 0.15s;
        }
        .lp-footer a:hover { color: #1d4ed8; text-decoration: underline; }

        @media (max-width: 480px) {
          .lp-card { padding: 30px 22px 28px; border-radius: 18px; }
          .lp-brand h1 { font-size: 20px; }
        }
      `}</style>

      <div className="lp-root">
        <div className="lp-card">

          {/* Brand */}
          <div className="lp-brand">
            <div className="lp-brand-mark">
              <Zap size={24} color="white" strokeWidth={2.5} />
            </div>
            <h1>WorkTrack</h1>
            <p>Employee Work Management Platform</p>
          </div>

          {/* Heading */}
          <div className="lp-heading">Welcome back</div>

          {/* Error */}
          {error && (
            <div className="lp-error">
              <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off">

            {/* Email */}
            <div className="lp-field" style={{ animationDelay: "0.13s" }}>
              <label className="lp-label">Email Address</label>
              <div className="lp-input-wrap">
                <Mail size={17} className="lp-input-icon" />
                <input
                  className="lp-input"
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="lp-field" style={{ animationDelay: "0.19s" }}>
              <label className="lp-label">Password</label>
              <div className="lp-input-wrap">
                <Lock size={17} className="lp-input-icon" />
                <input
                  className="lp-input has-toggle"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="lp-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="lp-forgot-row">
              <button
                type="button"
                className="lp-forgot-btn"
                onClick={() => setShowForgotModal(true)}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <div className="lp-submit-wrap">
              <button type="submit" className="lp-submit" disabled={loading}>
                {loading
                  ? <span className="lp-spinner" />
                  : <> Sign In <ArrowRight size={16} strokeWidth={2.5} /> </>
                }
              </button>
            </div>

          </form>

          {/* Footer links */}
          <div className="lp-footer">
            Don't have an account? <Link to="/register">Register here</Link>
          </div>

        </div>
      </div>

      {showForgotModal && (
        <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />
      )}
    </>
  );
}