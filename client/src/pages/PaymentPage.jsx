import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, CreditCard, Info, ShieldCheck, Zap } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { findPlanById, getPlanPricing } from "../constants/plans";
import { ONBOARDING_PAYMENT_KEY } from "../constants/onboarding";

const addMonths = (baseDate, months) => {
  const next = new Date(baseDate);
  next.setMonth(next.getMonth() + months);
  return next;
};

const formatRs = (value) => `Rs ${Number(value || 0).toFixed(2)}`;

const getRazorpayContact = (rawPhone = "") => {
  const digits = String(rawPhone || "").replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return "";
};

const sanitizeEmail = (value = "") => {
  const email = String(value || "").trim();
  return /\S+@\S+\.\S+/.test(email) ? email : "";
};

const sanitizeName = (value = "") => String(value || "").trim().slice(0, 120);

const getReadableError = (err, fallback = "Something went wrong") => {
  const serverMessage = err?.response?.data?.message;
  const directMessage = err?.message;
  return serverMessage || directMessage || fallback;
};

const loadRazorpayScript = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout script"));
    document.body.appendChild(script);
  });

export default function PaymentPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [paymentStep, setPaymentStep] = useState("");

  const onboardingData = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(ONBOARDING_PAYMENT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const selectedPlan = findPlanById(onboardingData?.planId);
  const pricing = getPlanPricing(selectedPlan);
  const isReadyForPayment = Boolean(
    onboardingData?.email && onboardingData?.password && onboardingData?.company?.name
  );

  const openCheckout = ({ keyId, orderId }) =>
    new Promise((resolve, reject) => {
      const contact = getRazorpayContact(onboardingData?.company?.phone);
      const email = sanitizeEmail(onboardingData?.email);
      const name = sanitizeName(onboardingData?.name);
      const prefill = {
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
        ...(contact ? { contact } : {}),
      };
      const options = {
        key: keyId,
        name: "BOMEGROW",
        description: `${selectedPlan.label} Subscription`,
        order_id: orderId,
        ...(Object.keys(prefill).length ? { prefill } : {}),
        config: {
          display: {
            blocks: {
              upi_first: {
                name: "Pay via UPI",
                instruments: [
                  {
                    method: "upi",
                  },
                ],
              },
            },
            sequence: ["block.upi_first", "upi", "card", "netbanking", "wallet"],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        theme: {
          color: "#2563eb",
        },
        handler: (response) => resolve(response),
        modal: {
          ondismiss: () => reject(new Error("Payment popup closed")),
        },
      };

      console.log("[Payment] Opening Razorpay checkout", {
        keyId,
        orderId,
        hasPrefill: Boolean(Object.keys(prefill).length),
      });
      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", (response) => {
        const message = response?.error?.description || "Payment failed";
        console.error("[Payment] Razorpay payment.failed", response);
        reject(new Error(message));
      });
      razorpay.open();
    });

  const handlePayment = async () => {
    if (!isReadyForPayment || loading) return;

    setLoading(true);
    setError("");
    setSuccess("");
    let currentStep = "Initializing payment...";
    setPaymentStep(currentStep);
    const updateStep = (nextStep) => {
      currentStep = nextStep;
      setPaymentStep(nextStep);
    };

    try {
      updateStep("Loading Razorpay checkout...");
      await loadRazorpayScript();
      console.log("[Payment] Razorpay script loaded");

      updateStep("Authenticating account...");
      const loginRes = await api.post("/auth/login", {
        email: onboardingData.email,
        password: onboardingData.password,
      });
      console.log("[Payment] Login success", { userId: loginRes?.data?.user?._id });

      const now = new Date();
      const end = addMonths(now, selectedPlan.months);

      updateStep("Creating payment order...");
      const orderRes = await api.post("/subscriptions/create-order", {
        planId: selectedPlan.id,
        receipt: `rcpt_${Date.now()}`,
      });
      console.log("[Payment] create-order response", orderRes?.data);

      const { keyId, orderId } = orderRes.data || {};
      if (!keyId || !orderId) {
        throw new Error("Invalid order response from server");
      }
      if (!String(keyId).startsWith("rzp_") || !String(orderId).startsWith("order_")) {
        throw new Error("Razorpay credentials/order format is invalid");
      }

      updateStep("Opening Razorpay popup...");
      const razorpayResponse = await openCheckout({ keyId, orderId });
      console.log("[Payment] Razorpay handler response", razorpayResponse);

      const subscriptionPayload = {
        userId: loginRes.data.user._id,
        planName: selectedPlan.label,
        startDate: now.toISOString(),
        endDate: end.toISOString(),
        nextBillingDate: end.toISOString(),
        company: onboardingData.company,
      };

      updateStep("Verifying payment signature...");
      await api.post("/subscriptions/verify-payment", {
        ...razorpayResponse,
        subscriptionPayload,
      });
      console.log("[Payment] verify-payment success");

      updateStep("Finalizing login...");
      const freshLoginRes = await api.post("/auth/login", {
        email: onboardingData.email,
        password: onboardingData.password,
      });

      login(freshLoginRes.data.user, freshLoginRes.data.token);
      sessionStorage.removeItem(ONBOARDING_PAYMENT_KEY);

      updateStep("Payment completed");
      setSuccess("Payment successful. Super admin activated and confirmation email sent.");
      setTimeout(() => navigate("/dashboard"), 900);
    } catch (err) {
      const readable = getReadableError(err, "Payment failed. Please try again.");
      setError(`Step: ${currentStep} | ${readable}`);
      console.error("[Payment] Flow failed", {
        step: currentStep,
        error: err,
        responseData: err?.response?.data,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!onboardingData) {
    return (
      <div className="auth-page">
        <div className="auth-card payment-card">
          <div className="auth-brand">
            <div className="brand-mark">
              <Zap size={22} color="white" strokeWidth={2.5} />
            </div>
            <h1>BOMEGROW</h1>
            <p>Payment checkout</p>
          </div>
          <div className="alert alert-error">
            <AlertCircle size={15} />
            Payment session not found. Please complete registration first.
          </div>
          <button className="btn btn-primary btn-full" onClick={() => navigate("/register")}>
            Go To Registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card payment-card">
        <div className="auth-brand">
          <div className="brand-mark">
            <CreditCard size={22} color="white" strokeWidth={2.5} />
          </div>
          <h1>BOMEGROW</h1>
          <p>Secure payment checkout</p>
        </div>

        <h2 className="payment-title">Complete Subscription Payment</h2>
        <p className="payment-subtitle">
          Company: <strong>{onboardingData.company.name}</strong>
        </p>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={15} /> {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            <CheckCircle2 size={15} /> {success}
          </div>
        )}
        {loading && paymentStep && (
          <div className="alert alert-info">
            <Info size={15} /> {paymentStep}
          </div>
        )}

        <div className="payment-summary">
          <div className="payment-row">
            <span>Plan</span>
            <strong>{selectedPlan.label}</strong>
          </div>
          <div className="payment-row">
            <span>Subscription Price</span>
            <strong>{formatRs(pricing.base)}</strong>
          </div>
          <div className="payment-row">
            <span>GST ({pricing.gstPercent}%)</span>
            <strong>{formatRs(pricing.gstAmount)}</strong>
          </div>
          <div className="payment-row">
            <span>Total Payable</span>
            <strong>{formatRs(pricing.total)}</strong>
          </div>
          <div className="payment-row">
            <span>Billing</span>
            <strong>{selectedPlan.months === 12 ? "Yearly" : "Monthly"}</strong>
          </div>
          <div className="payment-row">
            <span>Account</span>
            <strong>{onboardingData.email}</strong>
          </div>
        </div>

        <div className="onboarding-payment-note" style={{ marginTop: 14 }}>
          <ShieldCheck size={14} />
          On success: payment signature verification ke baad subscription activate hogi.
        </div>

        <button type="button" className="btn btn-primary btn-full" onClick={handlePayment} disabled={loading}>
          {loading ? <span className="spinner" /> : "Pay With Razorpay"}
        </button>

        <p className="auth-footer">
          <Link to="/register">Back to registration</Link>
          {" · "}
          <Link to="/login">Sign in</Link>
        </p>
        <p className="auth-footer" style={{ marginTop: 8 }}>
          <Info size={13} style={{ verticalAlign: "text-bottom" }} /> Test mode me real Razorpay flow verify kar sakte ho.
        </p>
      </div>
    </div>
  );
}
