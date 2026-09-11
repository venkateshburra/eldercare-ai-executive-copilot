// src/models/AuditLog.js
import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for system events
    },

    action: {
      type: String,
      required: true,
      enum: [
        "login",
        "logout",
        "signup",
        "data_access",
        "create",
        "update",
        "delete",
        "export",
        "ai_execution",
        "ai_approval",
        "ai_rejection",
        "ai_override",
        "permission_change",
        "role_change",
        "config_change",
        "password_change",
        "status_change",
      ],
      index: true,
    },

    resourceType: {
      type: String,
      required: true,
      // e.g. "user", "resident", "carePlan", "medication", "aiRun", etc.
    },

    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    ipAddress: {
      type: String,
      trim: true,
    },

    userAgent: {
      type: String,
      trim: true,
    },

    outcome: {
      type: String,
      enum: ["success", "failure"],
      default: "success",
    },
  },
  {
    timestamps: true,
    // Prevent any updates — enforce append-only at model level
    strict: true,
  }
);

// Composite indexes for common filter patterns
auditLogSchema.index({ organizationId: 1, createdAt: -1 });
auditLogSchema.index({ organizationId: 1, action: 1, createdAt: -1 });
auditLogSchema.index({ organizationId: 1, actorId: 1, createdAt: -1 });
auditLogSchema.index({ organizationId: 1, resourceType: 1, resourceId: 1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
