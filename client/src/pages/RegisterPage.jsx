import { useMemo, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Info, Sparkles, Zap } from "lucide-react";
import api from "../services/api";
import { PLAN_OPTIONS, findPlanById } from "../constants/plans";
import { ONBOARDING_PAYMENT_KEY } from "../constants/onboarding";

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const initialPlan = searchParams.get("plan");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
    companyAddress: "",
    companyGst: "",
    companyPhone: "",
    planName: initialPlan && PLAN_OPTIONS.some((p) => p.id === initialPlan) ? initialPlan : PLAN_OPTIONS[0].id,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const selectedPlan = useMemo(() => findPlanById(form.planName), [form.planName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });

      sessionStorage.setItem(
        ONBOARDING_PAYMENT_KEY,
        JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          planId: selectedPlan.id,
          company: {
            name: form.companyName,
            address: form.companyAddress,
            gstNumber: form.companyGst,
            phone: form.companyPhone,
          },
        })
      );

      setSuccess("Account created. Continue to payment to activate subscription.");
      setTimeout(() => navigate("/payment"), 700);
    } catch (err) {
      const message = err.response?.data?.message || "Onboarding failed";

      // If account already exists (e.g. earlier payment step failed), continue onboarding with same credentials.
      if (message.toLowerCase().includes("already exists")) {
        try {
          const loginRes = await api.post("/auth/login", {
            email: form.email,
            password: form.password,
          });

          if (loginRes?.data?.user?.companyId) {
            setError("This email is already linked with a company. Please use a different email.");
            return;
          }

          sessionStorage.setItem(
            ONBOARDING_PAYMENT_KEY,
            JSON.stringify({
              name: form.name || loginRes?.data?.user?.name || "",
              email: form.email,
              password: form.password,
              planId: selectedPlan.id,
              company: {
                name: form.companyName,
                address: form.companyAddress,
                gstNumber: form.companyGst,
                phone: form.companyPhone,
              },
            })
          );

          setSuccess("Account already existed. Continuing to payment step...");
          setTimeout(() => navigate("/payment"), 700);
          return;
        } catch (loginErr) {
          setError(
            loginErr?.response?.data?.message ||
              "Account already exists. Please login with correct password to continue payment."
          );
          return;
        }
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card onboarding-card">
        <div className="auth-brand">
          <div className="brand-mark"><Zap size={22} color="white" strokeWidth={2.5} /></div>
          <h1>BOMEGROW</h1>
          <p>Company onboarding with plan activation</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Create company super admin</h2>
          <div className="auth-note">
            <Sparkles size={14} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
            Signup and company setup first, then payment page par jaake super admin activation complete hoga.
          </div>

          {error && <div className="alert alert-error"><AlertCircle size={15} strokeWidth={2} /> {error}</div>}
          {success && <div className="alert alert-success"><CheckCircle2 size={15} strokeWidth={2} /> {success}</div>}

          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input
                placeholder="Jane Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Minimum 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
          </div>

          <div className="onboarding-divider">Company Details</div>

          <div className="form-row">
            <div className="form-group">
              <label>Company Name</label>
              <input
                placeholder="Acme Pvt Ltd"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>GST Number</label>
              <input
                placeholder="07ABCDE1234F1Z5"
                value={form.companyGst}
                onChange={(e) => setForm({ ...form, companyGst: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input
                placeholder="+91xxxxxxxxxx"
                value={form.companyPhone}
                onChange={(e) => setForm({ ...form, companyPhone: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Plan</label>
              <select value={form.planName} onChange={(e) => setForm({ ...form, planName: e.target.value })}>
                {PLAN_OPTIONS.map((plan) => (
                  <option key={plan.id} value={plan.id}>{`${plan.label} - ${plan.price}`}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Company Address</label>
            <textarea
              rows={3}
              placeholder="Full company address"
              value={form.companyAddress}
              onChange={(e) => setForm({ ...form, companyAddress: e.target.value })}
              required
            />
          </div>

          <div className="onboarding-payment-note">After submit, you will be redirected to payment page.</div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: 6 }}>
            {loading ? <span className="spinner" /> : "Continue To Payment"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link> {" · "}
          <Link to="/">Back to plans</Link>
        </p>
        <p className="auth-footer" style={{ marginTop: 8 }}>
          <Info size={13} style={{ verticalAlign: "text-bottom" }} /> Company basic details are stored and visible in subscription overview.
        </p>
      </div>
    </div>
  );
}
