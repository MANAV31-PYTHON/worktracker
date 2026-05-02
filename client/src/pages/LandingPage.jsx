import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, CheckCircle2, ShieldCheck, Sparkles, Users } from "lucide-react";
import { PLAN_OPTIONS } from "../constants/plans";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-root">
      <section className="landing-hero">
        <p className="landing-kicker">
          <Sparkles size={14} />
          Work management platform for teams
        </p>
        <h1>BOMEGROW helps companies run tasks, teams, and accountability in one place.</h1>
        <p className="landing-sub">
          See workload, assign roles, and track execution with a clean dashboard.
          Start with your company setup, subscribe to the unlimited plan, then activate super admin access.
        </p>
        <div className="landing-cta">
          <button className="btn btn-primary" onClick={() => navigate("/register")}>
            Start Company Setup <ArrowRight size={15} />
          </button>
          <Link className="btn btn-ghost" to="/login">Sign In</Link>
        </div>
      </section>

      <section className="landing-feature-grid">
        {[
          { icon: <Users size={16} />, title: "Role Management", text: "Create admins and employees after subscription." },
          { icon: <ShieldCheck size={16} />, title: "Super Admin Activation", text: "Payer account is promoted after payment." },
          { icon: <Building2 size={16} />, title: "Company Visibility", text: "Keep company profile and GST details mapped to plan." },
        ].map((item) => (
          <div key={item.title} className="landing-feature-card">
            <div className="landing-feature-icon">{item.icon}</div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        ))}
      </section>

      <section className="landing-plans">
        <div className="landing-plans-header">
          <h2>BOMEGROW Subscription Plan</h2>
          <p>Single plan with full product access. Admin Panel remains owner-only.</p>
        </div>
        <div className="landing-plan-grid">
          {PLAN_OPTIONS.map((plan) => (
            <article key={plan.id} className="landing-plan-card">
              <p className="landing-plan-sub">{plan.subtitle}</p>
              <h3>{plan.label}</h3>
              <p className="landing-plan-price">{plan.price}</p>
              <div className="landing-plan-features">
                {plan.features.map((feature) => (
                  <p key={feature}><CheckCircle2 size={14} /> {feature}</p>
                ))}
              </div>
              <button
                className="btn btn-primary btn-full"
                onClick={() => navigate(`/register?plan=${plan.id}`)}
              >
                Continue With {plan.label}
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
