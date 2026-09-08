import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required",
      });
    }

    // Expected format:
    // Bearer TOKEN
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format",
      });
    }

    const token = parts[1];

    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Find user
    const user = await User.findById(decoded.userId)
      .select("-password")
      .populate("roleId");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    // Check user status
    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "User account is inactive",
      });
    }

    // Attach user to request
    req.user = user;

    // Also keep important JWT information
    req.organizationId = decoded.organizationId;
    req.roleId = decoded.roleId;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};