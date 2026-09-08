import express from "express";

import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/permission.middleware.js";

import {
  createStaff,
  getStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
} from "../controllers/staff.controller.js";

const router = express.Router();

router.post("/", protect, authorize("staff.manage"), createStaff);

router.get("/", protect, authorize("staff.view"), getStaff);

router.get("/:id", protect, authorize("staff.view"), getStaffById);

router.patch("/:id", protect, authorize("staff.manage"), updateStaff);

router.delete("/:id", protect, authorize("staff.manage"), deleteStaff);

export default router;
