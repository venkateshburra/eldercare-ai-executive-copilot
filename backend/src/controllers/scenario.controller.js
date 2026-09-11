// src/controllers/scenario.controller.js
import mongoose from "mongoose";
import Scenario from "../models/Scenario.js";
import ScenarioVersion from "../models/ScenarioVersion.js";
import { generateScenarioAnalysis } from "../services/ai/scenario.service.js";
import { createAuditLog } from "../services/audit.service.js";
import { badRequest, notFound } from "../utils/error.js";
import logger from "../utils/logger.js";

// Helper: Calculate deterministic model metrics from assumptions
const calculateScenarioMetrics = (assumptions = []) => {
  const map = {};
  assumptions.forEach(a => { map[a.key] = Number(a.value) || a.value; });

  const caregiverStaffing = map.caregiverStaffing || 20;
  const residentCount = map.residentCount || 65;
  const nurseHoursPerWeek = map.nurseHoursPerWeek || 35;
  const occupancyRate = map.occupancyRate || 88; // percentage
  const avgMonthlyFee = map.avgMonthlyFee || 4500;
  const caregiverHourlyRate = map.caregiverHourlyRate || 22;

  const staffToResidentRatio = Math.round((caregiverStaffing / (residentCount || 1)) * 100) / 100;
  const estimatedMonthlyRevenue = Math.round(residentCount * avgMonthlyFee);
  const estimatedStaffCost = Math.round(caregiverStaffing * 40 * 4.33 * caregiverHourlyRate);
  const netOperatingMargin = Math.round(estimatedMonthlyRevenue - estimatedStaffCost);
  const riskIndex = staffToResidentRatio < 0.25 ? "High" : staffToResidentRatio < 0.33 ? "Moderate" : "Low";
  const projectedIncidentRate = Math.max(0.5, Math.round((2.8 - (staffToResidentRatio * 3.5)) * 10) / 10);

  return {
    staffToResidentRatio,
    estimatedMonthlyRevenue,
    estimatedStaffCost,
    netOperatingMargin,
    riskIndex,
    projectedIncidentRate,
    calculatedAt: new Date().toISOString(),
  };
};

// ── GET /api/scenarios ────────────────────────────────────────────────────────
export const getScenarios = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { category, type, status, search, page = 1, limit = 20 } = req.query;

    const filter = { organizationId };
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [scenarios, total] = await Promise.all([
      Scenario.find(filter)
        .populate("createdBy", "firstName lastName email")
        .populate("latestVersionId")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Scenario.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: scenarios,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (err) {
    logger.error("getScenarios error:", err.message);
    next(err);
  }
};

// ── GET /api/scenarios/:id ────────────────────────────────────────────────────
export const getScenarioById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest("Invalid scenario ID");

    const scenario = await Scenario.findOne({
      _id: id,
      organizationId: req.user.organizationId,
    })
      .populate("createdBy", "firstName lastName email")
      .populate("latestVersionId");

    if (!scenario) throw notFound("Scenario");

    const versions = await ScenarioVersion.find({
      scenarioId: id,
      organizationId: req.user.organizationId,
    })
      .populate("createdBy", "firstName lastName email")
      .sort({ versionNumber: -1 });

    return res.status(200).json({
      success: true,
      data: {
        ...scenario.toObject(),
        versions,
      },
    });
  } catch (err) {
    logger.error("getScenarioById error:", err.message);
    next(err);
  }
};

// ── POST /api/scenarios ───────────────────────────────────────────────────────
export const createScenario = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { title, description, category, type, assumptions = [] } = req.body;

    if (!title || !title.trim()) throw badRequest("Scenario title is required");

    const calculatedOutput = calculateScenarioMetrics(assumptions);

    const scenario = await Scenario.create({
      organizationId,
      createdBy: req.user._id,
      title: title.trim(),
      description: description?.trim() || "",
      category: category || "custom",
      type: type || "base",
      assumptions,
      result: calculatedOutput,
      status: "draft",
    });

    // Create initial Version 1
    const version1 = await ScenarioVersion.create({
      organizationId,
      scenarioId: scenario._id,
      versionNumber: 1,
      createdBy: req.user._id,
      assumptions,
      result: calculatedOutput,
      notes: "Initial version",
    });

    scenario.latestVersionId = version1._id;
    await scenario.save();

    await createAuditLog({
      organizationId,
      actorId: req.user._id,
      action: "create",
      resourceType: "scenario",
      resourceId: scenario._id,
      metadata: { title, category, type },
      req,
    });

    return res.status(201).json({
      success: true,
      message: "Scenario created successfully",
      data: scenario,
    });
  } catch (err) {
    logger.error("createScenario error:", err.message);
    next(err);
  }
};

// ── PATCH /api/scenarios/:id ──────────────────────────────────────────────────
export const updateScenario = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest("Invalid scenario ID");
    if (req.body.organizationId) throw badRequest("organizationId cannot be changed");

    const { title, description, category, type, status } = req.body;

    const scenario = await Scenario.findOneAndUpdate(
      { _id: id, organizationId: req.user.organizationId },
      {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(category && { category }),
        ...(type && { type }),
        ...(status && { status }),
      },
      { new: true, runValidators: true }
    );

    if (!scenario) throw notFound("Scenario");

    await createAuditLog({
      organizationId: req.user.organizationId,
      actorId: req.user._id,
      action: "update",
      resourceType: "scenario",
      resourceId: id,
      metadata: req.body,
      req,
    });

    return res.status(200).json({
      success: true,
      message: "Scenario updated successfully",
      data: scenario,
    });
  } catch (err) {
    logger.error("updateScenario error:", err.message);
    next(err);
  }
};

// ── POST /api/scenarios/:id/versions ──────────────────────────────────────────
export const createScenarioVersion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const { assumptions = [], notes = "" } = req.body;

    const scenario = await Scenario.findOne({ _id: id, organizationId });
    if (!scenario) throw notFound("Scenario");

    // Get latest version number
    const latestVersion = await ScenarioVersion.findOne({ scenarioId: id, organizationId })
      .sort({ versionNumber: -1 });
    const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    const calculatedOutput = calculateScenarioMetrics(assumptions);

    const newVersion = await ScenarioVersion.create({
      organizationId,
      scenarioId: id,
      versionNumber: nextVersionNumber,
      createdBy: req.user._id,
      assumptions,
      result: calculatedOutput,
      notes: notes.trim(),
    });

    scenario.assumptions = assumptions;
    scenario.result = calculatedOutput;
    scenario.latestVersionId = newVersion._id;
    await scenario.save();

    await createAuditLog({
      organizationId,
      actorId: req.user._id,
      action: "create_version",
      resourceType: "scenario_version",
      resourceId: newVersion._id,
      metadata: { scenarioId: id, versionNumber: nextVersionNumber },
      req,
    });

    return res.status(201).json({
      success: true,
      message: `Scenario version ${nextVersionNumber} created successfully`,
      data: newVersion,
    });
  } catch (err) {
    logger.error("createScenarioVersion error:", err.message);
    next(err);
  }
};

// ── POST /api/scenarios/:id/simulate ──────────────────────────────────────────
export const simulateScenario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const { customPrompt } = req.body;

    const scenario = await Scenario.findOne({ _id: id, organizationId });
    if (!scenario) throw notFound("Scenario");

    const promptText = customPrompt || 
      `Analyze senior living scenario "${scenario.title}" with assumptions: ${JSON.stringify(scenario.assumptions)}. Evaluate financial impact, staffing adequacy, and resident care quality.`;

    const aiResult = await generateScenarioAnalysis(organizationId, promptText);
    const calculatedMetrics = calculateScenarioMetrics(scenario.assumptions);

    const simulationResult = {
      ...calculatedMetrics,
      aiAnalysis: aiResult?.analysis || aiResult,
      simulatedAt: new Date().toISOString(),
    };

    scenario.result = simulationResult;
    await scenario.save();

    // If there is a latest version, update its result as well
    if (scenario.latestVersionId) {
      await ScenarioVersion.findByIdAndUpdate(scenario.latestVersionId, {
        result: simulationResult,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Simulation completed successfully",
      data: simulationResult,
    });
  } catch (err) {
    logger.error("simulateScenario error:", err.message);
    next(err);
  }
};

// ── POST /api/scenarios/compare ───────────────────────────────────────────────
export const compareScenarios = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { scenarioIds = [] } = req.body;

    if (!Array.isArray(scenarioIds) || scenarioIds.length < 2) {
      throw badRequest("Please provide at least 2 scenario IDs to compare");
    }

    const scenarios = await Scenario.find({
      _id: { $in: scenarioIds },
      organizationId,
    }).populate("latestVersionId");

    const comparison = scenarios.map(s => ({
      id: s._id,
      title: s.title,
      category: s.category,
      type: s.type,
      status: s.status,
      assumptions: s.assumptions,
      result: s.result,
      updatedAt: s.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      data: {
        count: comparison.length,
        scenarios: comparison,
      },
    });
  } catch (err) {
    logger.error("compareScenarios error:", err.message);
    next(err);
  }
};

// ── DELETE /api/scenarios/:id ─────────────────────────────────────────────────
export const deleteScenario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const scenario = await Scenario.findOneAndDelete({ _id: id, organizationId });
    if (!scenario) throw notFound("Scenario");

    await ScenarioVersion.deleteMany({ scenarioId: id, organizationId });

    await createAuditLog({
      organizationId,
      actorId: req.user._id,
      action: "delete",
      resourceType: "scenario",
      resourceId: id,
      req,
    });

    return res.status(200).json({
      success: true,
      message: "Scenario and its versions deleted successfully",
    });
  } catch (err) {
    logger.error("deleteScenario error:", err.message);
    next(err);
  }
};
