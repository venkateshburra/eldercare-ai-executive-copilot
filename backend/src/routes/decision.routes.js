import express from "express";

import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/permission.middleware.js";

import {
  createDecision,
  getDecisions,
  getDecisionById,
  updateDecision,
  deleteDecision,
} from "../controllers/decision.controller.js";

const router = express.Router();

router.post("/", protect, authorize("decisions.manage"), createDecision);

router.get("/", protect, authorize("decisions.view"), getDecisions);

router.get("/:id", protect, authorize("decisions.view"), getDecisionById);

router.patch("/:id", protect, authorize("decisions.manage"), updateDecision);

router.delete("/:id", protect, authorize("decisions.manage"), deleteDecision);

export default router;
