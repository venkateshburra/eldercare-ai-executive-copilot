import mongoose from "mongoose";
import Resident from "../models/Resident.js";

// Create Resident
export const createResident = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      email,
      roomNumber,
      admissionDate,
      status,
      notes,
    } = req.body;

    // Required fields
    if (!firstName || !lastName || !dateOfBirth || !gender || !admissionDate) {
      return res.status(400).json({
        success: false,
        message:
          "firstName, lastName, dateOfBirth, gender and admissionDate are required",
      });
    }

    // Organization comes from authenticated user
    const organizationId = req.user.organizationId;

    const resident = await Resident.create({
      organizationId,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      email,
      roomNumber,
      admissionDate,
      status,
      notes,
    });

    res.status(201).json({
      success: true,
      message: "Resident created successfully",
      data: resident,
    });
  } catch (error) {
    console.error("Create resident error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get All Residents
export const getResidents = async (req, res) => {
  try {
    const residents = await Resident.find({
      organizationId: req.user.organizationId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Residents fetched successfully",
      data: residents,
    });
  } catch (error) {
    console.error("Get residents error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Resident By ID
export const getResidentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid resident ID",
      });
    }

    const resident = await Resident.findOne({
      _id: id,
      organizationId: req.user.organizationId,
    });

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: "Resident not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Resident fetched successfully",
      data: resident,
    });
  } catch (error) {
    console.error("Get resident error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update Resident
export const updateResident = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid resident ID",
      });
    }

    // Never allow organization to be changed
    if (req.body.organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId cannot be changed",
      });
    }

    const resident = await Resident.findOneAndUpdate(
      {
        _id: id,
        organizationId: req.user.organizationId,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: "Resident not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Resident updated successfully",
      data: resident,
    });
  } catch (error) {
    console.error("Update resident error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete Resident
export const deleteResident = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid resident ID",
      });
    }

    const resident = await Resident.findOneAndDelete({
      _id: id,
      organizationId: req.user.organizationId,
    });

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: "Resident not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Resident deleted successfully",
    });
  } catch (error) {
    console.error("Delete resident error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};