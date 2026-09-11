import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/permission.middleware.js";
import { createShift, getShifts, getShiftById, updateShift, deleteShift } from "../controllers/shift.controller.js";

const router = express.Router();

router.post("/",      protect, authorize("shifts.manage"), createShift);
router.get("/",       protect, authorize("shifts.view"),   getShifts);
router.get("/:id",    protect, authorize("shifts.view"),   getShiftById);
router.put("/:id",    protect, authorize("shifts.manage"), updateShift);
router.delete("/:id", protect, authorize("shifts.manage"), deleteShift);

export default router;
