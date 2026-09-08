import mongoose from "mongoose";
import Staff from "../models/Staff.js";
import User from "../models/User.js";

// Create Staff
export const createStaff = async (req, res) => {
  try {
    const {
      userId,
      employeeId,
      department,
      position,
      phone,
      hireDate,
      status,
      notes,
    } = req.body;

    // Required fields
    if (!userId || !employeeId || !department || !position) {
      return res.status(400).json({
        success: false,
        message: "userId, employeeId, department and position are required",
      });
    }

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    // Check user belongs to same organization
    const user = await User.findOne({
      _id: userId,
      organizationId: req.user.organizationId,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in this organization",
      });
    }

    // Check whether this user is already a staff member
    const existingStaff = await Staff.findOne({
      userId,
      organizationId: req.user.organizationId,
    });

    if (existingStaff) {
      return res.status(409).json({
        success: false,
        message: "This user is already registered as staff",
      });
    }

    // Check employee ID uniqueness within organization
    const existingEmployee = await Staff.findOne({
      employeeId,
      organizationId: req.user.organizationId,
    });

    if (existingEmployee) {
      return res.status(409).json({
        success: false,
        message: "Employee ID already exists",
      });
    }

    // Create staff
    const staff = await Staff.create({
      organizationId: req.user.organizationId,
      userId,
      employeeId,
      department,
      position,
      phone,
      hireDate,
      status: status || "active",
      notes,
      createdBy: req.user._id,
    });

    const staffResponse = await Staff.findById(staff._id)
      .populate("userId", "firstName lastName email status")
      .populate("createdBy", "firstName lastName email");

    res.status(201).json({
      success: true,
      message: "Staff created successfully",
      data: staffResponse,
    });
  } catch (error) {
    console.error("Create staff error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get All Staff
export const getStaff = async (req, res) => {
  try {
    const staff = await Staff.find({
      organizationId: req.user.organizationId,
    })
      .populate("userId", "firstName lastName email status")
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Staff fetched successfully",
      data: staff,
    });
  } catch (error) {
    console.error("Get staff error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Staff By ID
export const getStaffById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate staff ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff ID",
      });
    }

    const staff = await Staff.findOne({
      _id: id,
      organizationId: req.user.organizationId,
    })
      .populate("userId", "firstName lastName email status")
      .populate("createdBy", "firstName lastName email");

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Staff fetched successfully",
      data: staff,
    });
  } catch (error) {
    console.error("Get staff error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update Staff
export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate staff ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff ID",
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

    // Find existing staff
    const existingStaff = await Staff.findOne({
      _id: id,
      organizationId: req.user.organizationId,
    });

    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    // If userId is being changed
    if (req.body.userId) {
      if (!mongoose.Types.ObjectId.isValid(req.body.userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid userId",
        });
      }

      const user = await User.findOne({
        _id: req.body.userId,
        organizationId: req.user.organizationId,
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found in this organization",
        });
      }

      const duplicateStaff = await Staff.findOne({
        userId: req.body.userId,
        organizationId: req.user.organizationId,
        _id: { $ne: id },
      });

      if (duplicateStaff) {
        return res.status(409).json({
          success: false,
          message: "This user is already registered as staff",
        });
      }
    }

    // If employee ID is being changed
    if (req.body.employeeId) {
      const duplicateEmployee = await Staff.findOne({
        employeeId: req.body.employeeId,
        organizationId: req.user.organizationId,
        _id: { $ne: id },
      });

      if (duplicateEmployee) {
        return res.status(409).json({
          success: false,
          message: "Employee ID already exists",
        });
      }
    }

    const staff = await Staff.findOneAndUpdate(
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
      .populate("userId", "firstName lastName email status")
      .populate("createdBy", "firstName lastName email");

    res.status(200).json({
      success: true,
      message: "Staff updated successfully",
      data: staff,
    });
  } catch (error) {
    console.error("Update staff error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete Staff
export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate staff ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff ID",
      });
    }

    const staff = await Staff.findOneAndDelete({
      _id: id,
      organizationId: req.user.organizationId,
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Staff deleted successfully",
    });
  } catch (error) {
    console.error("Delete staff error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
