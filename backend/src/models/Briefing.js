// src/models/Briefing.js
import mongoose from "mongoose";

const briefingSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    // AI-generated briefing content (structured JSON stored as Mixed)
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    type: {
      type: String,
      enum: ["executive", "operational", "risk", "custom"],
      default: "executive",
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
    },

    // Reference to the AIRun that produced this briefing
    aiRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIRun",
      default: null,
    },

    periodStart: { type: Date, default: null },
    periodEnd:   { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

briefingSchema.index({ organizationId: 1, createdAt: -1 });
briefingSchema.index({ organizationId: 1, type: 1, createdAt: -1 });

const Briefing = mongoose.model("Briefing", briefingSchema);

export default Briefing;
