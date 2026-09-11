// src/controllers/ai/aiHistory.controller.js
import mongoose from "mongoose";
import AIRun from "../../models/AIRun.js";
import AIApproval from "../../models/AIApproval.js";
import { createAuditLog } from "../../services/audit.service.js";
import { notFound, badRequest } from "../../utils/error.js";

const paginate = (q, page, limit) => q.skip((page - 1) * limit).limit(limit);

// ── AIRun ──────────────────────────────────────────────────────────────────────

export const getAIRuns = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, feature, status, userId, dateFrom, dateTo } = req.query;
    const filter = { organizationId: req.user.organizationId };
    if (feature) filter.feature = feature;
    if (status)  filter.status = status;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) filter.userId = userId;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo)   filter.createdAt.$lte = new Date(dateTo);
    }

    const total = await AIRun.countDocuments(filter);
    const runs = await paginate(
      AIRun.find(filter).populate("userId", "firstName lastName email").sort({ createdAt: -1 }),
      Number(page), Number(limit)
    );

    res.status(200).json({
      success: true,
      data: runs,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

export const getAIRunById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest("Invalid AIRun ID");
    const run = await AIRun.findOne({ _id: id, organizationId: req.user.organizationId })
      .populate("userId", "firstName lastName email");
    if (!run) throw notFound("AIRun");
    res.status(200).json({ success: true, data: run });
  } catch (err) { next(err); }
};

// ── AIApproval ─────────────────────────────────────────────────────────────────

export const getAIApprovals = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, reviewerId, dateFrom, dateTo } = req.query;
    const filter = { organizationId: req.user.organizationId };
    if (status) filter.status = status;
    if (reviewerId && mongoose.Types.ObjectId.isValid(reviewerId)) filter.reviewerId = reviewerId;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo)   filter.createdAt.$lte = new Date(dateTo);
    }

    const total = await AIApproval.countDocuments(filter);
    const approvals = await paginate(
      AIApproval.find(filter)
        .populate("aiRunId")
        .populate("reviewerId", "firstName lastName email")
        .sort({ createdAt: -1 }),
      Number(page), Number(limit)
    );

    res.status(200).json({
      success: true,
      data: approvals,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

export const getAIApprovalById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest("Invalid AIApproval ID");
    const approval = await AIApproval.findOne({ _id: id, organizationId: req.user.organizationId })
      .populate("aiRunId")
      .populate("reviewerId", "firstName lastName email");
    if (!approval) throw notFound("AIApproval");
    res.status(200).json({ success: true, data: approval });
  } catch (err) { next(err); }
};

// ── Review (approve/reject/override) ─────────────────────────────────────────

export const reviewAIApproval = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest("Invalid AIApproval ID");

    const { action, comment, overrideReason, finalOutput } = req.body;
    const validActions = ["approved", "rejected", "overridden"];
    if (!validActions.includes(action)) throw badRequest(`action must be one of: ${validActions.join(", ")}`);
    if ((action === "rejected" || action === "overridden") && !overrideReason) {
      throw badRequest("overrideReason is required when rejecting or overriding");
    }

    const approval = await AIApproval.findOneAndUpdate(
      { _id: id, organizationId: req.user.organizationId, status: "pending" },
      {
        status: action,
        reviewerId: req.user._id,
        comment: comment || "",
        overrideReason: overrideReason || "",
        finalOutput: finalOutput || null,
        reviewedAt: new Date(),
      },
      { new: true }
    ).populate("aiRunId").populate("reviewerId", "firstName lastName email");

    if (!approval) throw notFound("AIApproval (must be pending)");

    const auditAction = action === "approved" ? "ai_approval" : action === "rejected" ? "ai_rejection" : "ai_override";
    await createAuditLog({
      organizationId: req.user.organizationId,
      actorId: req.user._id,
      action: auditAction,
      resourceType: "ai_approval",
      resourceId: id,
      metadata: { action, overrideReason, comment },
      req,
    });

    res.status(200).json({ success: true, message: `AI output ${action}`, data: approval });
  } catch (err) { next(err); }
};
