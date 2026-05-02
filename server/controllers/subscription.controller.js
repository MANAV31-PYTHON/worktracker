import {
  deletePlatformCompany,
  getPlatformCompanies,
  getSubscriptionOverview,
  handlePaymentSuccess,
} from "../services/subscription.service.js";
import {
  createRazorpayOrder,
  verifyRazorpayPaymentAndActivate,
} from "../services/razorpay.service.js";

export const paymentSuccess = async (req, res) => {
  try {
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    const incomingSecret = req.headers["x-webhook-secret"];

    if (webhookSecret && incomingSecret !== webhookSecret) {
      return res.status(401).json({ message: "Invalid webhook secret" });
    }

    const result = await handlePaymentSuccess(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const overview = async (req, res) => {
  try {
    const data = await getSubscriptionOverview(req.user);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const platformCompanies = async (req, res) => {
  try {
    const data = await getPlatformCompanies(req.user);
    res.status(200).json(data);
  } catch (err) {
    res.status(403).json({ message: err.message });
  }
};

export const removePlatformCompany = async (req, res) => {
  try {
    const data = await deletePlatformCompany(req.user, req.params.companyId);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const createOrder = async (req, res) => {
  try {
    const data = await createRazorpayOrder(req.body || {});
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const data = await verifyRazorpayPaymentAndActivate(req.body || {});
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
