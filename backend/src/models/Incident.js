import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      required: true,
    },

    type: {
      type: String,
      required: true,
      trim: true,
    },

    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    incidentDate: {
      type: Date,
      required: true,
    },

    location: {
      type: String,
      trim: true,
    },

    actionTaken: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["open", "investigating", "resolved"],
      default: "open",
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

const Incident = mongoose.model("Incident", incidentSchema);

export default Incident;