import { generateAIResponse } from "./gemini.service.js";
import { getOrganizationAIContext } from "./aiContext.service.js";

export const generateScenarioAnalysis = async (organizationId, scenario) => {
  const organizationData = await getOrganizationAIContext(organizationId);

  const prompt = `
You are a strategic scenario-analysis assistant for an elderly care organization.

Analyze a hypothetical scenario using ONLY the current organization data provided below.

CURRENT ORGANIZATION DATA:
${JSON.stringify(organizationData, null, 2)}

HYPOTHETICAL SCENARIO:
${scenario}

This is a WHAT-IF analysis.

Do NOT modify the organization's data.
Do NOT assume that the hypothetical scenario has actually happened.

Return ONLY valid JSON using exactly this structure:

{
  "scenario": "The hypothetical scenario",
  "baseline": {
    "summary": "Current organization situation relevant to the scenario",
    "metrics": [
      {
        "name": "Metric name",
        "value": "Current value"
      }
    ]
  },
  "impactAnalysis": [
    {
      "area": "Operational area",
      "impact": "high | medium | low",
      "explanation": "Potential impact of the scenario",
      "confidence": 0.0
    }
  ],
  "risks": [
    {
      "title": "Potential risk",
      "severity": "high | medium | low",
      "explanation": "Why this risk could occur"
    }
  ],
  "opportunities": [
    {
      "title": "Potential opportunity",
      "description": "Potential benefit or improvement"
    }
  ],
  "recommendations": [
    {
      "priority": "high | medium | low",
      "action": "Recommended action",
      "reason": "Why this action may help"
    }
  ],
  "limitations": [
    "Missing information or assumptions that limit the analysis"
  ]
}

IMPORTANT RULES:

1. The scenario is hypothetical.
2. Do not claim hypothetical events have actually happened.
3. Use the organization data only as the baseline.
4. Do not invent organization-specific facts.
5. Do not modify any database data.
6. Clearly distinguish current facts from hypothetical impacts.
7. Confidence must be between 0 and 1.
8. If the scenario cannot be meaningfully analyzed with the available data, explain why.
9. Recommendations must be practical.
10. Mention important assumptions and limitations.
11. Return JSON only.
12. Do not use markdown.
`;

  const response = await generateAIResponse(prompt);

  try {
    return JSON.parse(response);
  } catch (error) {
    console.error("Scenario JSON parse error:", error);
    console.error("AI raw response:", response);

    throw new Error("AI returned an invalid scenario analysis format");
  }
};
