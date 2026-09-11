import express from "express";

import {
  createPermission,
  getPermissions,
  getPermissionById,
  updatePermission,
  deletePermission,
} from "../controllers/permission.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/permission.middleware.js";

const router = express.Router();

router.post("/", protect, authorize("users.manage"), createPermission);

router.get("/", protect, authorize("users.manage"), getPermissions);

router.get("/:id", protect, authorize("users.manage"), getPermissionById);

router.patch("/:id", protect, authorize("users.manage"), updatePermission);

router.delete("/:id", protect, authorize("users.manage"), deletePermission);

export default router;
