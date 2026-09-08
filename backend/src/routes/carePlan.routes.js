import express from "express";

import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/permission.middleware.js";

import {
  createCarePlan,
  getCarePlans,
  getCarePlanById,
  getCarePlansByResident,
  updateCarePlan,
  deleteCarePlan,
} from "../controllers/carePlan.controller.js";

const router = express.Router();

router.post("/", protect, authorize("carePlans.view"), createCarePlan);

router.get("/", protect, authorize("carePlans.view"), getCarePlans);

router.get(
  "/resident/:residentId",
  protect,
  authorize("carePlans.view"),
  getCarePlansByResident,
);

router.get("/:id", protect, authorize("carePlans.view"), getCarePlanById);

router.patch("/:id", protect, authorize("carePlans.view"), updateCarePlan);

router.delete("/:id", protect, authorize("carePlans.view"), deleteCarePlan);

export default router;
