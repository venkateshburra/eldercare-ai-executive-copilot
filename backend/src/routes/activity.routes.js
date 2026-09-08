import express from "express";

import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/permission.middleware.js";

import {
  createActivity,
  getActivities,
  getActivityById,
  getActivitiesByResident,
  updateActivity,
  deleteActivity,
} from "../controllers/activity.controller.js";

const router = express.Router();

router.post("/", protect, authorize("residents.view"), createActivity);

router.get("/", protect, authorize("residents.view"), getActivities);

router.get(
  "/resident/:residentId",
  protect,
  authorize("residents.view"),
  getActivitiesByResident,
);

router.get("/:id", protect, authorize("residents.view"), getActivityById);

router.patch("/:id", protect, authorize("residents.view"), updateActivity);

router.delete("/:id", protect, authorize("residents.view"), deleteActivity);

export default router;
