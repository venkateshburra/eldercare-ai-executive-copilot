import {
  createDocumentChunks,
  generateDocumentChunkEmbeddings,
  getDocumentChunks,
} from "../../services/ai/chunk.service.js";

export const createChunks = async (req, res) => {
  try {
    const { documentId } = req.params;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "documentId is required",
      });
    }

    const organizationId = req.user.organizationId;

    const chunks = await createDocumentChunks(organizationId, documentId);

    return res.status(201).json({
      success: true,
      message: "Document chunks created successfully",
      data: {
        documentId,
        count: chunks.length,
        chunks,
      },
    });
  } catch (error) {
    console.error("Create document chunks error:", error);

    return res.status(400).json({
      success: false,
      message: error?.message ?? "Failed to create document chunks",
    });
  }
};

export const getChunks = async (req, res) => {
  try {
    const { documentId } = req.params;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "documentId is required",
      });
    }

    const organizationId = req.user.organizationId;

    const chunks = await getDocumentChunks(organizationId, documentId);

    return res.status(200).json({
      success: true,
      message: "Document chunks retrieved successfully",
      data: {
        documentId,
        count: chunks.length,
        chunks,
      },
    });
  } catch (error) {
    console.error("Get document chunks error:", error);

    return res.status(400).json({
      success: false,
      message: error?.message ?? "Failed to retrieve document chunks",
    });
  }
};

export const generateEmbeddings = async (req, res) => {
  try {
    const { documentId } = req.params;

    const result = await generateDocumentChunkEmbeddings(
      req.user.organizationId,
      documentId,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Generate embeddings error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
