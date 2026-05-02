import express from "express";
import { register, login, me } from "../controllers/auth.controller.js";
import { protect, isRoleChange } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, isRoleChange, me);

export default router;
