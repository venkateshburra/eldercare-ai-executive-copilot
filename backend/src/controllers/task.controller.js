// src/controllers/task.controller.js
import mongoose from "mongoose";
import Task from "../models/Task.js";
import { createAuditLog } from "../services/audit.service.js";
import { notFound, badRequest } from "../utils/error.js";

const paginate = (q, page, limit) => q.skip((page - 1) * limit).limit(limit);

export const createTask = async (req, res, next) => {
  try {
    const { title, description, assignedTo, priority, dueDate, relatedResourceType, relatedResourceId } = req.body;
    if (!title) throw badRequest("title is required");

    const task = await Task.create({
      organizationId: req.user.organizationId,
      title,
      description,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      priority: priority || "medium",
      dueDate: dueDate || null,
      relatedResourceType: relatedResourceType || null,
      relatedResourceId: relatedResourceId || null,
      actions: [{ actorId: req.user._id, action: "create", timestamp: new Date(), reason: "Initial creation" }],
    });

    await createAuditLog({ organizationId: req.user.organizationId, actorId: req.user._id, action: "create", resourceType: "task", resourceId: task._id, req });
    const populated = await Task.findById(task._id).populate("assignedTo createdBy", "firstName lastName email");
    res.status(201).json({ success: true, message: "Task created", data: populated });
  } catch (err) { next(err); }
};

export const getTasks = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, priority, assignedTo } = req.query;
    const filter = { organizationId: req.user.organizationId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) filter.assignedTo = assignedTo;

    const total = await Task.countDocuments(filter);
    const tasks = await paginate(
      Task.find(filter).populate("assignedTo createdBy", "firstName lastName email").sort({ createdAt: -1 }),
      Number(page), Number(limit)
    );
    res.status(200).json({ success: true, data: tasks, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

export const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest("Invalid task ID");
    const task = await Task.findOne({ _id: id, organizationId: req.user.organizationId })
      .populate("assignedTo createdBy", "firstName lastName email")
      .populate("actions.actorId", "firstName lastName email");
    if (!task) throw notFound("Task");
    res.status(200).json({ success: true, data: task });
  } catch (err) { next(err); }
};

export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest("Invalid task ID");
    ["organizationId", "createdBy", "actions"].forEach(f => { if (req.body[f]) throw badRequest(`${f} cannot be changed`); });

    const existing = await Task.findOne({ _id: id, organizationId: req.user.organizationId });
    if (!existing) throw notFound("Task");

    const allowed = ["title", "description", "assignedTo", "status", "priority", "dueDate", "relatedResourceType", "relatedResourceId"];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    if (updates.status === "completed") updates.completedAt = new Date();

    const task = await Task.findOneAndUpdate(
      { _id: id, organizationId: req.user.organizationId },
      { ...updates, $push: { actions: { actorId: req.user._id, action: "update", timestamp: new Date(), reason: req.body.reason || "", previousValue: existing.status, newValue: updates.status || existing.status } } },
      { new: true, runValidators: true }
    ).populate("assignedTo createdBy", "firstName lastName email");

    await createAuditLog({ organizationId: req.user.organizationId, actorId: req.user._id, action: "update", resourceType: "task", resourceId: id, metadata: updates, req });
    res.status(200).json({ success: true, message: "Task updated", data: task });
  } catch (err) { next(err); }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest("Invalid task ID");
    const task = await Task.findOneAndDelete({ _id: id, organizationId: req.user.organizationId });
    if (!task) throw notFound("Task");
    await createAuditLog({ organizationId: req.user.organizationId, actorId: req.user._id, action: "delete", resourceType: "task", resourceId: id, req });
    res.status(200).json({ success: true, message: "Task deleted" });
  } catch (err) { next(err); }
};
