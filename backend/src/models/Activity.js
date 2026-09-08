import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
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

    type: {
      type: String,
      enum: ["exercise", "therapy", "recreation", "social", "medical", "other"],
      default: "other",
    },

    description: {
      type: String,
      trim: true,
    },

    scheduledDate: {
      type: Date,
      required: true,
    },

    duration: {
      type: Number,
      min: 0,
    },

    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
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

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;
