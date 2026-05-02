import express from "express";
import {
  createOrder,
  overview,
  platformCompanies,
  paymentSuccess,
  removePlatformCompany,
  verifyPayment,
} from "../controllers/subscription.controller.js";
import { protect, isRoleChange } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Payment provider webhook/callback endpoint
router.post("/payment-success", paymentSuccess);
router.post("/create-order", createOrder);
router.post("/verify-payment", verifyPayment);

// Logged in user's company subscription overview
router.get("/overview", protect, isRoleChange, overview);
router.get("/platform-companies", protect, isRoleChange, platformCompanies);
router.delete("/platform-companies/:companyId", protect, isRoleChange, removePlatformCompany);

export default router;
