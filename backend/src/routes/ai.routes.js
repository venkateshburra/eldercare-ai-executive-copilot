import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/permission.middleware.js";

// Existing AI controllers
import { askAI } from "../controllers/ai/ai.controller.js";
import { analyzeRisks } from "../controllers/ai/riskAnalysis.controller.js";
import { getExecutiveBriefing } from "../controllers/ai/briefing.controller.js";
import { askAnalytics } from "../controllers/ai/analytics.controller.js";
import { runAIQuery } from "../controllers/ai/query.controller.js";
import { analyzeScenario } from "../controllers/ai/scenario.controller.js";
import { generateForecast } from "../controllers/ai/forecast.controller.js";
import { getEvidence } from "../controllers/ai/evidence.controller.js";
import { createAIDocument, getAIDocuments, getAIDocumentById, deleteAIDocument } from "../controllers/ai/document.controller.js";
import { createChunks, generateEmbeddings, getChunks } from "../controllers/ai/chunk.controller.js";

// New AI controllers
import { handleChat } from "../controllers/ai/chat.controller.js";
import { handleRAG } from "../controllers/ai/rag.controller.js";
import {
  getAIRuns,
  getAIRunById,
  getAIApprovals,
  getAIApprovalById,
  reviewAIApproval,
} from "../controllers/ai/aiHistory.controller.js";

const router = express.Router();

// ── Unified Chat Orchestrator ───────────────────────────────────────────────────
router.post("/chat",        protect, authorize("ai.use"), handleChat);

// ── RAG ────────────────────────────────────────────────────────────────────────
router.post("/rag",         protect, authorize("ai.use"), handleRAG);

// ── Existing Specialized AI ────────────────────────────────────────────────────
router.post("/ask",         protect, authorize("ai.use"), askAI);
router.post("/risk-analysis", protect, authorize("ai.use"), analyzeRisks);
router.get("/briefing",     protect, authorize("ai.use"), getExecutiveBriefing);
router.post("/analytics",   protect, authorize("ai.use"), askAnalytics);
router.post("/query",       protect, authorize("ai.use"), runAIQuery);
router.post("/scenario",    protect, authorize("ai.use"), analyzeScenario);
router.post("/forecast",    protect, authorize("ai.use"), generateForecast);
router.post("/evidence",    protect, authorize("ai.use"), getEvidence);

// ── Documents & Chunks ─────────────────────────────────────────────────────────
router.post("/documents",       protect, authorize("ai.use"), createAIDocument);
router.get("/documents",        protect, authorize("ai.use"), getAIDocuments);
router.get("/documents/:id",    protect, authorize("ai.use"), getAIDocumentById);
router.delete("/documents/:id", protect, authorize("ai.use"), deleteAIDocument);
router.post("/documents/:documentId/chunks",    protect, authorize("ai.use"), createChunks);
router.get("/documents/:documentId/chunks",     protect, authorize("ai.use"), getChunks);
router.post("/documents/:documentId/embeddings", protect, authorize("ai.use"), generateEmbeddings);

// ── AI Run History ─────────────────────────────────────────────────────────────
router.get("/runs",         protect, authorize("ai.use"),    getAIRuns);
router.get("/runs/:id",     protect, authorize("ai.use"),    getAIRunById);

// ── AI Approval / Human Review ─────────────────────────────────────────────────
router.get("/approvals",            protect, authorize("ai.review"), getAIApprovals);
router.get("/approvals/:id",        protect, authorize("ai.review"), getAIApprovalById);
router.patch("/approvals/:id/review", protect, authorize("ai.review"), reviewAIApproval);

export default router;
