import express from "express";

import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/permission.middleware.js";

import {
  createResident,
  getResidents,
  getResidentById,
  updateResident,
  deleteResident,
} from "../controllers/resident.controller.js";

const router = express.Router();

router.post("/", protect, authorize("residents.view"), createResident);

router.get("/", protect, authorize("residents.view"), getResidents);

router.get("/:id", protect, authorize("residents.view"), getResidentById);

router.patch("/:id", protect, authorize("residents.view"), updateResident);

router.delete("/:id", protect, authorize("residents.view"), deleteResident);

export default router;
