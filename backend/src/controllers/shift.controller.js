// src/controllers/shift.controller.js
import mongoose from "mongoose";
import Shift from "../models/Shift.js";
import { createAuditLog } from "../services/audit.service.js";
import { notFound, badRequest } from "../utils/error.js";

const paginate = (q, page, limit) => q.skip((page - 1) * limit).limit(limit);

export const createShift = async (req, res, next) => {
  try {
    const { staffId, date, startTime, endTime, shiftType, handoverNotes } = req.body;
    if (!staffId || !date || !startTime || !endTime) throw badRequest("staffId, date, startTime, and endTime are required");
    if (!mongoose.Types.ObjectId.isValid(staffId)) throw badRequest("Invalid staffId");

    const shift = await Shift.create({
      organizationId: req.user.organizationId,
      staffId,
      date,
      startTime,
      endTime,
      shiftType: shiftType || "morning",
      handoverNotes: handoverNotes || "",
      createdBy: req.user._id,
    });

    await createAuditLog({ organizationId: req.user.organizationId, actorId: req.user._id, action: "create", resourceType: "shift", resourceId: shift._id, req });
    const populated = await Shift.findById(shift._id).populate("staffId", "employeeId department position").populate("createdBy", "firstName lastName");
    res.status(201).json({ success: true, message: "Shift created", data: populated });
  } catch (err) { next(err); }
};

export const getShifts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, staffId, shiftType, dateFrom, dateTo } = req.query;
    const filter = { organizationId: req.user.organizationId };
    if (status) filter.status = status;
    if (staffId && mongoose.Types.ObjectId.isValid(staffId)) filter.staffId = staffId;
    if (shiftType) filter.shiftType = shiftType;
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    const total = await Shift.countDocuments(filter);
    const shifts = await paginate(
      Shift.find(filter).populate("staffId", "employeeId department position").populate("createdBy", "firstName lastName").sort({ date: -1 }),
      Number(page), Number(limit)
    );
    res.status(200).json({ success: true, data: shifts, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

export const getShiftById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest("Invalid shift ID");
    const shift = await Shift.findOne({ _id: id, organizationId: req.user.organizationId })
      .populate("staffId", "employeeId department position")
      .populate("createdBy", "firstName lastName email");
    if (!shift) throw notFound("Shift");
    res.status(200).json({ success: true, data: shift });
  } catch (err) { next(err); }
};

export const updateShift = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest("Invalid shift ID");
    ["organizationId", "createdBy"].forEach(f => { if (req.body[f]) throw badRequest(`${f} cannot be changed`); });

    const existing = await Shift.findOne({ _id: id, organizationId: req.user.organizationId });
    if (!existing) throw notFound("Shift");

    const allowed = ["date", "startTime", "endTime", "shiftType", "status", "handoverNotes"];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const shift = await Shift.findOneAndUpdate(
      { _id: id, organizationId: req.user.organizationId },
      updates,
      { new: true, runValidators: true }
    ).populate("staffId", "employeeId department position");

    await createAuditLog({ organizationId: req.user.organizationId, actorId: req.user._id, action: "update", resourceType: "shift", resourceId: id, metadata: updates, req });
    res.status(200).json({ success: true, message: "Shift updated", data: shift });
  } catch (err) { next(err); }
};

export const deleteShift = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest("Invalid shift ID");
    const shift = await Shift.findOneAndDelete({ _id: id, organizationId: req.user.organizationId });
    if (!shift) throw notFound("Shift");
    await createAuditLog({ organizationId: req.user.organizationId, actorId: req.user._id, action: "delete", resourceType: "shift", resourceId: id, req });
    res.status(200).json({ success: true, message: "Shift deleted" });
  } catch (err) { next(err); }
};
