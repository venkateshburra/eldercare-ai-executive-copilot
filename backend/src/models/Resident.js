import mongoose from "mongoose";

const residentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    dateOfBirth: {
      type: Date,
      required: true,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    roomNumber: {
      type: String,
      trim: true,
    },

    admissionDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "discharged"],
      default: "active",
    },

    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Resident = mongoose.model("Resident", residentSchema);

export default Resident;