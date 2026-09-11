import { generateAIResponse } from "./gemini.service.js";
import { getOrganizationAIContext } from "./aiContext.service.js";

export const generateExecutiveBriefing = async (organizationId) => {
  const organizationData = await getOrganizationAIContext(organizationId);

  const prompt = `
You are an executive briefing assistant for an elderly care organization.

Create a concise executive briefing based ONLY on the organization data provided below.

ORGANIZATION DATA:
${JSON.stringify(organizationData, null, 2)}

Return ONLY valid JSON using exactly this structure:

{
  "headline": "Short executive headline",
  "summary": "Short leadership-level summary",
  "keyMetrics": [
    {
      "metric": "Metric name",
      "value": "Metric value",
      "interpretation": "What this means"
    }
  ],
  "keyRisks": [
    {
      "title": "Risk title",
      "severity": "high | medium | low",
      "reason": "Why this is important based on the available data"
    }
  ],
  "opportunities": [
    {
      "title": "Opportunity title",
      "description": "Short description"
    }
  ],
  "recommendedActions": [
    {
      "priority": "high | medium | low",
      "action": "Recommended action",
      "reason": "Why leadership should consider this"
    }
  ],
  "limitations": [
    "Information that is unavailable and limits the briefing"
  ]
}

IMPORTANT RULES:

1. Use only the organization data provided.
2. Do not invent organization-specific facts.
3. Clearly distinguish facts from interpretation and recommendations.
4. Include the most important operational metrics.
5. Highlight important risks supported by the data.
6. Provide practical recommendations.
7. Mention missing information in limitations.
8. Do not make unsupported predictions.
9. Return JSON only.
10. Do not use markdown.
`;

  const response = await generateAIResponse(prompt);

  try {
    return JSON.parse(response);
  } catch (error) {
    console.error("Executive briefing JSON parse error:", error);
    console.error("AI raw response:", response);

    throw new Error("AI returned an invalid briefing format");
  }
};
