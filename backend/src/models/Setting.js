// src/models/Setting.js
import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      unique: true,
      index: true,
    },

    aiSettings: {
      confidenceThreshold: { type: Number, default: 0.7, min: 0, max: 1 },
      strictCitations: { type: Boolean, default: true },
      autoApproveLowRisk: { type: Boolean, default: false },
      modelName: { type: String, default: "gemini-3.6-flash" },
      maxTokensPerQuery: { type: Number, default: 2048 },
    },

    alertThresholds: {
      fallIncidentWarning: { type: Number, default: 3 },
      medicationMissRateMaxPercent: { type: Number, default: 5 },
      minCaregiverRatio: { type: Number, default: 0.2 }, // e.g. 1 caregiver per 5 residents
      slaResponseTimeMinutes: { type: Number, default: 15 },
    },

    notificationRules: {
      notifyOnCriticalIncident: { type: Boolean, default: true },
      notifyOnPendingAIApproval: { type: Boolean, default: true },
      notifyOnMissedMedication: { type: Boolean, default: true },
      dailyDigestEnabled: { type: Boolean, default: true },
    },

    workflowRules: {
      dualApprovalForHighImpact: { type: Boolean, default: true },
      requireOverrideReason: { type: Boolean, default: true },
      lockClosedIncidents: { type: Boolean, default: true },
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Setting = mongoose.model("Setting", settingSchema);

export default Setting;
