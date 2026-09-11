import Resident from "../../models/Resident.js";
import Staff from "../../models/Staff.js";
import CarePlan from "../../models/CarePlan.js";
import Medication from "../../models/Medication.js";
import Activity from "../../models/Activity.js";
import Incident from "../../models/Incident.js";

const sourceModels = {
  residents: {
    model: Resident,
    sourceType: "resident",
  },
  staff: {
    model: Staff,
    sourceType: "staff",
  },
  carePlans: {
    model: CarePlan,
    sourceType: "carePlan",
  },
  medications: {
    model: Medication,
    sourceType: "medication",
  },
  activities: {
    model: Activity,
    sourceType: "activity",
  },
  incidents: {
    model: Incident,
    sourceType: "incident",
  },
};

export const getOrganizationEvidence = async (
  organizationId,
  entity,
  filters = {},
) => {
  const source = sourceModels[entity];

  if (!source) {
    throw new Error("Unsupported evidence entity");
  }

  const allowedFilters = {
    residents: ["status", "gender"],
    staff: ["status", "department", "role"],
    carePlans: ["status"],
    medications: ["status"],
    activities: ["status", "type"],
    incidents: ["status", "severity", "type"],
  };

  const entityFilters = allowedFilters[entity];

  const safeFilters = {};

  for (const key of Object.keys(filters)) {
    if (!entityFilters.includes(key)) {
      throw new Error(`Filter '${key}' is not allowed`);
    }

    if (typeof filters[key] !== "string" || !filters[key].trim()) {
      throw new Error(`Invalid value for filter '${key}'`);
    }

    safeFilters[key] = filters[key].trim();
  }

  const query = {
    organizationId,
    ...safeFilters,
  };

  const records = await source.model.find(query).limit(20).lean();

  return records.map((record) => ({
    sourceType: source.sourceType,
    sourceId: record._id,
    organizationId: record.organizationId,
    record,
  }));
};
