import Resident from "../../models/Resident.js";
import Staff from "../../models/Staff.js";
import CarePlan from "../../models/CarePlan.js";
import Medication from "../../models/Medication.js";
import Activity from "../../models/Activity.js";
import Incident from "../../models/Incident.js";

export const getOrganizationAIContext = async (organizationId) => {
  const [
    totalResidents,
    activeResidents,
    totalStaff,
    activeStaff,
    totalCarePlans,
    activeCarePlans,
    totalMedications,
    totalActivities,
    openIncidents,
    highSeverityIncidents,
  ] = await Promise.all([
    Resident.countDocuments({ organizationId }),

    Resident.countDocuments({
      organizationId,
      status: "active",
    }),

    Staff.countDocuments({ organizationId }),

    Staff.countDocuments({
      organizationId,
      status: "active",
    }),

    CarePlan.countDocuments({ organizationId }),

    CarePlan.countDocuments({
      organizationId,
      status: "active",
    }),

    Medication.countDocuments({ organizationId }),

    Activity.countDocuments({ organizationId }),

    Incident.countDocuments({
      organizationId,
      status: "open",
    }),

    Incident.countDocuments({
      organizationId,
      severity: "high",
    }),
  ]);

  return {
    residents: {
      total: totalResidents,
      active: activeResidents,
    },

    staff: {
      total: totalStaff,
      active: activeStaff,
    },

    carePlans: {
      total: totalCarePlans,
      active: activeCarePlans,
    },

    medications: {
      total: totalMedications,
    },

    activities: {
      total: totalActivities,
    },

    incidents: {
      open: openIncidents,
      highSeverity: highSeverityIncidents,
    },
  };
};
