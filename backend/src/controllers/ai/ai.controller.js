  import { generateAIResponse } from "../../services/ai/gemini.service.js";
  import { getOrganizationAIContext } from "../../services/ai/aiContext.service.js";

  export const askAI = async (req, res) => {
    try {
      const { question } = req.body;

      if (!question || !question.trim()) {
        return res.status(400).json({
          success: false,
          message: "question is required",
        });
      }

      const organizationId = req.user.organizationId;

      const organizationData = await getOrganizationAIContext(organizationId);

      const prompt = `
  You are an executive decision-support assistant for an elderly care organization.

  You must answer using the organization's data provided below.

  ORGANIZATION DATA:
  ${JSON.stringify(organizationData, null, 2)}

  USER QUESTION:
  ${question}

  Instructions:
  - Base your analysis on the organization data.
  - Do not invent organization-specific facts.
  - Clearly distinguish facts from recommendations.
  - Highlight important risks when supported by the data.
  - If the available data is insufficient to answer something, say so.
  - Keep the answer useful for organizational leadership.
  `;

      const answer = await generateAIResponse(prompt);

      return res.status(200).json({
        success: true,
        message: "AI response generated successfully",
        data: {
          question,
          answer,
        },
      });
    } catch (error) {
      console.error("Ask AI error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to generate AI response",
        error: error?.message ?? "Internal server error",
      });
    }
  };
