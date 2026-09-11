// src/models/User.js
import mongoose from "mongoose";

const accessHistorySchema = new mongoose.Schema(
  {
    action:    { type: String },
    timestamp: { type: Date, default: Date.now },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    // ── New fields ────────────────────────────────────────────────────────────
    lastLogin: {
      type: Date,
      default: null,
    },

    mfaEnabled: {
      type: Boolean,
      default: false,
    },

    // Soft deletion
    deletedAt: {
      type: Date,
      default: null,
    },

    // Last 20 access events (capped to avoid unbounded growth)
    accessHistory: {
      type: [accessHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ organizationId: 1, status: 1 });
userSchema.index({ organizationId: 1, roleId: 1 });

const User = mongoose.model("User", userSchema);

export default User;
