import { getOrganizationEvidence } from "../../services/ai/evidence.service.js";

const allowedEntities = [
  "residents",
  "staff",
  "carePlans",
  "medications",
  "activities",
  "incidents",
];

export const getEvidence = async (req, res) => {
  try {
    const { entity, filters } = req.body;

    if (!entity) {
      return res.status(400).json({
        success: false,
        message: "entity is required",
      });
    }

    if (!allowedEntities.includes(entity)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported evidence entity",
      });
    }

    const organizationId = req.user.organizationId;

    const evidence = await getOrganizationEvidence(
      organizationId,
      entity,
      filters || {},
    );

    return res.status(200).json({
      success: true,
      message: "Organization evidence retrieved successfully",
      data: {
        entity,
        count: evidence.length,
        evidence,
      },
    });
  } catch (error) {
    console.error("Evidence retrieval error:", error);

    return res.status(400).json({
      success: false,
      message: error?.message ?? "Failed to retrieve evidence",
    });
  }
};
