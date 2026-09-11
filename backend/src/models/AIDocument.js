// src/models/AIDocument.js
import mongoose from "mongoose";

const aiDocumentSchema = new mongoose.Schema(
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
      default: "",
      trim: true,
    },

    content: {
      type: String,
      required: true,
    },

    sourceType: {
      type: String,
      enum: [
        "policy",
        "procedure",
        "guideline",
        "report",
        "admission_form",
        "care_assessment",
        "consent_form",
        "medication_chart",
        "incident_report",
        "invoice",
        "other",
      ],
      default: "other",
    },

    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },

    // Optional: checksum for deduplication
    checksum: {
      type: String,
      default: null,
    },

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

aiDocumentSchema.index({ organizationId: 1, sourceType: 1 });
aiDocumentSchema.index({ organizationId: 1, status: 1 });
aiDocumentSchema.index({ organizationId: 1, createdAt: -1 });

const AIDocument =
  mongoose.models.AIDocument || mongoose.model("AIDocument", aiDocumentSchema);

export default AIDocument;
