import express from "express";

import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/permission.middleware.js";

import {
  createFamilyMember,
  getFamilyMembers,
  getFamilyMembersByResident,
  getFamilyMemberById,
  updateFamilyMember,
  deleteFamilyMember,
} from "../controllers/familyMember.controller.js";

const router = express.Router();

router.post("/", protect, authorize("residents.view"), createFamilyMember);

router.get("/", protect, authorize("residents.view"), getFamilyMembers);

router.get(
  "/resident/:residentId",
  protect,
  authorize("residents.view"),
  getFamilyMembersByResident,
);

router.get("/:id", protect, authorize("residents.view"), getFamilyMemberById);

router.patch("/:id", protect, authorize("residents.view"), updateFamilyMember);

router.delete("/:id", protect, authorize("residents.view"), deleteFamilyMember);

export default router;
