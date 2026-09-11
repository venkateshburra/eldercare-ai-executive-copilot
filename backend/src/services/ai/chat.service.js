// src/services/ai/chat.service.js
// Unified AI chat orchestrator — classifies intent and routes to appropriate service.
import { generateAIResponse, GEMINI_MODEL } from "./gemini.service.js";
import { generateAnalyticsAnswer } from "./analytics.service.js";
import { executeGuardedQuery } from "./query.service.js";
import { generateScenarioAnalysis } from "./scenario.service.js";
import { generateForecastNarrative } from "./forecast.service.js";
import { generateRiskAnalysis } from "./riskAnalysis.service.js";
import { generateExecutiveBriefing } from "./briefing.service.js";
import { executeRAG } from "./rag.service.js";
import { getOrganizationAIContext } from "./aiContext.service.js";

const INTENT_PROMPT = (question) => `
You are an AI intent classifier for an elderly care executive copilot.

Classify the user's question into exactly one of these intents:

- general         → General questions, greetings, vague questions
- analytics       → Questions about counts, rates, percentages, comparisons derived from operational data
- query           → Requests to list/find specific records (residents, staff, medications, incidents)
- risk_analysis   → Questions about risks, safety, compliance, incidents patterns
- scenario        → Hypothetical "what if" analysis
- forecast        → Future projections, trend-based predictions
- briefing        → Requests for an executive summary or leadership briefing
- rag             → Questions that require knowledge from uploaded documents (forms, assessments, policies)

USER QUESTION: ${question}

Return ONLY valid JSON:
{"intent": "general | analytics | query | risk_analysis | scenario | forecast | briefing | rag"}

No markdown. JSON only.
`;

const classifyIntent = async (question) => {
  try {
    const raw = await generateAIResponse(INTENT_PROMPT(question));
    const parsed = JSON.parse(raw.trim());
    const valid = ["general", "analytics", "query", "risk_analysis", "scenario", "forecast", "briefing", "rag"];
    return valid.includes(parsed.intent) ? parsed.intent : "general";
  } catch {
    return "general";
  }
};

/**
 * Main chat orchestrator.
 * Returns: { intent, result, model, latencyMs }
 */
export const orchestrateChat = async ({ organizationId, userId, message }) => {
  const t0 = Date.now();
  const intent = await classifyIntent(message);
  let result;

  switch (intent) {
    case "analytics":
      result = await generateAnalyticsAnswer(organizationId, message);
      break;

    case "query":
      result = await executeGuardedQuery(organizationId, message);
      break;

    case "risk_analysis":
      result = await generateRiskAnalysis(organizationId);
      break;

    case "scenario":
      result = await generateScenarioAnalysis(organizationId, message);
      break;

    case "forecast":
      result = await generateForecastNarrative(organizationId, message);
      break;

    case "briefing":
      result = await generateExecutiveBriefing(organizationId);
      break;

    case "rag":
      result = await executeRAG(organizationId, message);
      break;

    default: {
      // general — answer using org context
      const ctx = await getOrganizationAIContext(organizationId);
      const prompt = `
You are an AI assistant for an elderly care organisation.
Answer the user's question concisely and accurately.
If you cannot answer from the available context, say so.

ORGANISATION CONTEXT:
${JSON.stringify(ctx, null, 2)}

USER: ${message}

Return ONLY valid JSON:
{"answer": "your answer", "confidence": 0.8, "limitations": []}
JSON only. No markdown.
`;
      const raw = await generateAIResponse(prompt);
      try { result = JSON.parse(raw); } catch { result = { answer: raw, confidence: 0.7, limitations: [] }; }
      break;
    }
  }

  return {
    intent,
    result,
    model: GEMINI_MODEL,
    latencyMs: Date.now() - t0,
  };
};
