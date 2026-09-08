import mongoose from "mongoose";

const decisionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
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
      enum: ["pending", "approved", "rejected", "implemented"],
      default: "pending",
    },

    decisionDate: {
      type: Date,
    },

    rationale: {
      type: String,
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Decision = mongoose.model("Decision", decisionSchema);

export default Decision;
