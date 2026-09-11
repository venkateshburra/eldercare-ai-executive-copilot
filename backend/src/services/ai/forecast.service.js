import { generateAIResponse } from "./gemini.service.js";
import { getOrganizationAIContext } from "./aiContext.service.js";

export const generateForecastNarrative = async (organizationId, question) => {
  const organizationData = await getOrganizationAIContext(organizationId);

  const prompt = `
You are a forecasting and planning assistant for an elderly care organization.

Create a cautious forecast narrative using ONLY the organization data provided below.

CURRENT ORGANIZATION DATA:
${JSON.stringify(organizationData, null, 2)}

USER REQUEST:
${question}

IMPORTANT CONTEXT:

The available organization data may not contain historical time-series information.

Therefore:
- Do not invent historical trends.
- Do not invent future numbers.
- Do not claim certainty about future events.
- Clearly distinguish current facts from forward-looking interpretation.
- If historical data is insufficient for a reliable numerical forecast, explicitly say so.
- You may identify potential future risks or areas that leadership should monitor based on the current state.

Return ONLY valid JSON using exactly this structure:

{
  "question": "The user's forecast request",
  "currentState": {
    "summary": "Current state relevant to the forecast",
    "metrics": [
      {
        "name": "Metric name",
        "value": "Current value"
      }
    ]
  },
  "forecast": {
    "narrative": "Forward-looking narrative based on the available evidence",
    "timeHorizon": "Short-term | Medium-term | Long-term | Not determinable",
    "confidence": 0.0
  },
  "areasToMonitor": [
    {
      "area": "Area to monitor",
      "reason": "Why this area deserves attention",
      "priority": "high | medium | low"
    }
  ],
  "potentialRisks": [
    {
      "title": "Potential future risk",
      "severity": "high | medium | low",
      "explanation": "Why this risk could develop"
    }
  ],
  "recommendations": [
    {
      "priority": "high | medium | low",
      "action": "Recommended monitoring or planning action",
      "reason": "Why this action is useful"
    }
  ],
  "limitations": [
    "Missing data or assumptions that limit the forecast"
  ]
}

IMPORTANT RULES:

1. Use only the organization data provided.
2. Do not invent historical data.
3. Do not invent future numbers.
4. Do not present possibilities as facts.
5. Confidence must be between 0 and 1.
6. A forecast must be expressed as a possibility, not a certainty.
7. If historical data is unavailable, explicitly state that numerical forecasting is not reliable.
8. Identify areas leadership should monitor.
9. Recommendations must be practical.
10. Clearly mention limitations.
11. Return JSON only.
12. Do not use markdown.
`;

  const response = await generateAIResponse(prompt);

  try {
    return JSON.parse(response);
  } catch (error) {
    console.error("Forecast JSON parse error:", error);
    console.error("AI raw response:", response);

    throw new Error("AI returned an invalid forecast format");
  }
};
