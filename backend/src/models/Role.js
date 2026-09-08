import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    permissionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Permission",
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const Role = mongoose.model("Role", roleSchema);

export default Role;
