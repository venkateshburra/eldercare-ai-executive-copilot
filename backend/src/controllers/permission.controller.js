import mongoose from "mongoose";
import Permission from "../models/Permission.js";

// Create Permission
export const createPermission = async (req, res) => {
  try {
    const { name, description } = req.body;
    const organizationId = req.user.organizationId;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "name is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid organizationId",
      });
    }

    const existingPermission = await Permission.findOne({
      organizationId,
      name: name.trim(),
    });

    if (existingPermission) {
      return res.status(409).json({
        success: false,
        message: "Permission already exists in this organization",
      });
    }

    const permission = await Permission.create({
      organizationId,
      name: name.trim(),
      description,
    });

    return res.status(201).json({
      success: true,
      message: "Permission created successfully",
      data: permission,
    });
  } catch (error) {
    console.error("Create permission error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get All Permissions
export const getPermissions = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const permissions = await Permission.find({
      organizationId,
    });

    return res.status(200).json({
      success: true,
      message: "Permissions fetched successfully",
      data: permissions,
    });
  } catch (error) {
    console.error("Get permissions error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Permission By ID
export const getPermissionById = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid permission ID",
      });
    }

    const permission = await Permission.findOne({
      _id: id,
      organizationId,
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Permission fetched successfully",
      data: permission,
    });
  } catch (error) {
    console.error("Get permission error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update Permission
export const updatePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid permission ID",
      });
    }

    if (req.body.name) {
      const existingPermission = await Permission.findOne({
        organizationId,
        name: req.body.name.trim(),
        _id: { $ne: id },
      });

      if (existingPermission) {
        return res.status(409).json({
          success: false,
          message: "Permission name already exists",
        });
      }

      req.body.name = req.body.name.trim();
    }

    const permission = await Permission.findOneAndUpdate(
      {
        _id: id,
        organizationId,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Permission updated successfully",
      data: permission,
    });
  } catch (error) {
    console.error("Update permission error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete Permission
export const deletePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid permission ID",
      });
    }

    const permission = await Permission.findOneAndDelete({
      _id: id,
      organizationId,
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Permission deleted successfully",
    });
  } catch (error) {
    console.error("Delete permission error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
