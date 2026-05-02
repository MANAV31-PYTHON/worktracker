import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, CalendarDays, ShieldAlert, Trash2 } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
};

export default function AdminPanelPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [companies, setCompanies] = useState([]);
  const [deletingCompanyId, setDeletingCompanyId] = useState("");

  const summary = useMemo(
    () => ({
      total: companies.length,
      active: companies.filter((c) => c.subscription?.status === "active").length,
    }),
    [companies]
  );

  const fetchCompanies = async () => {
    try {
      const res = await api.get("/subscriptions/platform-companies");
      setCompanies(res.data || []);
      setError("");
    } catch (err) {
      const message = err?.response?.data?.message || "You are not allowed to view admin panel data";
      setError(message);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !user.isPlatformOwner) {
      navigate("/dashboard", { replace: true });
      return;
    }
    fetchCompanies();
  }, [user, navigate]);

  const handleDeleteCompany = async (companyId, companyName) => {
    if (!companyId || deletingCompanyId) return;
    const ok = window.confirm(
      `Delete company "${companyName}" and all related data? This cannot be undone.`
    );
    if (!ok) return;

    try {
      setDeletingCompanyId(companyId);
      setError("");
      await api.delete(`/subscriptions/platform-companies/${companyId}`);
      await fetchCompanies();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete company");
    } finally {
      setDeletingCompanyId("");
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-center">
          <span className="spinner lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Admin Panel</h1>
          <div className="page-subtitle">
            <span className="dot" />
            Owner-controlled company subscriptions
          </div>
        </div>
      </div>

      <div className="stats-grid stagger" style={{ marginBottom: 20 }}>
        <div className="stat-card anim-fade-up c-blue">
          <div className="stat-body">
            <div className="stat-value">{summary.total}</div>
            <div className="stat-label">Total Companies</div>
          </div>
        </div>
        <div className="stat-card anim-fade-up c-green">
          <div className="stat-body">
            <div className="stat-value">{summary.active}</div>
            <div className="stat-label">Active Subscriptions</div>
          </div>
        </div>
      </div>

      <div className="card anim-fade-up subscription-card">
        <div className="card-header">
          <h3>Subscribed Companies</h3>
          <span className="card-header-meta">{companies.length} companies</span>
        </div>
        <div className="card-body">
          {error && (
            <div className="empty-state" style={{ marginBottom: 14 }}>
              <div className="empty-icon">
                <ShieldAlert size={22} />
              </div>
              <p>{error}</p>
            </div>
          )}

          {!error && companies.length === 0 && (
            <p className="text-muted text-sm">No subscribed companies found.</p>
          )}

          {!error && companies.length > 0 && (
            <div className="subscription-grid">
              {companies.map((record) => (
                <div key={record.company?.id} className="subscription-cell">
                  <p className="subscription-label">
                    <Building2 size={14} /> {record.company?.name || "-"}
                  </p>
                  <p className="subscription-value">{record.subscription?.planName || "-"}</p>
                  <p className="text-sm text-muted">
                    Status: {record.subscription?.status?.replace(/_/g, " ") || "-"}
                  </p>
                  <p className="text-sm text-muted">
                    <CalendarDays size={12} /> Start: {formatDate(record.subscription?.startDate)}
                  </p>
                  <p className="text-sm text-muted">End: {formatDate(record.subscription?.endDate)}</p>
                  <p className="text-sm text-muted">Enrolled: {formatDate(record.company?.createdAt)}</p>
                  <p className="text-sm text-muted">GST: {record.company?.gstNumber || "-"}</p>
                  <p className="text-sm text-muted">Phone: {record.company?.phone || "-"}</p>
                  <p className="text-sm text-muted">Address: {record.company?.address || "-"}</p>
                  {record.isOwnerCompany ? (
                    <p
                      className="text-sm"
                      style={{
                        marginTop: 10,
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: "1px solid #dbeafe",
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <ShieldAlert size={14} />
                      Owner Company (Protected)
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteCompany(record.company?.id, record.company?.name || "Unknown")
                      }
                      disabled={!record.company?.id || deletingCompanyId === record.company?.id}
                      style={{
                        marginTop: 10,
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: "1px solid #fecaca",
                        background: deletingCompanyId === record.company?.id ? "#fee2e2" : "#fff1f2",
                        color: "#b91c1c",
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: deletingCompanyId === record.company?.id ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Trash2 size={14} />
                      {deletingCompanyId === record.company?.id ? "Deleting..." : "Delete Company"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
