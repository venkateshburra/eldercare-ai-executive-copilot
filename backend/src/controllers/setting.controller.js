// src/controllers/setting.controller.js
import Setting from "../models/Setting.js";
import { createAuditLog } from "../services/audit.service.js";
import { badRequest } from "../utils/error.js";
import logger from "../utils/logger.js";

// Get organization settings (creates default if not found)
export const getSettings = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    let settings = await Setting.findOne({ organizationId });

    if (!settings) {
      settings = await Setting.create({ organizationId });
    }

    return res.status(200).json({
      success: true,
      message: "Settings retrieved successfully",
      data: settings,
    });
  } catch (err) {
    logger.error("Get settings error:", err.message);
    next(err);
  }
};

// Update organization settings
export const updateSettings = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;

    if (req.body.organizationId) {
      throw badRequest("organizationId cannot be modified");
    }

    const allowedSections = ["aiSettings", "alertThresholds", "notificationRules", "workflowRules"];
    const updateData = { updatedBy: req.user._id };

    for (const key of allowedSections) {
      if (req.body[key] && typeof req.body[key] === "object") {
        updateData[key] = req.body[key];
      }
    }

    const settings = await Setting.findOneAndUpdate(
      { organizationId },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    await createAuditLog({
      organizationId,
      actorId: req.user._id,
      action: "update_settings",
      resourceType: "settings",
      resourceId: settings._id,
      metadata: updateData,
      req,
    });

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: settings,
    });
  } catch (err) {
    logger.error("Update settings error:", err.message);
    next(err);
  }
};
