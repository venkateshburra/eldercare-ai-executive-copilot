import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/permission.middleware.js";
import { createAlert, getAlerts, getAlertById, acknowledgeAlert, resolveAlert } from "../controllers/alert.controller.js";

const router = express.Router();

router.post("/",                  protect, authorize("alerts.manage"), createAlert);
router.get("/",                   protect, authorize("alerts.view"),   getAlerts);
router.get("/:id",                protect, authorize("alerts.view"),   getAlertById);
router.patch("/:id/acknowledge",  protect, authorize("alerts.manage"), acknowledgeAlert);
router.patch("/:id/resolve",      protect, authorize("alerts.manage"), resolveAlert);

export default router;
