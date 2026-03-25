import express from "express";
import { create, getAll, getOne, update, remove } from "../controllers/department.controller.js";
import { protect, authorizeRoles , isRoleChange} from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(protect,isRoleChange);
router.post(  "/",     authorizeRoles("SUPER_ADMIN", "ADMIN"), create);
router.get(   "/",     authorizeRoles("SUPER_ADMIN", "ADMIN"), getAll);
router.get(   "/:id",  authorizeRoles("SUPER_ADMIN", "ADMIN"), getOne);
router.put(   "/:id",  authorizeRoles("SUPER_ADMIN", "ADMIN"), update);
router.delete("/:id",  authorizeRoles("SUPER_ADMIN", "ADMIN"), remove);

export default router;
