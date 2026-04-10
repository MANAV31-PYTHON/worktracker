import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Zap, AlertCircle, CheckCircle, Info } from "lucide-react";
import api from "../services/api";

export default function RegisterPage() {
  const [form, setForm] = useState({ name:"", email:"", password:"" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      await api.post("/auth/register", form);
      setSuccess("Account created! Redirecting...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark"><Zap size={22} color="white" strokeWidth={2.5}/></div>
          <h1>BOMEGROW</h1>
          <p>Employee Work Management Platform</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Create account</h2>
          <div className="auth-note"><Info size={14} strokeWidth={2} style={{flexShrink:0, marginTop:1}}/> Your account starts as <strong>Employee</strong>. An admin can update your role.</div>
          {error   && <div className="alert alert-error"><AlertCircle size={15} strokeWidth={2}/> {error}</div>}
          {success && <div className="alert alert-success"><CheckCircle size={15} strokeWidth={2}/> {success}</div>}
          <div className="form-group">
            <label>Full Name</label>
            <input placeholder="Jane Doe" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="you@company.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required minLength={6}/>
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{marginTop:4}}>
            {loading ? <span className="spinner"/> : "Create Account"}
          </button>
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
