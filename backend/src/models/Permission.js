import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
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

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Permission = mongoose.model("Permission", permissionSchema);

export default Permission;