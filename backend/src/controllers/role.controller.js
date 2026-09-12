import mongoose from "mongoose";
import Role from "../models/Role.js";
import Permission from "../models/Permission.js";

// Create Role
export const createRole = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Role name is required",
      });
    }

    const existingRole = await Role.findOne({
      organizationId,
      name: name.trim(),
    });

    if (existingRole) {
      return res.status(409).json({
        success: false,
        message: "Role already exists in this organization",
      });
    }

    const role = await Role.create({
      organizationId,
      name: name.trim(),
      description,
    });

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: role,
    });
  } catch (error) {
    console.error("Create role error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// Get All Roles
export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find({ organizationId: req.user.organizationId }).populate(
      "permissionIds",
      "name description"
    );

    res.status(200).json({
      success: true,
      message: "Roles fetched successfully",
      data: roles,
    });
  } catch (error) {
    console.error("Get roles error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// Get Role By ID
export const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role ID",
      });
    }

    const role = await Role.findOne({ _id: id, organizationId: req.user.organizationId });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Role fetched successfully",
      data: role,
    });
  } catch (error) {
    console.error("Get role error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// Update Role
export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role ID",
      });
    }

    if (req.body.organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId cannot be changed",
      });
    }

    const { name, description } = req.body;

    if (name) {
      const existingRole = await Role.findOne({
        organizationId: req.user.organizationId,
        name: name.trim(),
        _id: { $ne: id },
      });

      if (existingRole) {
        return res.status(409).json({
          success: false,
          message: "Role name already exists",
        });
      }
    }

    const role = await Role.findOneAndUpdate(
      { _id: id, organizationId: req.user.organizationId },
      { ...(name && { name: name.trim() }), ...(description !== undefined && { description }) },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: role,
    });
  } catch (error) {
    console.error("Update role error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Assign Permissions to Role
export const updateRolePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissionIds } = req.body;

    // Validate role ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role ID",
      });
    }

    // Validate permissionIds
    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({
        success: false,
        message: "permissionIds must be an array",
      });
    }

    // Check duplicate permission IDs
    const uniquePermissionIds = [...new Set(permissionIds)];

    if (uniquePermissionIds.length !== permissionIds.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate permission IDs are not allowed",
      });
    }

    // Validate every permission ID
    for (const permissionId of permissionIds) {
      if (!mongoose.Types.ObjectId.isValid(permissionId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid permission ID: ${permissionId}`,
        });
      }
    }

    // Find role
    const role = await Role.findOne({ _id: id, organizationId: req.user.organizationId });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // Find permissions
    const permissions = await Permission.find({
      _id: { $in: permissionIds },
    });

    // Check all permissions exist
    if (permissions.length !== permissionIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more permissions not found",
      });
    }

    // Check organization and active status
    for (const permission of permissions) {
      if (
        permission.organizationId.toString() !==
        role.organizationId.toString()
      ) {
        return res.status(400).json({
          success: false,
          message: `Permission ${permission.name} does not belong to this organization`,
        });
      }

      if (!permission.isActive) {
        return res.status(400).json({
          success: false,
          message: `Permission ${permission.name} is inactive`,
        });
      }
    }

    // Update role permissions
    role.permissionIds = permissionIds;

    await role.save();

    // Populate permissions in response
    await role.populate("permissionIds");

    res.status(200).json({
      success: true,
      message: "Role permissions updated successfully",
      data: role,
    });
  } catch (error) {
    console.error("Update role permissions error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// Delete Role
export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role ID",
      });
    }

    const role = await Role.findOneAndDelete({ _id: id, organizationId: req.user.organizationId });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    console.error("Delete role error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};