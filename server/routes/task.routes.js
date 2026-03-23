import express from "express";
import {
  create,
  getAll,
  update,
  remove,
} from "../controllers/task.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", protect, create);
router.get("/", protect, getAll);
router.put("/:id", protect, update);
router.delete("/:id", protect, remove);

export default router;