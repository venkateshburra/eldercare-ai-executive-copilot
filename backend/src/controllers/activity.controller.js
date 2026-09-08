import mongoose from "mongoose";
import Activity from "../models/Activity.js";
import Resident from "../models/Resident.js";

// Create Activity
export const createActivity = async (req, res) => {
  try {
    const {
      residentId,
      name,
      type,
      description,
      scheduledDate,
      duration,
      status,
      notes,
    } = req.body;

    if (!residentId || !name || !scheduledDate) {
      return res.status(400).json({
        success: false,
        message: "residentId, name and scheduledDate are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(residentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid residentId",
      });
    }

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

    const activity = await Activity.create({
      organizationId: req.user.organizationId,
      residentId,
      name,
      type,
      description,
      scheduledDate,
      duration,
      status,
      notes,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Activity created successfully",
      data: activity,
    });
  } catch (error) {
    console.error("Create activity error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get All Activities
export const getActivities = async (req, res) => {
  try {
    const activities = await Activity.find({
      organizationId: req.user.organizationId,
    })
      .populate("residentId", "firstName lastName roomNumber status")
      .populate("createdBy", "firstName lastName email")
      .sort({ scheduledDate: -1 });

    res.status(200).json({
      success: true,
      message: "Activities fetched successfully",
      data: activities,
    });
  } catch (error) {
    console.error("Get activities error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Activity By ID
export const getActivityById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid activity ID",
      });
    }

    const activity = await Activity.findOne({
      _id: id,
      organizationId: req.user.organizationId,
    })
      .populate("residentId", "firstName lastName roomNumber status")
      .populate("createdBy", "firstName lastName email");

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Activity fetched successfully",
      data: activity,
    });
  } catch (error) {
    console.error("Get activity error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Activities By Resident
export const getActivitiesByResident = async (req, res) => {
  try {
    const { residentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(residentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid residentId",
      });
    }

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

    const activities = await Activity.find({
      residentId,
      organizationId: req.user.organizationId,
    })
      .populate("createdBy", "firstName lastName email")
      .sort({ scheduledDate: -1 });

    res.status(200).json({
      success: true,
      message: "Resident activities fetched successfully",
      data: activities,
    });
  } catch (error) {
    console.error("Get resident activities error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update Activity
export const updateActivity = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid activity ID",
      });
    }

    if (req.body.organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId cannot be changed",
      });
    }

    if (req.body.residentId) {
      return res.status(400).json({
        success: false,
        message: "residentId cannot be changed",
      });
    }

    if (req.body.createdBy) {
      return res.status(400).json({
        success: false,
        message: "createdBy cannot be changed",
      });
    }

    const activity = await Activity.findOneAndUpdate(
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

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Activity updated successfully",
      data: activity,
    });
  } catch (error) {
    console.error("Update activity error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete Activity
export const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid activity ID",
      });
    }

    const activity = await Activity.findOneAndDelete({
      _id: id,
      organizationId: req.user.organizationId,
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Activity deleted successfully",
    });
  } catch (error) {
    console.error("Delete activity error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
