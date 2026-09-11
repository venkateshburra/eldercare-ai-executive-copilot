// src/controllers/notification.controller.js
import Notification from "../models/Notification.js";
import { notFound, badRequest } from "../utils/error.js";
import mongoose from "mongoose";

const paginate = (q, page, limit) => q.skip((page - 1) * limit).limit(limit);

// GET /api/notifications
export const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isRead, severity, type } = req.query;
    const filter = { organizationId: req.user.organizationId, userId: req.user._id };
    if (isRead !== undefined) filter.isRead = isRead === "true";
    if (severity) filter.severity = severity;
    if (type) filter.type = type;

    const total = await Notification.countDocuments(filter);
    const notifications = await paginate(
      Notification.find(filter).sort({ createdAt: -1 }),
      Number(page),
      Number(limit)
    );

    res.status(200).json({
      success: true,
      message: "Notifications fetched",
      data: notifications,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

// GET /api/notifications/unread-count
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      organizationId: req.user.organizationId,
      userId: req.user._id,
      isRead: false,
    });
    res.status(200).json({ success: true, data: { count } });
  } catch (err) { next(err); }
};

// PATCH /api/notifications/:id/read
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest("Invalid notification ID");

    const notification = await Notification.findOneAndUpdate(
      { _id: id, organizationId: req.user.organizationId, userId: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    if (!notification) throw notFound("Notification");

    res.status(200).json({ success: true, message: "Notification marked as read", data: notification });
  } catch (err) { next(err); }
};

// PATCH /api/notifications/read-all
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { organizationId: req.user.organizationId, userId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (err) { next(err); }
};

// DELETE /api/notifications/:id
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest("Invalid notification ID");

    const notification = await Notification.findOneAndDelete({
      _id: id,
      organizationId: req.user.organizationId,
      userId: req.user._id,
    });
    if (!notification) throw notFound("Notification");

    res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (err) { next(err); }
};
