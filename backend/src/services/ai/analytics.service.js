import { generateAIResponse } from "./gemini.service.js";
import { getOrganizationAIContext } from "./aiContext.service.js";

export const generateAnalyticsAnswer = async (organizationId, question) => {
  const organizationData = await getOrganizationAIContext(organizationId);

  const prompt = `
You are an analytics assistant for an elderly care organization.

Answer the user's analytics question using ONLY the organization data provided below.

ORGANIZATION DATA:
${JSON.stringify(organizationData, null, 2)}

USER QUESTION:
${question}

Return ONLY valid JSON using exactly this structure:

{
  "question": "The user's question",
  "answer": "Direct answer to the question",
  "metrics": [
    {
      "name": "Metric name",
      "value": "Metric value",
      "description": "What the metric represents"
    }
  ],
  "insight": "Short useful interpretation of the result",
  "confidence": 0.0,
  "limitations": [
    "Any missing information that limits the answer"
  ]
}

IMPORTANT RULES:

1. Use only the organization data provided.
2. Do not invent organization-specific facts.
3. Confidence must be between 0 and 1.
4. If the question can be answered directly from the data, give a direct answer.
5. If the available data is insufficient, clearly say so.
6. Do not create numbers that are not present or derivable from the data.
7. You may calculate simple values such as percentages from the provided counts.
8. Clearly distinguish facts from interpretation.
9. Mention limitations when appropriate.
10. Return JSON only.
11. Do not use markdown.
`;

  const response = await generateAIResponse(prompt);

  try {
    return JSON.parse(response);
  } catch (error) {
    console.error("Analytics JSON parse error:", error);
    console.error("AI raw response:", response);

    throw new Error("AI returned an invalid analytics format");
  }
};
