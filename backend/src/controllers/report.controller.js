import mongoose from "mongoose";
import Resident from "../models/Resident.js";
import CarePlan from "../models/CarePlan.js";
import Medication from "../models/Medication.js";
import Activity from "../models/Activity.js";
import Incident from "../models/Incident.js";
import Staff from "../models/Staff.js";

// Get organization dashboard summary
export const getDashboardSummary = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const [
      totalResidents,
      activeResidents,
      totalStaff,
      activeStaff,
      totalCarePlans,
      activeCarePlans,
      totalMedications,
      activeMedications,
      totalActivities,
      scheduledActivities,
      totalIncidents,
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

      Medication.countDocuments({
        organizationId,
        status: "active",
      }),

      Activity.countDocuments({ organizationId }),

      Activity.countDocuments({
        organizationId,
        status: "scheduled",
      }),

      Incident.countDocuments({ organizationId }),

      Incident.countDocuments({
        organizationId,
        status: "open",
      }),

      Incident.countDocuments({
        organizationId,
        severity: "high",
      }),
    ]);

    res.status(200).json({
      success: true,
      message: "Dashboard summary fetched successfully",
      data: {
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
          active: activeMedications,
        },

        activities: {
          total: totalActivities,
          scheduled: scheduledActivities,
        },

        incidents: {
          total: totalIncidents,
          open: openIncidents,
          highSeverity: highSeverityIncidents,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get incident analytics
export const getIncidentAnalytics = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const [
      totalIncidents,
      openIncidents,
      resolvedIncidents,
      highSeverity,
      mediumSeverity,
      lowSeverity,
    ] = await Promise.all([
      Incident.countDocuments({ organizationId }),

      Incident.countDocuments({
        organizationId,
        status: "open",
      }),

      Incident.countDocuments({
        organizationId,
        status: "resolved",
      }),

      Incident.countDocuments({
        organizationId,
        severity: "high",
      }),

      Incident.countDocuments({
        organizationId,
        severity: "medium",
      }),

      Incident.countDocuments({
        organizationId,
        severity: "low",
      }),
    ]);

    // Incident count grouped by type
    const incidentsByType = await Incident.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
        },
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Incident analytics fetched successfully",
      data: {
        summary: {
          total: totalIncidents,
          open: openIncidents,
          resolved: resolvedIncidents,
        },

        severity: {
          high: highSeverity,
          medium: mediumSeverity,
          low: lowSeverity,
        },

        byType: incidentsByType,
      },
    });
  } catch (error) {
    console.error("Incident analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get resident analytics
export const getResidentAnalytics = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const [totalResidents, activeResidents, inactiveResidents] =
      await Promise.all([
        Resident.countDocuments({
          organizationId,
        }),

        Resident.countDocuments({
          organizationId,
          status: "active",
        }),

        Resident.countDocuments({
          organizationId,
          status: "inactive",
        }),
      ]);

    // Residents grouped by status
    const residentsByStatus = await Resident.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
        },
      },
      {
        $group: {
          _id: "$status",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Resident analytics fetched successfully",
      data: {
        summary: {
          total: totalResidents,
          active: activeResidents,
          inactive: inactiveResidents,
        },

        byStatus: residentsByStatus,
      },
    });
  } catch (error) {
    console.error("Resident analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// Get staff analytics
export const getStaffAnalytics = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const [totalStaff, activeStaff, inactiveStaff] = await Promise.all([
      Staff.countDocuments({ organizationId }),

      Staff.countDocuments({
        organizationId,
        status: "active",
      }),

      Staff.countDocuments({
        organizationId,
        status: "inactive",
      }),
    ]);

    const staffByDepartment = await Staff.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
        },
      },
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    const staffByPosition = await Staff.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
        },
      },
      {
        $group: {
          _id: "$position",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Staff analytics fetched successfully",
      data: {
        summary: {
          total: totalStaff,
          active: activeStaff,
          inactive: inactiveStaff,
        },
        byDepartment: staffByDepartment,
        byPosition: staffByPosition,
      },
    });
  } catch (error) {
    console.error("Staff analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// Get medication analytics
export const getMedicationAnalytics = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const [totalMedications, activeMedications, inactiveMedications] =
      await Promise.all([
        Medication.countDocuments({
          organizationId,
        }),

        Medication.countDocuments({
          organizationId,
          status: "active",
        }),

        Medication.countDocuments({
          organizationId,
          status: "inactive",
        }),
      ]);

    const medicationsByRoute = await Medication.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
        },
      },
      {
        $group: {
          _id: "$route",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    const medicationsByFrequency = await Medication.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
        },
      },
      {
        $group: {
          _id: "$frequency",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Medication analytics fetched successfully",
      data: {
        summary: {
          total: totalMedications,
          active: activeMedications,
          inactive: inactiveMedications,
        },
        byRoute: medicationsByRoute,
        byFrequency: medicationsByFrequency,
      },
    });
  } catch (error) {
    console.error("Medication analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get care plan analytics
export const getCarePlanAnalytics = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const [
      totalCarePlans,
      activeCarePlans,
      completedCarePlans,
      cancelledCarePlans,
    ] = await Promise.all([
      CarePlan.countDocuments({
        organizationId,
      }),

      CarePlan.countDocuments({
        organizationId,
        status: "active",
      }),

      CarePlan.countDocuments({
        organizationId,
        status: "completed",
      }),

      CarePlan.countDocuments({
        organizationId,
        status: "cancelled",
      }),
    ]);

    const carePlansByStatus = await CarePlan.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Care plan analytics fetched successfully",
      data: {
        summary: {
          total: totalCarePlans,
          active: activeCarePlans,
          completed: completedCarePlans,
          cancelled: cancelledCarePlans,
        },

        byStatus: carePlansByStatus,
      },
    });
  } catch (error) {
    console.error("Care plan analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get activity analytics
export const getActivityAnalytics = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const [
      totalActivities,
      scheduledActivities,
      completedActivities,
      cancelledActivities,
    ] = await Promise.all([
      Activity.countDocuments({
        organizationId,
      }),

      Activity.countDocuments({
        organizationId,
        status: "scheduled",
      }),

      Activity.countDocuments({
        organizationId,
        status: "completed",
      }),

      Activity.countDocuments({
        organizationId,
        status: "cancelled",
      }),
    ]);

    const activitiesByType = await Activity.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
        },
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    const activitiesByStatus = await Activity.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Activity analytics fetched successfully",
      data: {
        summary: {
          total: totalActivities,
          scheduled: scheduledActivities,
          completed: completedActivities,
          cancelled: cancelledActivities,
        },

        byType: activitiesByType,
        byStatus: activitiesByStatus,
      },
    });
  } catch (error) {
    console.error("Activity analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get overall organization analytics
export const getOrganizationAnalytics = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const [
      residents,
      staff,
      carePlans,
      medications,
      activities,
      incidents,
    ] = await Promise.all([
      Resident.countDocuments({
        organizationId,
      }),

      Staff.countDocuments({
        organizationId,
      }),

      CarePlan.countDocuments({
        organizationId,
      }),

      Medication.countDocuments({
        organizationId,
      }),

      Activity.countDocuments({
        organizationId,
      }),

      Incident.countDocuments({
        organizationId,
      }),
    ]);

    const [
      activeResidents,
      activeStaff,
      activeCarePlans,
      activeMedications,
      openIncidents,
      highSeverityIncidents,
      scheduledActivities,
    ] = await Promise.all([
      Resident.countDocuments({
        organizationId,
        status: "active",
      }),

      Staff.countDocuments({
        organizationId,
        status: "active",
      }),

      CarePlan.countDocuments({
        organizationId,
        status: "active",
      }),

      Medication.countDocuments({
        organizationId,
        status: "active",
      }),

      Incident.countDocuments({
        organizationId,
        status: "open",
      }),

      Incident.countDocuments({
        organizationId,
        severity: "high",
      }),

      Activity.countDocuments({
        organizationId,
        status: "scheduled",
      }),
    ]);

    res.status(200).json({
      success: true,
      message: "Organization analytics fetched successfully",
      data: {
        totals: {
          residents,
          staff,
          carePlans,
          medications,
          activities,
          incidents,
        },

        active: {
          residents: activeResidents,
          staff: activeStaff,
          carePlans: activeCarePlans,
          medications: activeMedications,
        },

        attentionRequired: {
          openIncidents,
          highSeverityIncidents,
        },

        upcoming: {
          scheduledActivities,
        },
      },
    });
  } catch (error) {
    console.error("Organization analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};