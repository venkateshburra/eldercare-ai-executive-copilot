// src/models/ScenarioVersion.js
import mongoose from "mongoose";

const scenarioVersionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    scenarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scenario",
      required: true,
      index: true,
    },

    versionNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assumptions: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },

    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

scenarioVersionSchema.index({ organizationId: 1, scenarioId: 1, versionNumber: 1 });

const ScenarioVersion = mongoose.model("ScenarioVersion", scenarioVersionSchema);

export default ScenarioVersion;
