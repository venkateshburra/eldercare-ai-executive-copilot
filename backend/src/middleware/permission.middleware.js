import Role from "../models/Role.js";
import Permission from "../models/Permission.js";

export const authorize = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // User must already be authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // Get user's role
      const role = await Role.findOne({
        _id: req.user.roleId,
        organizationId: req.user.organizationId,
        isActive: true,
      });

      if (!role) {
        return res.status(403).json({
          success: false,
          message: "User role not found or inactive",
        });
      }

      // Check whether role has required permission
      const permission = await Permission.findOne({
        _id: { $in: role.permissionIds },
        name: requiredPermission,
        organizationId: req.user.organizationId,
        isActive: true,
      });

      if (!permission) {
        return res.status(403).json({
          success: false,
          message: `Permission denied: ${requiredPermission}`,
        });
      }

      // Permission exists
      req.permission = permission;

      next();
    } catch (error) {
      console.error("Permission middleware error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
};