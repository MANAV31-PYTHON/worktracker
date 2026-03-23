import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Zap, AlertCircle } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [form, setForm] = useState({ email:"", password:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await api.post("/auth/login", form);
      login(res.data.user, res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark"><Zap size={22} color="white" strokeWidth={2.5}/></div>
          <h1>WorkTrack</h1>
          <p>Employee Work Management Platform</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Welcome back</h2>
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={15} strokeWidth={2}/> {error}
            </div>
          )}
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="you@company.com" value={form.email}
              onChange={e => setForm({...form, email:e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm({...form, password:e.target.value})} required />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{marginTop:4}}>
            {loading ? <span className="spinner"/> : "Sign In"}
          </button>
        </form>
        <p className="auth-footer">Don't have an account? <Link to="/register">Register here</Link></p>
      </div>
    </div>
  );
}
