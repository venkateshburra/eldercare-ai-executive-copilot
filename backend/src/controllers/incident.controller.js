import mongoose from "mongoose";
import Incident from "../models/Incident.js";
import Resident from "../models/Resident.js";

// Create Incident
export const createIncident = async (req, res) => {
  try {
    const {
      residentId,
      type,
      severity,
      description,
      incidentDate,
      location,
      actionTaken,
      status,
    } = req.body;

    // Required fields
    if (!residentId || !type || !severity || !description || !incidentDate) {
      return res.status(400).json({
        success: false,
        message:
          "residentId, type, severity, description and incidentDate are required",
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

    // Create incident
    const incident = await Incident.create({
      organizationId: req.user.organizationId,
      residentId,
      type,
      severity,
      description,
      incidentDate,
      location,
      actionTaken,
      status: status || "open",
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Incident created successfully",
      data: incident,
    });
  } catch (error) {
    console.error("Create incident error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get All Incidents
export const getIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find({
      organizationId: req.user.organizationId,
    })
      .populate("residentId", "firstName lastName roomNumber status")
      .populate("createdBy", "firstName lastName email")
      .sort({ incidentDate: -1 });

    res.status(200).json({
      success: true,
      message: "Incidents fetched successfully",
      data: incidents,
    });
  } catch (error) {
    console.error("Get incidents error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Incident By ID
export const getIncidentById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate incident ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid incident ID",
      });
    }

    const incident = await Incident.findOne({
      _id: id,
      organizationId: req.user.organizationId,
    })
      .populate("residentId", "firstName lastName roomNumber status")
      .populate("createdBy", "firstName lastName email");

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Incident fetched successfully",
      data: incident,
    });
  } catch (error) {
    console.error("Get incident error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Incidents By Resident
export const getIncidentsByResident = async (req, res) => {
  try {
    const { residentId } = req.params;

    // Validate resident ID
    if (!mongoose.Types.ObjectId.isValid(residentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid residentId",
      });
    }

    // Make sure resident belongs to same organization
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

    const incidents = await Incident.find({
      residentId,
      organizationId: req.user.organizationId,
    })
      .populate("createdBy", "firstName lastName email")
      .sort({ incidentDate: -1 });

    res.status(200).json({
      success: true,
      message: "Resident incidents fetched successfully",
      data: incidents,
    });
  } catch (error) {
    console.error("Get resident incidents error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update Incident
export const updateIncident = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate incident ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid incident ID",
      });
    }

    // Don't allow organizationId to be changed
    if (req.body.organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId cannot be changed",
      });
    }

    // Don't allow createdBy to be changed
    if (req.body.createdBy) {
      return res.status(400).json({
        success: false,
        message: "createdBy cannot be changed",
      });
    }

    // If resident is being changed
    if (req.body.residentId) {
      if (!mongoose.Types.ObjectId.isValid(req.body.residentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid residentId",
        });
      }

      const resident = await Resident.findOne({
        _id: req.body.residentId,
        organizationId: req.user.organizationId,
      });

      if (!resident) {
        return res.status(404).json({
          success: false,
          message: "Resident not found in this organization",
        });
      }
    }

    const incident = await Incident.findOneAndUpdate(
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

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Incident updated successfully",
      data: incident,
    });
  } catch (error) {
    console.error("Update incident error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete Incident
export const deleteIncident = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate incident ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid incident ID",
      });
    }

    const incident = await Incident.findOneAndDelete({
      _id: id,
      organizationId: req.user.organizationId,
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Incident deleted successfully",
    });
  } catch (error) {
    console.error("Delete incident error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
