import crypto from "crypto";
import Razorpay from "razorpay";
import { handlePaymentSuccess } from "./subscription.service.js";

const PLAN_CATALOG = {
  "bomegrow-unlimited": {
    id: "bomegrow-unlimited",
    planName: "BOMEGROW Unlimited",
    basePrice: 2499,
    gstPercent: 18,
    currency: "INR",
  },
};

const resolvePlan = (planId) => PLAN_CATALOG[planId] || PLAN_CATALOG["bomegrow-unlimited"];

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys are not configured");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

const getAmountBreakdown = (plan) => {
  const baseAmount = Number(plan.basePrice || 0);
  const gstPercent = Number(plan.gstPercent || 0);
  const gstAmount = (baseAmount * gstPercent) / 100;
  const totalAmount = baseAmount + gstAmount;

  return {
    baseAmount,
    gstPercent,
    gstAmount,
    totalAmount,
    amountPaise: Math.round(totalAmount * 100),
  };
};

export const createRazorpayOrder = async (payload = {}) => {
  const { planId, receipt } = payload;
  const plan = resolvePlan(planId);
  const breakdown = getAmountBreakdown(plan);

  const razorpay = getRazorpayClient();
  const order = await razorpay.orders.create({
    amount: breakdown.amountPaise,
    currency: plan.currency,
    receipt: receipt || `rcpt_${Date.now()}`,
    notes: {
      planId: plan.id,
      planName: plan.planName,
      gstPercent: String(plan.gstPercent),
    },
  });

  return {
    keyId: process.env.RAZORPAY_KEY_ID,
    orderId: order.id,
    currency: order.currency,
    amountPaise: order.amount,
    plan: {
      id: plan.id,
      name: plan.planName,
    },
    pricing: breakdown,
  };
};

export const verifyRazorpayPaymentAndActivate = async (payload = {}) => {
  const {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
    subscriptionPayload,
  } = payload;

  if (!orderId || !paymentId || !signature) {
    throw new Error("Missing Razorpay payment verification fields");
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) throw new Error("Razorpay key secret is not configured");

  const generated = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  if (generated !== signature) {
    throw new Error("Invalid payment signature");
  }

  if (!subscriptionPayload?.userId) {
    throw new Error("subscriptionPayload.userId is required");
  }

  const result = await handlePaymentSuccess({
    ...subscriptionPayload,
    status: "active",
    paymentProvider: "razorpay",
    paymentProviderSubscriptionId: orderId,
    paymentId: paymentId,
  });

  return {
    message: "Payment verified and subscription activated",
    verification: {
      orderId,
      paymentId,
      verified: true,
    },
    result,
  };
};

