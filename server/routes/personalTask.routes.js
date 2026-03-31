import express from "express";
import { create, getAll, update, remove } from "../controllers/personalTask.controller.js";
import { protect, isRoleChange } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect, isRoleChange);

router.post("/",       create);
router.get("/",        getAll);
router.put("/:id",     update);
router.delete("/:id",  remove);

export default router;