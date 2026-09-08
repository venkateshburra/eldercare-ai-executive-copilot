import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import Organization from "../models/Organization.js";
import Role from "../models/Role.js";

// SIGNUP
export const signup = async (req, res) => {
  try {
    const { organizationId, firstName, lastName, email, password, roleId } =
      req.body;

    // 1. Required fields
    if (
      !organizationId ||
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !roleId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "organizationId, firstName, lastName, email, password and roleId are required",
      });
    }

    // 2. Validate organization ID
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid organizationId",
      });
    }

    // 3. Validate role ID
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid roleId",
      });
    }

    // 4. Check organization
    const organization = await Organization.findById(organizationId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    // 5. Check organization status
    if (organization.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Organization is not active",
      });
    }

    // 6. Check role
    const role = await Role.findById(roleId);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // 7. Check role belongs to organization
    if (role.organizationId.toString() !== organizationId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Role does not belong to this organization",
      });
    }

    // 8. Check role status
    if (!role.isActive) {
      return res.status(403).json({
        success: false,
        message: "Role is inactive",
      });
    }

    // 9. Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // 10. Check existing user
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // 11. Validate password
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // 12. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 13. Create user
    const user = await User.create({
      organizationId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      roleId,
    });

    // 14. Remove password
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(201).json({
      success: true,
      message: "Signup successful",
      data: userResponse,
    });
  } catch (error) {
    console.error("Signup error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 2. Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // 3. Find user
    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 4. Check user status
    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "User account is inactive",
      });
    }

    // 5. Check password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 6. Check organization
    const organization = await Organization.findById(user.organizationId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    // 7. Check organization status
    if (organization.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Organization is not active",
      });
    }

    // 8. Check role
    const role = await Role.findById(user.roleId);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "User role not found",
      });
    }

    // 9. Check role status
    if (!role.isActive) {
      return res.status(403).json({
        success: false,
        message: "User role is inactive",
      });
    }

    // 10. Create JWT
    const token = jwt.sign(
      {
        userId: user._id,
        organizationId: user.organizationId,
        roleId: user.roleId,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    // 11. User response
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: {
        user: userResponse,
        role: {
          id: role._id,
          name: role.name,
          description: role.description,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
