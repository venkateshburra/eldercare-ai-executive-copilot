import { generateAIResponse } from "./gemini.service.js";
import { getOrganizationAIContext } from "./aiContext.service.js";

export const generateRiskAnalysis = async (organizationId) => {
  const organizationData = await getOrganizationAIContext(organizationId);

  const prompt = `
You are an executive risk-analysis assistant for an elderly care organization.

Analyze the organization's current operational data.

ORGANIZATION DATA:
${JSON.stringify(organizationData, null, 2)}

Your task is to identify important operational risks.

Return ONLY valid JSON.

Use exactly this structure:

{
  "summary": "Short executive summary",
  "risks": [
    {
      "title": "Risk title",
      "severity": "high | medium | low",
      "confidence": 0.0,
      "evidence": [
        "Fact from organization data"
      ],
      "impact": "Potential business, operational, safety, or care impact",
      "recommendation": "Recommended action"
    }
  ],
  "opportunities": [
    {
      "title": "Opportunity title",
      "description": "Description",
      "evidence": [
        "Fact from organization data"
      ],
      "recommendation": "Recommended action"
    }
  ],
  "limitations": [
    "Information that is unavailable and limits the analysis"
  ]
}

IMPORTANT RULES:

1. Do not invent organization-specific facts.
2. Every risk must have evidence from the provided data.
3. Confidence must be between 0 and 1.
4. High severity means potentially significant immediate risk.
5. Medium severity means the risk deserves management attention.
6. Low severity means the risk is currently less urgent.
7. Clearly mention missing information in limitations.
8. Recommendations must be practical.
9. Separate facts from recommendations.
10. Return JSON only.
11. Do not use markdown.
`;

  const response = await generateAIResponse(prompt);

  try {
    return JSON.parse(response);
  } catch (error) {
    console.error("Risk analysis JSON parse error:", error);
    console.error("AI raw response:", response);

    throw new Error("AI returned an invalid analysis format");
  }
};
