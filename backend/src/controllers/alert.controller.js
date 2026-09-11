// src/controllers/alert.controller.js
import mongoose from "mongoose";
import Alert from "../models/Alert.js";
import { createAuditLog } from "../services/audit.service.js";
import { notFound, badRequest } from "../utils/error.js";

const paginate = (q, page, limit) => q.skip((page - 1) * limit).limit(limit);

export const createAlert = async (req, res, next) => {
  try {
    const { type, severity, title, message, residentId, metadata } = req.body;
    if (!type || !severity || !title || !message) throw badRequest("type, severity, title, and message are required");

    const alert = await Alert.create({
      organizationId: req.user.organizationId,
      type,
      severity,
      title,
      message,
      residentId: residentId || null,
      metadata: metadata || {},
      createdBy: req.user._id,
    });

    await createAuditLog({ organizationId: req.user.organizationId, actorId: req.user._id, action: "create", resourceType: "alert", resourceId: alert._id, req });
    const populated = await Alert.findById(alert._id).populate("residentId", "firstName lastName").populate("createdBy", "firstName lastName");
    res.status(201).json({ success: true, message: "Alert created", data: populated });
  } catch (err) { next(err); }
};

export const getAlerts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, severity, type } = req.query;
    const filter = { organizationId: req.user.organizationId };
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (type) filter.type = type;

    const total = await Alert.countDocuments(filter);
    const alerts = await paginate(
      Alert.find(filter).populate("residentId", "firstName lastName").populate("acknowledgedBy resolvedBy", "firstName lastName").sort({ createdAt: -1 }),
      Number(page), Number(limit)
    );
    res.status(200).json({ success: true, data: alerts, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

export const getAlertById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest("Invalid alert ID");
    const alert = await Alert.findOne({ _id: id, organizationId: req.user.organizationId })
      .populate("residentId", "firstName lastName")
      .populate("acknowledgedBy resolvedBy createdBy", "firstName lastName email");
    if (!alert) throw notFound("Alert");
    res.status(200).json({ success: true, data: alert });
  } catch (err) { next(err); }
};

export const acknowledgeAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest("Invalid alert ID");

    const alert = await Alert.findOneAndUpdate(
      { _id: id, organizationId: req.user.organizationId, status: "open" },
      { status: "acknowledged", acknowledgedBy: req.user._id, acknowledgedAt: new Date() },
      { new: true }
    );
    if (!alert) throw notFound("Alert (must be open to acknowledge)");

    await createAuditLog({ organizationId: req.user.organizationId, actorId: req.user._id, action: "update", resourceType: "alert", resourceId: id, metadata: { action: "acknowledge" }, req });
    res.status(200).json({ success: true, message: "Alert acknowledged", data: alert });
  } catch (err) { next(err); }
};

export const resolveAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest("Invalid alert ID");

    const alert = await Alert.findOneAndUpdate(
      { _id: id, organizationId: req.user.organizationId, status: { $ne: "resolved" } },
      { status: "resolved", resolvedBy: req.user._id, resolvedAt: new Date() },
      { new: true }
    );
    if (!alert) throw notFound("Alert (not found or already resolved)");

    await createAuditLog({ organizationId: req.user.organizationId, actorId: req.user._id, action: "update", resourceType: "alert", resourceId: id, metadata: { action: "resolve" }, req });
    res.status(200).json({ success: true, message: "Alert resolved", data: alert });
  } catch (err) { next(err); }
};
