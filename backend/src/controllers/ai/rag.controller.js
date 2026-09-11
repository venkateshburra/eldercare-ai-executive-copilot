// src/controllers/ai/rag.controller.js
import { executeRAG } from "../../services/ai/rag.service.js";
import { recordAIRun } from "../../services/ai/aiRun.service.js";
import { createAuditLog } from "../../services/audit.service.js";
import { GEMINI_MODEL } from "../../services/ai/gemini.service.js";
import logger from "../../utils/logger.js";

export const handleRAG = async (req, res, next) => {
  try {
    const { question, topK, minSimilarity } = req.body;
    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ success: false, message: "question is required", code: "BAD_REQUEST" });
    }

    const t0 = Date.now();
    const result = await executeRAG(req.user.organizationId, question.trim(), {
      topK: topK ? Number(topK) : 5,
      minSimilarity: minSimilarity ? Number(minSimilarity) : 0.55,
    });
    const latencyMs = Date.now() - t0;

    await recordAIRun({
      organizationId: req.user.organizationId,
      userId: req.user._id,
      feature: "rag",
      input: { question: question.trim() },
      output: { answer: result.answer, confidence: result.confidence, limitations: result.limitations },
      confidence: result.confidence,
      sources: result.sources,
      status: result.isInsufficient ? "success" : "success",
      latencyMs,
    });

    await createAuditLog({
      organizationId: req.user.organizationId,
      actorId: req.user._id,
      action: "ai_execution",
      resourceType: "ai_rag",
      metadata: { question: question.trim(), sourcesCount: result.sources.length, confidence: result.confidence },
      req,
    });

    return res.status(200).json({
      success: true,
      data: { ...result, timestamp: new Date().toISOString(), model: GEMINI_MODEL },
    });
  } catch (err) {
    logger.error("RAG controller error:", err.message);
    next(err);
  }
};
