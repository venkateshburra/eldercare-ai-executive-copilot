// src/controllers/resident.controller.js
import mongoose from "mongoose";
import Resident from "../models/Resident.js";
import { createAuditLog } from "../services/audit.service.js";
import { notFound, badRequest } from "../utils/error.js";
import logger from "../utils/logger.js";

const paginate = (q, page, limit) => q.skip((page - 1) * limit).limit(limit);

export const createResident = async (req, res, next) => {
  try {
    const { firstName, lastName, dateOfBirth, gender, phone, email, roomNumber, admissionDate, status, notes } = req.body;

    if (!firstName || !lastName || !dateOfBirth || !gender || !admissionDate) {
      throw badRequest("firstName, lastName, dateOfBirth, gender and admissionDate are required");
    }

    const resident = await Resident.create({
      organizationId: req.user.organizationId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth,
      gender,
      phone,
      email: email ? email.trim().toLowerCase() : undefined,
      roomNumber,
      admissionDate,
      status: status || "active",
      notes,
    });

    await createAuditLog({
      organizationId: req.user.organizationId,
      actorId: req.user._id,
      action: "create",
      resourceType: "resident",
      resourceId: resident._id,
      metadata: { firstName, lastName },
      req,
    });

    res.status(201).json({ success: true, message: "Resident created successfully", data: resident });
  } catch (err) { next(err); }
};

export const getResidents = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, gender, search } = req.query;
    const filter = { organizationId: req.user.organizationId };
    if (status) filter.status = status;
    if (gender) filter.gender = gender;
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ firstName: regex }, { lastName: regex }, { roomNumber: regex }];
    }

    const total = await Resident.countDocuments(filter);
    const residents = await paginate(
      Resident.find(filter).sort({ createdAt: -1 }),
      Number(page), Number(limit)
    );

    res.status(200).json({
      success: true,
      message: "Residents fetched successfully",
      data: residents,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

export const getResidentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest("Invalid resident ID");

    const resident = await Resident.findOne({ _id: id, organizationId: req.user.organizationId });
    if (!resident) throw notFound("Resident");

    res.status(200).json({ success: true, message: "Resident fetched successfully", data: resident });
  } catch (err) { next(err); }
};

export const updateResident = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest("Invalid resident ID");
    if (req.body.organizationId) throw badRequest("organizationId cannot be changed");

    const existing = await Resident.findOne({ _id: id, organizationId: req.user.organizationId });
    if (!existing) throw notFound("Resident");

    const resident = await Resident.findOneAndUpdate(
      { _id: id, organizationId: req.user.organizationId },
      req.body,
      { new: true, runValidators: true }
    );

    await createAuditLog({
      organizationId: req.user.organizationId,
      actorId: req.user._id,
      action: "update",
      resourceType: "resident",
      resourceId: id,
      metadata: req.body,
      req,
    });

    res.status(200).json({ success: true, message: "Resident updated successfully", data: resident });
  } catch (err) { next(err); }
};

export const deleteResident = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest("Invalid resident ID");

    const resident = await Resident.findOneAndDelete({ _id: id, organizationId: req.user.organizationId });
    if (!resident) throw notFound("Resident");

    await createAuditLog({
      organizationId: req.user.organizationId,
      actorId: req.user._id,
      action: "delete",
      resourceType: "resident",
      resourceId: id,
      req,
    });

    res.status(200).json({ success: true, message: "Resident deleted successfully" });
  } catch (err) { next(err); }
};