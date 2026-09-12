// src/routes/setting.routes.js
import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/permission.middleware.js";
import { getSettings, updateSettings } from "../controllers/setting.controller.js";

const router = express.Router();

router.use(protect);

router.get("/", authorize("settings.view"), getSettings);
router.put("/", authorize("settings.manage"), updateSettings);
router.patch("/", authorize("settings.manage"), updateSettings);

export default router;
