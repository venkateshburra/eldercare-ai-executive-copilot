import mongoose from "mongoose";
import FamilyMember from "../models/FamilyMember.js";
import Resident from "../models/Resident.js";

// Create Family Member
export const createFamilyMember = async (req, res) => {
  try {
    const {
      residentId,
      firstName,
      lastName,
      relationship,
      email,
      phone,
      isPrimaryContact,
      notes,
      status,
    } = req.body;

    if (!residentId || !firstName || !lastName || !relationship || !phone) {
      return res.status(400).json({
        success: false,
        message:
          "residentId, firstName, lastName, relationship and phone are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(residentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid residentId",
      });
    }

    // Make sure resident belongs to logged-in user's organization
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

    const familyMember = await FamilyMember.create({
      organizationId: req.user.organizationId,
      residentId,
      firstName,
      lastName,
      relationship,
      email,
      phone,
      isPrimaryContact,
      notes,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Family member created successfully",
      data: familyMember,
    });
  } catch (error) {
    console.error("Create family member error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get All Family Members
export const getFamilyMembers = async (req, res) => {
  try {
    const familyMembers = await FamilyMember.find({
      organizationId: req.user.organizationId,
    })
      .populate("residentId", "firstName lastName roomNumber status")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Family members fetched successfully",
      data: familyMembers,
    });
  } catch (error) {
    console.error("Get family members error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Family Members For One Resident
export const getFamilyMembersByResident = async (req, res) => {
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

    const familyMembers = await FamilyMember.find({
      residentId,
      organizationId: req.user.organizationId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Resident family members fetched successfully",
      data: familyMembers,
    });
  } catch (error) {
    console.error("Get resident family members error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Family Member By ID
export const getFamilyMemberById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid family member ID",
      });
    }

    const familyMember = await FamilyMember.findOne({
      _id: id,
      organizationId: req.user.organizationId,
    }).populate("residentId", "firstName lastName roomNumber status");

    if (!familyMember) {
      return res.status(404).json({
        success: false,
        message: "Family member not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Family member fetched successfully",
      data: familyMember,
    });
  } catch (error) {
    console.error("Get family member error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update Family Member
export const updateFamilyMember = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid family member ID",
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

    const familyMember = await FamilyMember.findOneAndUpdate(
      {
        _id: id,
        organizationId: req.user.organizationId,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      },
    ).populate("residentId", "firstName lastName roomNumber status");

    if (!familyMember) {
      return res.status(404).json({
        success: false,
        message: "Family member not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Family member updated successfully",
      data: familyMember,
    });
  } catch (error) {
    console.error("Update family member error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete Family Member
export const deleteFamilyMember = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid family member ID",
      });
    }

    const familyMember = await FamilyMember.findOneAndDelete({
      _id: id,
      organizationId: req.user.organizationId,
    });

    if (!familyMember) {
      return res.status(404).json({
        success: false,
        message: "Family member not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Family member deleted successfully",
    });
  } catch (error) {
    console.error("Delete family member error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
