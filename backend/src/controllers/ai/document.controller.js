// src/controllers/ai/document.controller.js
import mongoose from "mongoose";
import AIDocument from "../../models/AIDocument.js";
import AIChunk from "../../models/AIChunk.js";
import { generateEmbedding } from "../../services/ai/gemini.service.js";
import { createAuditLog } from "../../services/audit.service.js";
import logger from "../../utils/logger.js";

// Helper: split text into overlapping chunks
const chunkText = (text, chunkSize = 500, overlap = 80) => {
  const chunks = [];
  let start = 0;
  const clean = text.replace(/\r\n/g, "\n");

  while (start < clean.length) {
    let end = start + chunkSize;
    if (end < clean.length) {
      // Try to break at a newline or sentence boundary
      const lastNewline = clean.lastIndexOf("\n", end);
      const lastPeriod = clean.lastIndexOf(". ", end);
      const boundary = Math.max(lastNewline, lastPeriod);
      if (boundary > start + chunkSize / 2) {
        end = boundary + 1;
      }
    } else {
      end = clean.length;
    }

    const slice = clean.slice(start, end).trim();
    if (slice) chunks.push(slice);
    start = end - overlap;
    if (start >= clean.length || end === clean.length) break;
  }

  return chunks.length ? chunks : [clean];
};

export const createAIDocument = async (req, res) => {
  try {
    const { title, description, content, sourceType } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "title is required" });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "content is required" });
    }

    const organizationId = req.user.organizationId;

    const document = await AIDocument.create({
      organizationId,
      title: title.trim(),
      description: description?.trim() || "",
      content: content.trim(),
      sourceType: sourceType || "other",
      createdBy: req.user._id,
    });

    // Automatically chunk and compute embeddings
    const textChunks = chunkText(content.trim());
    const chunkDocs = [];

    for (let i = 0; i < textChunks.length; i++) {
      let embedding = [];
      try {
        embedding = await generateEmbedding(textChunks[i]);
      } catch (embErr) {
        logger.warn(`Could not generate embedding for chunk ${i}:`, embErr.message);
      }

      chunkDocs.push({
        organizationId,
        documentId: document._id,
        chunkIndex: i,
        content: textChunks[i],
        embedding,
        metadata: {
          title: document.title,
          sourceType: document.sourceType,
        },
      });
    }

    if (chunkDocs.length) {
      await AIChunk.insertMany(chunkDocs);
    }

    await createAuditLog({
      organizationId,
      actorId: req.user._id,
      action: "create",
      resourceType: "ai_document",
      resourceId: document._id,
      metadata: { title, chunksCount: chunkDocs.length },
      req,
    });

    return res.status(201).json({
      success: true,
      message: "AI document created and indexed successfully",
      data: {
        ...document.toObject(),
        chunksIndexed: chunkDocs.length,
      },
    });
  } catch (error) {
    logger.error("Create AI document error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create AI document",
      error: error?.message ?? "Internal server error",
    });
  }
};

export const getAIDocuments = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { sourceType, search } = req.query;

    const filter = { organizationId, status: "active" };
    if (sourceType) filter.sourceType = sourceType;
    if (search) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const documents = await AIDocument.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Get chunk count for each document
    const docIds = documents.map(d => d._id);
    const chunkCounts = await AIChunk.aggregate([
      { $match: { documentId: { $in: docIds } } },
      { $group: { _id: "$documentId", count: { $sum: 1 } } },
    ]);

    const countMap = {};
    chunkCounts.forEach(c => { countMap[c._id.toString()] = c.count; });

    const results = documents.map(d => ({
      ...d,
      chunksCount: countMap[d._id.toString()] || 0,
    }));

    return res.status(200).json({
      success: true,
      message: "AI documents retrieved successfully",
      data: results,
    });
  } catch (error) {
    logger.error("Get AI documents error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve AI documents",
      error: error?.message ?? "Internal server error",
    });
  }
};

export const getAIDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const document = await AIDocument.findOne({ _id: id, organizationId });
    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const chunks = await AIChunk.find({ documentId: id, organizationId })
      .select("-embedding")
      .sort({ chunkIndex: 1 });

    return res.status(200).json({
      success: true,
      data: {
        ...document.toObject(),
        chunks,
      },
    });
  } catch (error) {
    logger.error("Get AI document by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve AI document",
      error: error?.message ?? "Internal server error",
    });
  }
};

export const deleteAIDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const document = await AIDocument.findOneAndDelete({ _id: id, organizationId });
    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    await AIChunk.deleteMany({ documentId: id, organizationId });

    await createAuditLog({
      organizationId,
      actorId: req.user._id,
      action: "delete",
      resourceType: "ai_document",
      resourceId: id,
      req,
    });

    return res.status(200).json({
      success: true,
      message: "AI document and its vector chunks deleted successfully",
    });
  } catch (error) {
    logger.error("Delete AI document error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete AI document",
      error: error?.message ?? "Internal server error",
    });
  }
};
