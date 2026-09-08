import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema(
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

    name: {
      type: String,
      required: true,
      trim: true,
    },

    dosage: {
      type: String,
      required: true,
      trim: true,
    },

    frequency: {
      type: String,
      required: true,
      trim: true,
    },

    route: {
      type: String,
      trim: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
    },

    prescribedBy: {
      type: String,
      trim: true,
    },

    instructions: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["active", "completed", "discontinued"],
      default: "active",
    },

    notes: {
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

const Medication = mongoose.model("Medication", medicationSchema);

export default Medication;
