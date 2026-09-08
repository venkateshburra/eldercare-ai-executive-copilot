import mongoose from "mongoose";
import Medication from "../models/Medication.js";
import Resident from "../models/Resident.js";

// Create Medication
export const createMedication = async (req, res) => {
  try {
    const {
      residentId,
      name,
      dosage,
      frequency,
      route,
      startDate,
      endDate,
      prescribedBy,
      instructions,
      status,
      notes,
    } = req.body;

    if (!residentId || !name || !dosage || !frequency || !startDate) {
      return res.status(400).json({
        success: false,
        message:
          "residentId, name, dosage, frequency and startDate are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(residentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid residentId",
      });
    }

    // Verify resident belongs to logged-in organization
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

    const medication = await Medication.create({
      organizationId: req.user.organizationId,
      residentId,
      name,
      dosage,
      frequency,
      route,
      startDate,
      endDate,
      prescribedBy,
      instructions,
      status,
      notes,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Medication created successfully",
      data: medication,
    });
  } catch (error) {
    console.error("Create medication error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get All Medications
export const getMedications = async (req, res) => {
  try {
    const medications = await Medication.find({
      organizationId: req.user.organizationId,
    })
      .populate("residentId", "firstName lastName roomNumber status")
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Medications fetched successfully",
      data: medications,
    });
  } catch (error) {
    console.error("Get medications error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Medication By ID
export const getMedicationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid medication ID",
      });
    }

    const medication = await Medication.findOne({
      _id: id,
      organizationId: req.user.organizationId,
    })
      .populate("residentId", "firstName lastName roomNumber status")
      .populate("createdBy", "firstName lastName email");

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Medication fetched successfully",
      data: medication,
    });
  } catch (error) {
    console.error("Get medication error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Medications By Resident
export const getMedicationsByResident = async (req, res) => {
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

    const medications = await Medication.find({
      residentId,
      organizationId: req.user.organizationId,
    })
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Resident medications fetched successfully",
      data: medications,
    });
  } catch (error) {
    console.error("Get resident medications error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update Medication
export const updateMedication = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid medication ID",
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

    const medication = await Medication.findOneAndUpdate(
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

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Medication updated successfully",
      data: medication,
    });
  } catch (error) {
    console.error("Update medication error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete Medication
export const deleteMedication = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid medication ID",
      });
    }

    const medication = await Medication.findOneAndDelete({
      _id: id,
      organizationId: req.user.organizationId,
    });

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Medication deleted successfully",
    });
  } catch (error) {
    console.error("Delete medication error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
