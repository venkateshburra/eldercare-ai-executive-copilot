import AIDocument from "../../models/AIDocument.js";
import AIChunk from "../../models/AIChunk.js";
import { generateEmbedding } from "./gemini.service.js";

const CHUNK_SIZE = 300;

const splitIntoChunks = (text) => {
  const words = text.trim().split(/\s+/);

  const chunks = [];

  for (let i = 0; i < words.length; i += CHUNK_SIZE) {
    const chunk = words.slice(i, i + CHUNK_SIZE).join(" ");

    if (chunk.trim()) {
      chunks.push(chunk.trim());
    }
  }

  return chunks;
};

export const createDocumentChunks = async (organizationId, documentId) => {
  const document = await AIDocument.findOne({
    _id: documentId,
    organizationId,
    status: "active",
  }).lean();

  if (!document) {
    throw new Error("Document not found");
  }

  const existingChunks = await AIChunk.countDocuments({
    documentId,
    organizationId,
  });

  if (existingChunks > 0) {
    throw new Error("Chunks already exist for this document");
  }

  const chunks = splitIntoChunks(document.content);

  if (!chunks.length) {
    throw new Error("Document does not contain valid content");
  }

  const chunkDocuments = chunks.map((content, index) => ({
    organizationId,
    documentId,
    content,
    chunkIndex: index,
    metadata: {
      documentTitle: document.title,
      sourceType: document.sourceType,
    },
  }));

  const createdChunks = await AIChunk.insertMany(chunkDocuments);

  return createdChunks;
};

export const getDocumentChunks = async (organizationId, documentId) => {
  const document = await AIDocument.findOne({
    _id: documentId,
    organizationId,
  }).lean();

  if (!document) {
    throw new Error("Document not found");
  }

  const chunks = await AIChunk.find({
    organizationId,
    documentId,
  })
    .sort({ chunkIndex: 1 })
    .lean();

  return chunks;
};

export const generateDocumentChunkEmbeddings = async (
  organizationId,
  documentId,
) => {
  const chunks = await AIChunk.find({
    organizationId,
    documentId,
  });

  if (!chunks.length) {
    throw new Error("No chunks found for this document");
  }

  let updatedCount = 0;

  for (const chunk of chunks) {
    if (chunk.embedding && chunk.embedding.length > 0) {
      continue;
    }

    const embedding = await generateEmbedding(chunk.content);

    chunk.embedding = embedding;

    await chunk.save();

    updatedCount++;
  }

  return {
    totalChunks: chunks.length,
    embeddedChunks: updatedCount,
  };
};
