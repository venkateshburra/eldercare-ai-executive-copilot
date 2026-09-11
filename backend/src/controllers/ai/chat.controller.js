// src/controllers/ai/chat.controller.js
import { orchestrateChat } from "../../services/ai/chat.service.js";
import { recordAIRun } from "../../services/ai/aiRun.service.js";
import { createAuditLog } from "../../services/audit.service.js";
import logger from "../../utils/logger.js";

export const handleChat = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, message: "message is required", code: "BAD_REQUEST" });
    }

    const t0 = Date.now();
    const { intent, result, model, latencyMs } = await orchestrateChat({
      organizationId: req.user.organizationId,
      userId: req.user._id,
      message: message.trim(),
    });

    // Record the AI run
    await recordAIRun({
      organizationId: req.user.organizationId,
      userId: req.user._id,
      feature: "chat",
      input: { message: message.trim(), intent },
      output: result,
      confidence: result?.confidence ?? null,
      model,
      sources: result?.sources || [],
      latencyMs,
    });

    await createAuditLog({
      organizationId: req.user.organizationId,
      actorId: req.user._id,
      action: "ai_execution",
      resourceType: "ai_chat",
      metadata: { intent, model, latencyMs },
      req,
    });

    return res.status(200).json({
      success: true,
      data: {
        intent,
        result,
        model,
        latencyMs,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    logger.error("Chat controller error:", err.message);
    next(err);
  }
};
