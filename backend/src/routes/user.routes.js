import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/permission.middleware.js";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";

const router = express.Router();

router.post("/", protect, authorize("users.manage"), createUser);
router.get("/", protect, authorize("users.manage"), getUsers);
router.get("/:id", protect, authorize("users.manage"), getUserById);
router.patch("/:id", protect, authorize("users.manage"), updateUser);
router.delete("/:id", protect, authorize("users.manage"), deleteUser);

export default router;
