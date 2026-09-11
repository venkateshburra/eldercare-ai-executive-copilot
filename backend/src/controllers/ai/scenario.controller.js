import { generateScenarioAnalysis } from "../../services/ai/scenario.service.js";

export const analyzeScenario = async (req, res) => {
  try {
    const { scenario } = req.body;

    if (!scenario || !scenario.trim()) {
      return res.status(400).json({
        success: false,
        message: "scenario is required",
      });
    }

    const organizationId = req.user.organizationId;

    const result = await generateScenarioAnalysis(
      organizationId,
      scenario.trim(),
    );

    return res.status(200).json({
      success: true,
      message: "AI scenario analysis generated successfully",
      data: result,
    });
  } catch (error) {
    console.error("AI scenario analysis error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate AI scenario analysis",
      error: error?.message ?? "Internal server error",
    });
  }
};
