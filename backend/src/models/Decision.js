// src/models/Decision.js
import mongoose from "mongoose";

const decisionActionSchema = new mongoose.Schema(
  {
    actorId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action:        { type: String, required: true, enum: ["create", "update", "approve", "reject", "override", "defer", "close"] },
    timestamp:     { type: Date, default: Date.now },
    reason:        { type: String, trim: true, default: "" },
    previousValue: { type: mongoose.Schema.Types.Mixed, default: null },
    newValue:      { type: mongoose.Schema.Types.Mixed, default: null },
    outcome:       { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const decisionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    decisionType: {
      type: String,
      enum: [
        "staffing",
        "resident_care",
        "operations",
        "financial",
        "safety",
        "other",
      ],
      required: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "implemented", "deferred", "overridden"],
      default: "pending",
      index: true,
    },

    decisionDate: {
      type: Date,
    },

    rationale: {
      type: String,
      trim: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    outcome: {
      type: String,
      trim: true,
      default: "",
    },

    previousValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // Full action history
    actions: [decisionActionSchema],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

decisionSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
decisionSchema.index({ organizationId: 1, assignedTo: 1 });

const Decision = mongoose.model("Decision", decisionSchema);

export default Decision;
