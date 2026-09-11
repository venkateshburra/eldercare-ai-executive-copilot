import { generateAIResponse } from "./gemini.service.js";

import Resident from "../../models/Resident.js";
import Staff from "../../models/Staff.js";
import CarePlan from "../../models/CarePlan.js";
import Medication from "../../models/Medication.js";
import Activity from "../../models/Activity.js";
import Incident from "../../models/Incident.js";

const allowedEntities = {
  residents: Resident,
  staff: Staff,
  carePlans: CarePlan,
  medications: Medication,
  activities: Activity,
  incidents: Incident,
};

const allowedFilters = {
  residents: ["status", "gender"],
  staff: ["status", "department", "role"],
  carePlans: ["status"],
  medications: ["status"],
  activities: ["status", "type"],
  incidents: ["status", "severity", "type"],
};

const getQueryPlan = async (question) => {
  const prompt = `
You are a controlled query-planning assistant for an elderly care organization.

Convert the user's natural-language question into a SAFE, RESTRICTED query plan.

USER QUESTION:
${question}

Only use these entities:

- residents
- staff
- carePlans
- medications
- activities
- incidents

Only use these filter fields:

residents:
- status
- gender

staff:
- status
- department
- role

carePlans:
- status

medications:
- status

activities:
- status
- type

incidents:
- status
- severity
- type

Return ONLY valid JSON using exactly this structure:

{
  "entity": "residents | staff | carePlans | medications | activities | incidents",
  "filters": {},
  "limit": 20
}

IMPORTANT RULES:

1. Never include organizationId in the response.
2. Never generate JavaScript.
3. Never generate MongoDB operators.
4. Never generate MongoDB queries.
5. Never generate SQL.
6. Only use the allowed entities.
7. Only use the allowed filter fields.
8. Use simple exact-value filters only.
9. Limit must be between 1 and 20.
10. If the question cannot be represented using the allowed entities and filters, return:

{
  "entity": null,
  "filters": {},
  "limit": 20
}

11. Return JSON only.
12. Do not use markdown.
`;

  const response = await generateAIResponse(prompt);

  try {
    return JSON.parse(response);
  } catch (error) {
    console.error("Query plan JSON parse error:", error);
    console.error("AI raw response:", response);

    throw new Error("AI returned an invalid query plan");
  }
};

const validateQueryPlan = (queryPlan) => {
  if (!queryPlan || typeof queryPlan !== "object") {
    throw new Error("Invalid query plan");
  }

  const { entity, filters, limit } = queryPlan;

  if (!entity || !allowedEntities[entity]) {
    throw new Error("Unsupported query entity");
  }

  if (!filters || typeof filters !== "object" || Array.isArray(filters)) {
    throw new Error("Invalid query filters");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    throw new Error("Invalid query limit");
  }

  const entityAllowedFilters = allowedFilters[entity];

  for (const key of Object.keys(filters)) {
    if (!entityAllowedFilters.includes(key)) {
      throw new Error(`Filter '${key}' is not allowed`);
    }

    if (typeof filters[key] !== "string" || !filters[key].trim()) {
      throw new Error(`Invalid value for filter '${key}'`);
    }
  }

  return true;
};

export const executeGuardedQuery = async (organizationId, question) => {
  const queryPlan = await getQueryPlan(question);

  validateQueryPlan(queryPlan);

  const Model = allowedEntities[queryPlan.entity];

  const mongoQuery = {
    organizationId,
    ...queryPlan.filters,
  };

  const results = await Model.find(mongoQuery).limit(queryPlan.limit).lean();

  return {
    queryPlan,
    count: results.length,
    results,
  };
};
