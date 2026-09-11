import { generateForecastNarrative } from "../../services/ai/forecast.service.js";

export const generateForecast = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "question is required",
      });
    }

    const organizationId = req.user.organizationId;

    const result = await generateForecastNarrative(
      organizationId,
      question.trim(),
    );

    return res.status(200).json({
      success: true,
      message: "AI forecast narrative generated successfully",
      data: result,
    });
  } catch (error) {
    console.error("AI forecast error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate AI forecast",
      error: error?.message ?? "Internal server error",
    });
  }
};
