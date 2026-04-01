import express from "express";
import { getAll, readOne, readAll } from "../controllers/notification.controller.js";
import { protect, isRoleChange } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(protect, isRoleChange);

router.get("/",              getAll);
router.patch("/:id/read",   readOne);
router.patch("/read-all",   readAll);

export default router;