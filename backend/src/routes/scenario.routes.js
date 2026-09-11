// src/routes/scenario.routes.js
import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/permission.middleware.js";
import {
  getScenarios,
  getScenarioById,
  createScenario,
  updateScenario,
  createScenarioVersion,
  simulateScenario,
  compareScenarios,
  deleteScenario,
} from "../controllers/scenario.controller.js";

const router = express.Router();

router.use(protect);

router.get("/",                     authorize("scenarios.view"),   getScenarios);
router.post("/",                    authorize("scenarios.manage"), createScenario);
router.post("/compare",             authorize("scenarios.view"),   compareScenarios);
router.get("/:id",                  authorize("scenarios.view"),   getScenarioById);
router.patch("/:id",                authorize("scenarios.manage"), updateScenario);
router.post("/:id/versions",        authorize("scenarios.manage"), createScenarioVersion);
router.post("/:id/simulate",        authorize("scenarios.manage"), simulateScenario);
router.delete("/:id",               authorize("scenarios.manage"), deleteScenario);

export default router;
