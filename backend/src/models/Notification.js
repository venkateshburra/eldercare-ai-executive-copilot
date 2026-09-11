// src/models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "assignment",
        "exception",
        "approval_required",
        "approved",
        "rejected",
        "overridden",
        "alert",
        "due_date",
        "ai_result",
        "system",
        "info",
      ],
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Link back to the triggering resource
    relatedResourceType: { type: String, default: null },
    relatedResourceId:   { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ organizationId: 1, userId: 1, createdAt: -1 });
notificationSchema.index({ organizationId: 1, userId: 1, isRead: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
