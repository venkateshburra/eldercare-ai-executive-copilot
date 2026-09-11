import { generateRiskAnalysis } from "../../services/ai/riskAnalysis.service.js";

export const analyzeRisks = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const analysis = await generateRiskAnalysis(organizationId);

    return res.status(200).json({
      success: true,
      message: "AI risk analysis generated successfully",
      data: analysis,
    });
  } catch (error) {
    console.error("AI risk analysis error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate AI risk analysis",
      error: error?.message ?? "Internal server error",
    });
  }
};
