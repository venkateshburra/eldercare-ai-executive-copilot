import { generateAnalyticsAnswer } from "../../services/ai/analytics.service.js";

export const askAnalytics = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "question is required",
      });
    }

    const organizationId = req.user.organizationId;

    const result = await generateAnalyticsAnswer(
      organizationId,
      question.trim(),
    );

    return res.status(200).json({
      success: true,
      message: "AI analytics generated successfully",
      data: result,
    });
  } catch (error) {
    console.error("AI analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate AI analytics",
      error: error?.message ?? "Internal server error",
    });
  }
};
