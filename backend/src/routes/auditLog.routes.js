import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/permission.middleware.js";
import { getAuditLogs } from "../controllers/auditLog.controller.js";

const router = express.Router();

// Read-only — no POST/PUT/DELETE (audit records are append-only)
router.get("/", protect, authorize("auditLogs.view"), getAuditLogs);

export default router;
