import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/permission.middleware.js";
import { createTask, getTasks, getTaskById, updateTask, deleteTask } from "../controllers/task.controller.js";

const router = express.Router();

router.post("/",      protect, authorize("tasks.manage"), createTask);
router.get("/",       protect, authorize("tasks.view"),   getTasks);
router.get("/:id",    protect, authorize("tasks.view"),   getTaskById);
router.patch("/:id",  protect, authorize("tasks.manage"), updateTask);
router.delete("/:id", protect, authorize("tasks.manage"), deleteTask);

export default router;
