import { executeGuardedQuery } from "../../services/ai/query.service.js";

export const runAIQuery = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "question is required",
      });
    }

    const organizationId = req.user.organizationId;

    const result = await executeGuardedQuery(organizationId, question.trim());

    return res.status(200).json({
      success: true,
      message: "Guarded AI query executed successfully",
      data: {
        question: question.trim(),
        ...result,
      },
    });
  } catch (error) {
    console.error("Guarded AI query error:", error);

    return res.status(400).json({
      success: false,
      message: error?.message ?? "Failed to execute AI query",
    });
  }
};
