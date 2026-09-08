import mongoose from "mongoose";
import Decision from "../models/Decision.js";

// Create Decision
export const createDecision = async (req, res) => {
  try {
    const {
      title,
      description,
      decisionType,
      priority,
      status,
      decisionDate,
      rationale,
    } = req.body;

    // Required fields
    if (!title || !description || !decisionType) {
      return res.status(400).json({
        success: false,
        message: "title, description and decisionType are required",
      });
    }

    // Create decision
    const decision = await Decision.create({
      organizationId: req.user.organizationId,
      title,
      description,
      decisionType,
      priority: priority || "medium",
      status: status || "pending",
      decisionDate,
      rationale,
      createdBy: req.user._id,
    });

    const decisionResponse = await Decision.findById(decision._id).populate(
      "createdBy",
      "firstName lastName email",
    );

    res.status(201).json({
      success: true,
      message: "Decision created successfully",
      data: decisionResponse,
    });
  } catch (error) {
    console.error("Create decision error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get All Decisions
export const getDecisions = async (req, res) => {
  try {
    const decisions = await Decision.find({
      organizationId: req.user.organizationId,
    })
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Decisions fetched successfully",
      data: decisions,
    });
  } catch (error) {
    console.error("Get decisions error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Decision By ID
export const getDecisionById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid decision ID",
      });
    }

    const decision = await Decision.findOne({
      _id: id,
      organizationId: req.user.organizationId,
    }).populate("createdBy", "firstName lastName email");

    if (!decision) {
      return res.status(404).json({
        success: false,
        message: "Decision not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Decision fetched successfully",
      data: decision,
    });
  } catch (error) {
    console.error("Get decision error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update Decision
export const updateDecision = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid decision ID",
      });
    }

    // Don't allow organization change
    if (req.body.organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId cannot be changed",
      });
    }

    // Don't allow createdBy change
    if (req.body.createdBy) {
      return res.status(400).json({
        success: false,
        message: "createdBy cannot be changed",
      });
    }

    const decision = await Decision.findOneAndUpdate(
      {
        _id: id,
        organizationId: req.user.organizationId,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      },
    ).populate("createdBy", "firstName lastName email");

    if (!decision) {
      return res.status(404).json({
        success: false,
        message: "Decision not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Decision updated successfully",
      data: decision,
    });
  } catch (error) {
    console.error("Update decision error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete Decision
export const deleteDecision = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid decision ID",
      });
    }

    const decision = await Decision.findOneAndDelete({
      _id: id,
      organizationId: req.user.organizationId,
    });

    if (!decision) {
      return res.status(404).json({
        success: false,
        message: "Decision not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Decision deleted successfully",
    });
  } catch (error) {
    console.error("Delete decision error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
