import express from "express";

import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/permission.middleware.js";

import {
  createIncident,
  getIncidents,
  getIncidentById,
  getIncidentsByResident,
  updateIncident,
  deleteIncident,
} from "../controllers/incident.controller.js";

const router = express.Router();

router.post("/", protect, authorize("incidents.manage"), createIncident);

router.get("/", protect, authorize("incidents.view"), getIncidents);

router.get(
  "/resident/:residentId",
  protect,
  authorize("incidents.view"),
  getIncidentsByResident,
);

router.get("/:id", protect, authorize("incidents.view"), getIncidentById);

router.patch("/:id", protect, authorize("incidents.manage"), updateIncident);

router.delete("/:id", protect, authorize("incidents.manage"), deleteIncident);

export default router;
