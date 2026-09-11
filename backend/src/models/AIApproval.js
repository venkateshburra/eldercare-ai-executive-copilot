// src/models/AIApproval.js
import mongoose from "mongoose";

const aiApprovalSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    aiRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIRun",
      required: true,
      index: true,
    },

    // The user who must/did review this output
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "overridden"],
      default: "pending",
      index: true,
    },

    comment: {
      type: String,
      trim: true,
      default: "",
    },

    // Required when status is "rejected" or "overridden"
    overrideReason: {
      type: String,
      trim: true,
      default: "",
    },

    // The original AI output (snapshot at review time)
    originalOutput: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // The final output after override (null if approved as-is)
    finalOutput: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

aiApprovalSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
aiApprovalSchema.index({ organizationId: 1, reviewerId: 1, createdAt: -1 });

const AIApproval = mongoose.model("AIApproval", aiApprovalSchema);

export default AIApproval;
