import mongoose from "mongoose";

const carePlanSchema = new mongoose.Schema(
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

    goals: [
      {
        type: String,
        trim: true,
      },
    ],

    startDate: {
      type: Date,
      required: true,
    },

    reviewDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
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

const CarePlan = mongoose.model("CarePlan", carePlanSchema);

export default CarePlan;
