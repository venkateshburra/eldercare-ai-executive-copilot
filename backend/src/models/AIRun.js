// src/models/AIRun.js
import mongoose from "mongoose";

const aiRunSchema = new mongoose.Schema(
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
    },

    feature: {
      type: String,
      required: true,
      enum: [
        "general",
        "analytics",
        "query",
        "risk_analysis",
        "scenario",
        "forecast",
        "rag",
        "briefing",
        "evidence",
        "chat",
      ],
      index: true,
    },

    // Serialised prompt sent to Gemini
    prompt: {
      type: String,
      default: "",
    },

    // Structured input captured before AI call
    input: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Raw or parsed AI output
    output: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },

    model: {
      type: String,
      default: "gemini-3.6-flash",
    },

    // Sources/citations used (for RAG)
    sources: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    status: {
      type: String,
      enum: ["success", "failed", "pending_review"],
      default: "success",
    },

    errorMessage: {
      type: String,
      default: null,
    },

    latencyMs: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

aiRunSchema.index({ organizationId: 1, createdAt: -1 });
aiRunSchema.index({ organizationId: 1, userId: 1, createdAt: -1 });
aiRunSchema.index({ organizationId: 1, feature: 1, createdAt: -1 });

const AIRun = mongoose.model("AIRun", aiRunSchema);

export default AIRun;
