// src/controllers/decision.controller.js
import mongoose from "mongoose";
import Decision from "../models/Decision.js";
import { createAuditLog } from "../services/audit.service.js";
import { notFound, badRequest } from "../utils/error.js";

const paginate = (query, page = 1, limit = 20) =>
  query.skip((page - 1) * limit).limit(limit);

// ── Create ────────────────────────────────────────────────────────────────────
export const createDecision = async (req, res, next) => {
  try {
    const { title, description, decisionType, priority, status, decisionDate, rationale, assignedTo } = req.body;

    if (!title || !description || !decisionType) {
      throw badRequest("title, description and decisionType are required");
    }

    const decision = await Decision.create({
      organizationId: req.user.organizationId,
      title,
      description,
      decisionType,
      priority: priority || "medium",
      status: status || "pending",
      decisionDate,
      rationale,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      actions: [{
        actorId: req.user._id,
        action: "create",
        timestamp: new Date(),
        reason: "Initial creation",
      }],
    });

    await createAuditLog({
      organizationId: req.user.organizationId,
      actorId: req.user._id,
      action: "create",
      resourceType: "decision",
      resourceId: decision._id,
      metadata: { title, decisionType, priority },
      req,
    });

    const populated = await Decision.findById(decision._id)
      .populate("createdBy", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email");

    res.status(201).json({ success: true, message: "Decision created successfully", data: populated });
  } catch (err) { next(err); }
};

// ── List ──────────────────────────────────────────────────────────────────────
export const getDecisions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, decisionType, priority } = req.query;
    const filter = { organizationId: req.user.organizationId };
    if (status) filter.status = status;
    if (decisionType) filter.decisionType = decisionType;
    if (priority) filter.priority = priority;

    const total = await Decision.countDocuments(filter);
    const decisions = await paginate(
      Decision.find(filter)
        .populate("createdBy", "firstName lastName email")
        .populate("assignedTo", "firstName lastName email")
        .sort({ createdAt: -1 }),
      Number(page),
      Number(limit)
    );

    res.status(200).json({
      success: true,
      message: "Decisions fetched successfully",
      data: decisions,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

// ── Get by ID ─────────────────────────────────────────────────────────────────
export const getDecisionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest("Invalid decision ID");

    const decision = await Decision.findOne({ _id: id, organizationId: req.user.organizationId })
      .populate("createdBy", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email")
      .populate("actions.actorId", "firstName lastName email");

    if (!decision) throw notFound("Decision");

    res.status(200).json({ success: true, message: "Decision fetched successfully", data: decision });
  } catch (err) { next(err); }
};

// ── Update ────────────────────────────────────────────────────────────────────
export const updateDecision = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest("Invalid decision ID");

    // Block protected fields
    ["organizationId", "createdBy", "actions"].forEach(f => { if (req.body[f]) throw badRequest(`${f} cannot be changed directly`); });

    const existing = await Decision.findOne({ _id: id, organizationId: req.user.organizationId });
    if (!existing) throw notFound("Decision");

    const allowedFields = ["title", "description", "decisionType", "priority", "status", "decisionDate", "rationale", "assignedTo", "outcome", "previousValue", "newValue"];
    const updates = {};
    allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const actionEntry = {
      actorId: req.user._id,
      action: "update",
      timestamp: new Date(),
      reason: req.body.reason || "",
      previousValue: existing.status,
      newValue: updates.status || existing.status,
    };

    const decision = await Decision.findOneAndUpdate(
      { _id: id, organizationId: req.user.organizationId },
      { ...updates, $push: { actions: actionEntry } },
      { new: true, runValidators: true }
    ).populate("createdBy", "firstName lastName email").populate("assignedTo", "firstName lastName email");

    await createAuditLog({
      organizationId: req.user.organizationId,
      actorId: req.user._id,
      action: "update",
      resourceType: "decision",
      resourceId: id,
      metadata: updates,
      req,
    });

    res.status(200).json({ success: true, message: "Decision updated successfully", data: decision });
  } catch (err) { next(err); }
};

// ── Approve ───────────────────────────────────────────────────────────────────
export const approveDecision = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest("Invalid decision ID");
    const reason = req.body?.reason || "";

    const decision = await Decision.findOneAndUpdate(
      { _id: id, organizationId: req.user.organizationId },
      {
        status: "approved",
        $push: {
          actions: { actorId: req.user._id, action: "approve", timestamp: new Date(), reason, previousValue: "pending", newValue: "approved" },
        },
      },
      { new: true, runValidators: true }
    ).populate("createdBy", "firstName lastName email");

    if (!decision) throw notFound("Decision");

    await createAuditLog({ organizationId: req.user.organizationId, actorId: req.user._id, action: "update", resourceType: "decision", resourceId: id, metadata: { action: "approve" }, req });

    res.status(200).json({ success: true, message: "Decision approved", data: decision });
  } catch (err) { next(err); }
};

// ── Reject ────────────────────────────────────────────────────────────────────
export const rejectDecision = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest("Invalid decision ID");
    if (!req.body.reason) throw badRequest("A reason is required when rejecting a decision");

    const decision = await Decision.findOneAndUpdate(
      { _id: id, organizationId: req.user.organizationId },
      {
        status: "rejected",
        $push: { actions: { actorId: req.user._id, action: "reject", timestamp: new Date(), reason: req.body.reason, previousValue: "pending", newValue: "rejected" } },
      },
      { new: true, runValidators: true }
    ).populate("createdBy", "firstName lastName email");

    if (!decision) throw notFound("Decision");

    await createAuditLog({ organizationId: req.user.organizationId, actorId: req.user._id, action: "update", resourceType: "decision", resourceId: id, metadata: { action: "reject", reason: req.body.reason }, req });

    res.status(200).json({ success: true, message: "Decision rejected", data: decision });
  } catch (err) { next(err); }
};

// ── Override ──────────────────────────────────────────────────────────────────
export const overrideDecision = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest("Invalid decision ID");
    if (!req.body.reason) throw badRequest("A reason is required when overriding a decision");

    const existing = await Decision.findOne({ _id: id, organizationId: req.user.organizationId });
    if (!existing) throw notFound("Decision");

    const decision = await Decision.findOneAndUpdate(
      { _id: id, organizationId: req.user.organizationId },
      {
        status: "overridden",
        ...(req.body.newValue !== undefined ? { newValue: req.body.newValue } : {}),
        previousValue: existing.status,
        $push: { actions: { actorId: req.user._id, action: "override", timestamp: new Date(), reason: req.body.reason, previousValue: existing.status, newValue: req.body.newValue } },
      },
      { new: true, runValidators: true }
    ).populate("createdBy", "firstName lastName email");

    await createAuditLog({ organizationId: req.user.organizationId, actorId: req.user._id, action: "ai_override", resourceType: "decision", resourceId: id, metadata: { reason: req.body.reason }, req });

    res.status(200).json({ success: true, message: "Decision overridden", data: decision });
  } catch (err) { next(err); }
};

// ── Delete ────────────────────────────────────────────────────────────────────
export const deleteDecision = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest("Invalid decision ID");

    const decision = await Decision.findOneAndDelete({ _id: id, organizationId: req.user.organizationId });
    if (!decision) throw notFound("Decision");

    await createAuditLog({ organizationId: req.user.organizationId, actorId: req.user._id, action: "delete", resourceType: "decision", resourceId: id, req });

    res.status(200).json({ success: true, message: "Decision deleted successfully" });
  } catch (err) { next(err); }
};
