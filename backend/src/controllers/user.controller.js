import mongoose from "mongoose";
import User from "../models/User.js";
import Role from "../models/Role.js";
import bcrypt from "bcryptjs";

// Create User
export const createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      roleId,
    } = req.body;

    // Organization comes from authenticated user
    const organizationId = req.user.organizationId;

    // Required field validation
    if (!firstName || !lastName || !email || !password || !roleId) {
      return res.status(400).json({
        success: false,
        message:
          "firstName, lastName, email, password and roleId are required",
      });
    }

    // Validate role ID
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid roleId",
      });
    }

    // Check whether role exists in the same organization
    const role = await Role.findOne({
      _id: roleId,
      organizationId,
      isActive: true,
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found or inactive",
      });
    }

    // Check duplicate email
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user inside logged-in user's organization
    const user = await User.create({
      organizationId,
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      roleId,
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: userResponse,
    });
  } catch (error) {
    console.error("Create user error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get All Users
export const getUsers = async (req, res) => {
  try {
    const { organizationId, all } = req.query;
    let query = { organizationId: req.user.organizationId };

    if (all === "true") {
      query = {};
    } else if (organizationId) {
      query = { organizationId };
    }

    const users = await User.find(query)
      .select("-password")
      .populate("roleId", "name description")
      .populate("organizationId", "name slug");

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get User By ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findOne({
      _id: id,
      organizationId: req.user.organizationId,
    })
      .select("-password")
      .populate("roleId", "name description");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    console.error("Get user error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update User
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Find existing user
    const existingUser = await User.findOne({
      _id: id,
      organizationId: req.user.organizationId,
    });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Don't allow organization to be changed here
    if (req.body.organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId cannot be changed",
      });
    }

    // If role is being updated
    if (req.body.roleId) {
      if (!mongoose.Types.ObjectId.isValid(req.body.roleId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid roleId",
        });
      }

      const role = await Role.findById(req.body.roleId);

      if (!role) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }

      // Role must belong to user's organization
      if (
        role.organizationId.toString() !==
        existingUser.organizationId.toString()
      ) {
        return res.status(400).json({
          success: false,
          message: "Role does not belong to this organization",
        });
      }
    }

    // If email is being updated
    if (req.body.email) {
      const email = req.body.email.toLowerCase();

      const duplicateEmail = await User.findOne({
        email,
        _id: { $ne: id },
      });

      if (duplicateEmail) {
        return res.status(409).json({
          success: false,
          message: "An account with this email already exists",
        });
      }

      req.body.email = email;
    }

    const user = await User.findOneAndUpdate(
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
      .select("-password")
      .populate("roleId", "name description");

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Update user error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete User
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findOneAndDelete({
      _id: id,
      organizationId: req.user.organizationId,
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
