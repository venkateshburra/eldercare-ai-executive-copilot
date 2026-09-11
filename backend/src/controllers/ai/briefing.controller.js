import { generateExecutiveBriefing } from "../../services/ai/briefing.service.js";

export const getExecutiveBriefing = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const briefing = await generateExecutiveBriefing(organizationId);

    return res.status(200).json({
      success: true,
      message: "Executive AI briefing generated successfully",
      data: briefing,
    });
  } catch (error) {
    console.error("Executive briefing error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate executive briefing",
      error: error?.message ?? "Internal server error",
    });
  }
};
