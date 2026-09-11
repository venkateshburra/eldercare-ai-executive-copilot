import mongoose from "mongoose";

const aiChunkSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIDocument",
      required: true,
      index: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    chunkIndex: {
      type: Number,
      required: true,
      min: 0,
    },

    metadata: {
      type: Object,
      default: {},
    },

    embedding: {
      type: [Number],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

aiChunkSchema.index({
  organizationId: 1,
  documentId: 1,
  chunkIndex: 1,
});

const AIChunk =
  mongoose.models.AIChunk || mongoose.model("AIChunk", aiChunkSchema);

export default AIChunk;
