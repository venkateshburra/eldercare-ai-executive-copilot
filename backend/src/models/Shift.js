// src/models/Shift.js
import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
      // HH:MM 24-hour format
    },

    endTime: {
      type: String,
      required: true,
    },

    shiftType: {
      type: String,
      enum: ["morning", "afternoon", "evening", "night", "full_day", "on_call"],
      default: "morning",
    },

    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed", "missed", "cancelled"],
      default: "scheduled",
    },

    handoverNotes: {
      type: String,
      trim: true,
      default: "",
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

shiftSchema.index({ organizationId: 1, date: -1 });
shiftSchema.index({ organizationId: 1, staffId: 1, date: -1 });
shiftSchema.index({ organizationId: 1, status: 1 });

const Shift = mongoose.model("Shift", shiftSchema);

export default Shift;
