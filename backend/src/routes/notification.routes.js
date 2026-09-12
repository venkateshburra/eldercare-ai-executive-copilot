import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/",               protect, getNotifications);
router.get("/unread-count",   protect, getUnreadCount);
router.post("/read-all",    protect, markAllAsRead);
router.put("/read-all",     protect, markAllAsRead);
router.patch("/read-all",   protect, markAllAsRead);
router.post("/:id/read",    protect, markAsRead);
router.put("/:id/read",     protect, markAsRead);
router.patch("/:id/read",   protect, markAsRead);
router.delete("/:id",       protect, deleteNotification);

export default router;
