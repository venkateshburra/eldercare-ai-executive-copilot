// src/models/Scenario.js
import mongoose from "mongoose";

const assumptionSchema = new mongoose.Schema(
  {
    key:   { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    unit:  { type: String, default: "" },
    label: { type: String, default: "" },
  },
  { _id: false }
);

const scenarioSchema = new mongoose.Schema(
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

    description: {
      type: String,
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "caregiver_scheduling",
        "resident_placement",
        "care_plan_intensity",
        "procurement",
        "family_communication",
        "capacity_expansion",
        "custom",
      ],
      default: "custom",
    },

    // base / upside / downside / custom
    type: {
      type: String,
      enum: ["base", "upside", "downside", "custom"],
      default: "base",
    },

    assumptions: [assumptionSchema],

    // AI-generated result (Mixed — can be any JSON)
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
    },

    // Points to latest ScenarioVersion
    latestVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScenarioVersion",
      default: null,
    },

    aiRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIRun",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

scenarioSchema.index({ organizationId: 1, createdAt: -1 });

const Scenario = mongoose.model("Scenario", scenarioSchema);

export default Scenario;
