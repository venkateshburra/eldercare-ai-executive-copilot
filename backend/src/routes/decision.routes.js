import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/permission.middleware.js";
import {
  createDecision,
  getDecisions,
  getDecisionById,
  updateDecision,
  approveDecision,
  rejectDecision,
  overrideDecision,
  deleteDecision,
} from "../controllers/decision.controller.js";

const router = express.Router();

router.post("/",                    protect, authorize("decisions.manage"), createDecision);
router.get("/",                     protect, authorize("decisions.view"),   getDecisions);
router.get("/:id",                  protect, authorize("decisions.view"),   getDecisionById);
router.put("/:id",                  protect, authorize("decisions.manage"), updateDecision);
router.patch("/:id",                protect, authorize("decisions.manage"), updateDecision);
router.post("/:id/approve",         protect, authorize("decisions.manage"), approveDecision);
router.patch("/:id/approve",        protect, authorize("decisions.manage"), approveDecision);
router.post("/:id/reject",          protect, authorize("decisions.manage"), rejectDecision);
router.patch("/:id/reject",         protect, authorize("decisions.manage"), rejectDecision);
router.post("/:id/override",        protect, authorize("decisions.manage"), overrideDecision);
router.patch("/:id/override",       protect, authorize("decisions.manage"), overrideDecision);
router.delete("/:id",               protect, authorize("decisions.manage"), deleteDecision);

export default router;
