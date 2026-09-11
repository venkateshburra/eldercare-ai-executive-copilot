// src/controllers/auth.controller.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import Organization from "../models/Organization.js";
import Role from "../models/Role.js";
import { createAuditLog } from "../services/audit.service.js";
import logger from "../utils/logger.js";
import { AppError, badRequest, conflict, forbidden, notFound, unauthorized } from "../utils/error.js";

// ── SIGNUP ────────────────────────────────────────────────────────────────────
export const signup = async (req, res, next) => {
  try {
    const { organizationId, firstName, lastName, email, password, roleId } = req.body;

    if (!organizationId || !firstName || !lastName || !email || !password || !roleId) {
      throw badRequest("organizationId, firstName, lastName, email, password and roleId are required");
    }

    if (!mongoose.Types.ObjectId.isValid(organizationId)) throw badRequest("Invalid organizationId");
    if (!mongoose.Types.ObjectId.isValid(roleId)) throw badRequest("Invalid roleId");

    const organization = await Organization.findById(organizationId);
    if (!organization) throw notFound("Organization");
    if (organization.status !== "active") throw forbidden("Organization is not active");

    const role = await Role.findById(roleId);
    if (!role) throw notFound("Role");
    if (role.organizationId.toString() !== organizationId.toString()) throw badRequest("Role does not belong to this organization");
    if (!role.isActive) throw forbidden("Role is inactive");

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) throw conflict("An account with this email already exists");

    if (password.length < 6) throw badRequest("Password must be at least 6 characters");

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      organizationId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      roleId,
    });

    await createAuditLog({
      organizationId,
      actorId: user._id,
      action: "signup",
      resourceType: "user",
      resourceId: user._id,
      metadata: { email: normalizedEmail, roleId },
      req,
    });

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.accessHistory;

    return res.status(201).json({
      success: true,
      message: "Signup successful",
      data: userResponse,
    });
  } catch (err) {
    next(err);
  }
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) throw badRequest("Email and password are required");

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail, deletedAt: null });

    if (!user) {
      // Don't reveal whether the email exists
      throw unauthorized("Invalid email or password");
    }

    if (user.status !== "active") throw forbidden("User account is inactive");

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      await createAuditLog({
        organizationId: user.organizationId,
        actorId: user._id,
        action: "login",
        resourceType: "user",
        resourceId: user._id,
        metadata: { email: normalizedEmail },
        outcome: "failure",
        req,
      });
      throw unauthorized("Invalid email or password");
    }

    const organization = await Organization.findById(user.organizationId);
    if (!organization) throw notFound("Organization");
    if (organization.status !== "active") throw forbidden("Organization is not active");

    const role = await Role.findById(user.roleId);
    if (!role) throw notFound("User role");
    if (!role.isActive) throw forbidden("User role is inactive");

    const token = jwt.sign(
      { userId: user._id, organizationId: user.organizationId, roleId: user.roleId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    // Update lastLogin + cap accessHistory at 20 entries
    const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
    const ua = req.headers["user-agent"] || "";
    const newAccessEvent = { action: "login", timestamp: new Date(), ipAddress: ip, userAgent: ua };

    await User.findByIdAndUpdate(user._id, {
      lastLogin: new Date(),
      $push: {
        accessHistory: {
          $each: [newAccessEvent],
          $slice: -20,
        },
      },
    });

    await createAuditLog({
      organizationId: user.organizationId,
      actorId: user._id,
      action: "login",
      resourceType: "user",
      resourceId: user._id,
      metadata: { email: normalizedEmail, roleName: role.name },
      req,
    });

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.accessHistory;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: {
        user: userResponse,
        role: { id: role._id, name: role.name, description: role.description },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET ME ────────────────────────────────────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password -accessHistory")
      .populate("roleId", "name description");

    if (!user) throw notFound("User");

    return res.status(200).json({
      success: true,
      message: "Current user fetched",
      data: user,
    });
  } catch (err) {
    next(err);
  }
};
