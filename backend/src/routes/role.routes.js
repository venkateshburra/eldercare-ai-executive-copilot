import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/permission.middleware.js";

import {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
  updateRolePermissions,
} from "../controllers/role.controller.js";

const router = express.Router();

router.use(protect);

router.post("/", createRole);
router.get("/", getRoles);
router.get("/:id", getRoleById);
router.put("/:id", updateRole);
router.patch("/:id", updateRole);
router.put("/:id/permissions", updateRolePermissions);
router.patch("/:id/permissions", updateRolePermissions);
router.delete("/:id", deleteRole);

export default router;
