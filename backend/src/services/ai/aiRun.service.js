// src/services/ai/aiRun.service.js
// Helpers to record AI execution runs and create approval records.
import AIRun from "../../models/AIRun.js";
import AIApproval from "../../models/AIApproval.js";
import logger from "../../utils/logger.js";

/**
 * Record an AI execution.
 */
export const recordAIRun = async ({
  organizationId,
  userId,
  feature,
  prompt = "",
  input = {},
  output = null,
  confidence = null,
  model = "gemini-3.6-flash",
  sources = [],
  status = "success",
  errorMessage = null,
  latencyMs = null,
}) => {
  try {
    const run = await AIRun.create({
      organizationId,
      userId,
      feature,
      prompt,
      input,
      output,
      confidence,
      model,
      sources,
      status,
      errorMessage,
      latencyMs,
    });
    return run;
  } catch (err) {
    logger.error("Failed to record AIRun:", err.message);
    return null;
  }
};

/**
 * Create a pending AI approval for high-impact recommendations.
 */
export const createAIApproval = async ({ organizationId, aiRunId, originalOutput }) => {
  try {
    const approval = await AIApproval.create({
      organizationId,
      aiRunId,
      originalOutput,
      status: "pending",
    });
    return approval;
  } catch (err) {
    logger.error("Failed to create AIApproval:", err.message);
    return null;
  }
};
