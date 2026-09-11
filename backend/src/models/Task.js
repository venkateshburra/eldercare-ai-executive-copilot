// src/models/Task.js
import mongoose from "mongoose";

const taskActionSchema = new mongoose.Schema(
  {
    actorId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action:        { type: String, required: true },
    timestamp:     { type: Date, default: Date.now },
    reason:        { type: String, trim: true, default: "" },
    previousValue: { type: mongoose.Schema.Types.Mixed, default: null },
    newValue:      { type: mongoose.Schema.Types.Mixed, default: null },
    outcome:       { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
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
      trim: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["open", "in_progress", "pending_review", "completed", "cancelled", "deferred"],
      default: "open",
      index: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    dueDate: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    relatedResourceType: { type: String, default: null },
    relatedResourceId:   { type: mongoose.Schema.Types.ObjectId, default: null },

    // Action history
    actions: [taskActionSchema],
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ organizationId: 1, assignedTo: 1, status: 1 });
taskSchema.index({ organizationId: 1, createdAt: -1 });

const Task = mongoose.model("Task", taskSchema);

export default Task;
