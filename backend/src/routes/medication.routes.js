import express from "express";

import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/permission.middleware.js";

import {
  createMedication,
  getMedications,
  getMedicationById,
  getMedicationsByResident,
  updateMedication,
  deleteMedication,
} from "../controllers/medication.controller.js";

const router = express.Router();

router.post("/", protect, authorize("medications.view"), createMedication);

router.get("/", protect, authorize("medications.view"), getMedications);

router.get(
  "/resident/:residentId",
  protect,
  authorize("medications.view"),
  getMedicationsByResident,
);

router.get("/:id", protect, authorize("medications.view"), getMedicationById);

router.patch("/:id", protect, authorize("medications.manage"), updateMedication);

router.delete("/:id", protect, authorize("medications.view"), deleteMedication);

export default router;
