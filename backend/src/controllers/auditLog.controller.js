// src/controllers/auditLog.controller.js
import mongoose from "mongoose";
import AuditLog from "../models/AuditLog.js";
import { badRequest } from "../utils/error.js";

const paginate = (q, page, limit) => q.skip((page - 1) * limit).limit(limit);

// GET /api/audit-logs — admin-only, full org audit trail
export const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, action, resourceType, actorId, dateFrom, dateTo, outcome } = req.query;

    const filter = { organizationId: req.user.organizationId };
    if (action) filter.action = action;
    if (resourceType) filter.resourceType = resourceType;
    if (outcome) filter.outcome = outcome;
    if (actorId && mongoose.Types.ObjectId.isValid(actorId)) filter.actorId = actorId;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo)   filter.createdAt.$lte = new Date(dateTo);
    }

    const total = await AuditLog.countDocuments(filter);
    const logs = await paginate(
      AuditLog.find(filter)
        .populate("actorId", "firstName lastName email")
        .sort({ createdAt: -1 }),
      Number(page),
      Number(limit)
    );

    res.status(200).json({
      success: true,
      message: "Audit logs fetched",
      data: logs,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};
