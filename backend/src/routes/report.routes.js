import express from "express";

import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/permission.middleware.js";

import {
  getDashboardSummary,
  getIncidentAnalytics,
  getResidentAnalytics,
  getStaffAnalytics,
  getMedicationAnalytics,
  getCarePlanAnalytics,
  getActivityAnalytics,
  getOrganizationAnalytics,
} from "../controllers/report.controller.js";

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  authorize("reports.view"),
  getDashboardSummary,
);

router.get(
  "/incidents",
  protect,
  authorize("reports.view"),
  getIncidentAnalytics,
);

router.get(
  "/residents",
  protect,
  authorize("reports.view"),
  getResidentAnalytics,
);

router.get("/staff", protect, authorize("reports.view"), getStaffAnalytics);

router.get(
  "/medications",
  protect,
  authorize("reports.view"),
  getMedicationAnalytics,
);

router.get(
  "/care-plans",
  protect,
  authorize("reports.view"),
  getCarePlanAnalytics,
);

router.get(
  "/activities",
  protect,
  authorize("reports.view"),
  getActivityAnalytics,
);

router.get(
  "/organization",
  protect,
  authorize("reports.view"),
  getOrganizationAnalytics,
);

export default router;
