import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/permission.middleware.js";
import {
  getOrganizations,
} from "../controllers/organization.controller.js";

const router = express.Router();

router.get("/", protect, authorize("users.manage"), getOrganizations);

export default router;