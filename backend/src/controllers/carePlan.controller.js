import mongoose from "mongoose";
import CarePlan from "../models/CarePlan.js";
import Resident from "../models/Resident.js";

// Create Care Plan
export const createCarePlan = async (req, res) => {
  try {
    const {
      residentId,
      title,
      description,
      goals,
      startDate,
      reviewDate,
      status,
    } = req.body;

    // Required fields
    if (!residentId || !title || !description || !startDate) {
      return res.status(400).json({
        success: false,
        message: "residentId, title, description and startDate are required",
      });
    }

    // Validate resident ID
    if (!mongoose.Types.ObjectId.isValid(residentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid residentId",
      });
    }

    // Check resident belongs to logged-in organization
    const resident = await Resident.findOne({
      _id: residentId,
      organizationId: req.user.organizationId,
    });

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: "Resident not found",
      });
    }

    // Create care plan
    const carePlan = await CarePlan.create({
      organizationId: req.user.organizationId,
      residentId,
      title,
      description,
      goals,
      startDate,
      reviewDate,
      status,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Care plan created successfully",
      data: carePlan,
    });
  } catch (error) {
    console.error("Create care plan error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get All Care Plans
export const getCarePlans = async (req, res) => {
  try {
    const carePlans = await CarePlan.find({
      organizationId: req.user.organizationId,
    })
      .populate("residentId", "firstName lastName roomNumber status")
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Care plans fetched successfully",
      data: carePlans,
    });
  } catch (error) {
    console.error("Get care plans error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Care Plan By ID
export const getCarePlanById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid care plan ID",
      });
    }

    const carePlan = await CarePlan.findOne({
      _id: id,
      organizationId: req.user.organizationId,
    })
      .populate("residentId", "firstName lastName roomNumber status")
      .populate("createdBy", "firstName lastName email");
    if (!carePlan) {
      return res.status(404).json({
        success: false,
        message: "Care plan not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Care plan fetched successfully",
      data: carePlan,
    });
  } catch (error) {
    console.error("Get care plan error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Care Plans By Resident
export const getCarePlansByResident = async (req, res) => {
  try {
    const { residentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(residentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid residentId",
      });
    }

    // Verify resident belongs to organization
    const resident = await Resident.findOne({
      _id: residentId,
      organizationId: req.user.organizationId,
    });

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: "Resident not found",
      });
    }

    const carePlans = await CarePlan.find({
      residentId,
      organizationId: req.user.organizationId,
    })
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Resident care plans fetched successfully",
      data: carePlans,
    });
  } catch (error) {
    console.error("Get resident care plans error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update Care Plan
export const updateCarePlan = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid care plan ID",
      });
    }

    // Don't allow organization to be changed
    if (req.body.organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId cannot be changed",
      });
    }

    // Don't allow resident to be changed
    if (req.body.residentId) {
      return res.status(400).json({
        success: false,
        message: "residentId cannot be changed",
      });
    }

    // Don't allow createdBy to be changed
    if (req.body.createdBy) {
      return res.status(400).json({
        success: false,
        message: "createdBy cannot be changed",
      });
    }

    const carePlan = await CarePlan.findOneAndUpdate(
      {
        _id: id,
        organizationId: req.user.organizationId,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      },
    )
      .populate("residentId", "firstName lastName roomNumber status")
      .populate("createdBy", "firstName lastName email");

    if (!carePlan) {
      return res.status(404).json({
        success: false,
        message: "Care plan not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Care plan updated successfully",
      data: carePlan,
    });
  } catch (error) {
    console.error("Update care plan error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete Care Plan
export const deleteCarePlan = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid care plan ID",
      });
    }

    const carePlan = await CarePlan.findOneAndDelete({
      _id: id,
      organizationId: req.user.organizationId,
    });

    if (!carePlan) {
      return res.status(404).json({
        success: false,
        message: "Care plan not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Care plan deleted successfully",
    });
  } catch (error) {
    console.error("Delete care plan error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
