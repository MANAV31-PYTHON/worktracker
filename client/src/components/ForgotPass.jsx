import { useState } from "react";
import api from "../services/api";
import { Mail, X, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";

const ForgotPass = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await api.post("/users/forgot-password", { email });
      setIsSuccess(true);
      setMessage("If this email is registered, you'll receive a reset link shortly.");
    } catch (err) {
      setIsSuccess(false);
      setMessage(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .fp-overlay {
          position: fixed; inset: 0;
          background: rgba(13,21,38,0.5);
          backdrop-filter: blur(7px);
          -webkit-backdrop-filter: blur(7px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 24px;
          animation: fpFadeIn 0.2s ease;
        }
        @keyframes fpFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .fp-card {
          background: #ffffff;
          border: 1px solid #e3e8f4;
          border-radius: 20px;
          width: 100%; max-width: 420px;
          padding: 32px 28px 28px;
          box-shadow: 0 24px 64px rgba(13,21,38,0.16), 0 6px 20px rgba(13,21,38,0.08);
          animation: fpCardIn 0.32s cubic-bezier(0.16,1,0.3,1);
          position: relative;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        @keyframes fpCardIn {
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        .fp-close {
          position: absolute; top: 16px; right: 16px;
          background: #f0f2f9; border: 1px solid #e3e8f4;
          border-radius: 8px; width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #5f7191;
          transition: all 0.15s;
        }
        .fp-close:hover {
          background: #fef2f2; border-color: #fecaca; color: #dc2626;
        }

        .fp-icon-ring {
          width: 58px; height: 58px;
          background: linear-gradient(135deg, #eef3ff, #dbeafe);
          border: 2px solid #bfdbfe;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 18px;
          animation: fpIconPop 0.45s cubic-bezier(0.16,1,0.3,1) 0.1s both;
        }
        @keyframes fpIconPop {
          from { transform: scale(0.6); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        .fp-icon-ring.success {
          background: linear-gradient(135deg, #ecfdf5, #d1fae5);
          border-color: #a7f3d0;
        }

        .fp-title {
          font-family: 'Manrope', sans-serif;
          font-size: 20px; font-weight: 900;
          color: #0d1526; letter-spacing: -0.4px;
          margin-bottom: 6px;
        }
        .fp-sub {
          font-size: 13.5px; color: #5f7191; line-height: 1.6;
          margin-bottom: 24px;
        }

        /* Message banner */
        .fp-msg {
          display: flex; align-items: flex-start; gap: 9px;
          padding: 11px 14px; border-radius: 10px;
          font-size: 13px; font-weight: 500;
          margin-bottom: 18px; line-height: 1.5;
          animation: fpFadeIn 0.25s ease;
        }
        .fp-msg.error {
          background: #fef2f2; border: 1.5px solid #fecaca; color: #dc2626;
        }
        .fp-msg.success {
          background: #ecfdf5; border: 1.5px solid #a7f3d0; color: #059669;
        }

        /* Label */
        .fp-label {
          display: block;
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.7px;
          color: #5f7191; margin-bottom: 7px;
        }

        /* Input wrapper */
        .fp-input-wrap {
          position: relative;
          transition: transform 0.18s;
        }
        .fp-input-wrap:focus-within { transform: translateY(-1px); }

        .fp-input-icon {
          position: absolute; top: 50%; left: 13px;
          transform: translateY(-50%);
          color: #9baabf; pointer-events: none;
          transition: color 0.2s;
        }
        .fp-input-wrap:focus-within .fp-input-icon { color: #2563eb; }

        .fp-input {
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
        .fp-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3.5px rgba(37,99,235,0.12);
          background: #fff;
        }
        .fp-input::placeholder { color: #c5cfe0; }
        .fp-input:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Buttons row */
        .fp-btn-row {
          display: flex; gap: 10px; margin-top: 20px;
        }

        .fp-btn-cancel {
          flex: 0 0 auto;
          padding: 11px 18px;
          background: #f0f2f9; border: 1.5px solid #e3e8f4;
          border-radius: 10px; cursor: pointer;
          color: #5f7191;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13.5px; font-weight: 600;
          transition: all 0.15s;
        }
        .fp-btn-cancel:hover {
          background: #e8ecf5; border-color: #cdd5ea; color: #2d3d5c;
        }

        .fp-btn-submit {
          flex: 1;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          padding: 11px 20px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white; border: none; border-radius: 10px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px; font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(37,99,235,0.38);
          transition: all 0.22s cubic-bezier(0.16,1,0.3,1);
          position: relative; overflow: hidden;
        }
        .fp-btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(37,99,235,0.45);
        }
        .fp-btn-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .fp-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.65s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Success state */
        .fp-success-state {
          text-align: center;
          animation: fpFadeIn 0.3s ease;
          padding-top: 4px;
        }
        .fp-success-state .fp-icon-ring { margin: 0 auto 18px; }
        .fp-success-close {
          width: 100%; margin-top: 20px;
          padding: 11px; border-radius: 10px;
          background: #2563eb; color: white; border: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px; font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(37,99,235,0.35);
          transition: all 0.2s;
        }
        .fp-success-close:hover { background: #1d4ed8; transform: translateY(-1px); }
      `}</style>

      <div className="fp-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="fp-card">
          <button className="fp-close" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={2.5} />
          </button>

          {isSuccess ? (
            <div className="fp-success-state">
              <div className="fp-icon-ring success">
                <CheckCircle size={26} color="#059669" strokeWidth={2} />
              </div>
              <div className="fp-title">Check your inbox</div>
              <p className="fp-sub">{message}</p>
              <button className="fp-success-close" onClick={onClose}>Got it</button>
            </div>
          ) : (
            <>
              <div className="fp-icon-ring">
                <Mail size={26} color="#2563eb" strokeWidth={1.8} />
              </div>
              <div className="fp-title">Reset your password</div>
              <p className="fp-sub">
                Enter the email linked to your account and we'll send you a reset link.
              </p>

              {message && !isSuccess && (
                <div className="fp-msg error">
                  <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <label className="fp-label">Email Address</label>
                <div className="fp-input-wrap">
                  <Mail size={16} className="fp-input-icon" />
                  <input
                    className="fp-input"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="fp-btn-row">
                  <button type="button" className="fp-btn-cancel" onClick={onClose}>
                    Cancel
                  </button>
                  <button type="submit" className="fp-btn-submit" disabled={loading}>
                    {loading ? (
                      <span className="fp-spinner" />
                    ) : (
                      <>Send reset link <ArrowRight size={15} strokeWidth={2.5} /></>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ForgotPass;