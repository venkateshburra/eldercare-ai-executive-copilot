import Organization from "../models/Organization.js";
import User from "../models/User.js";
import Permission from "../models/Permission.js";
import Role from "../models/Role.js";
import Setting from "../models/Setting.js";

// ── GET ALL ORGANIZATIONS ───────────────────────────────────────────────────
export const getOrganizations = async (req, res) => {
  try {
    const orgs = await Organization.find({ _id: req.user.organizationId }).sort({ createdAt: -1 });

    const orgsWithCounts = await Promise.all(
      orgs.map(async (org) => {
        const userCount = await User.countDocuments({ organizationId: org._id });
        return {
          ...org.toObject(),
          userCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Organizations fetched successfully",
      data: orgsWithCounts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ── CREATE ORGANIZATION ──────────────────────────────────────────────────────
export const createOrganization = async (req, res) => {
  try {
    const { name, slug } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Organization name is required",
      });
    }

    const cleanName = name.trim();
    const generatedSlug = (slug || cleanName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const existing = await Organization.findOne({ slug: generatedSlug });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `An organization with slug '${generatedSlug}' already exists`,
      });
    }

    const organization = await Organization.create({
      name: cleanName,
      slug: generatedSlug,
      status: "active",
    });

    // 1. Seed base permissions for this new organization
    const defaultPermissionNames = [
      "residents.view", "residents.manage",
      "staff.view", "staff.manage",
      "shifts.view", "shifts.manage",
      "carePlans.view", "carePlans.manage",
      "medications.view", "medications.manage",
      "activities.view", "activities.manage",
      "incidents.view", "incidents.manage",
      "decisions.view", "decisions.manage",
      "scenarios.view", "scenarios.manage",
      "reports.view",
      "ai.use", "ai.review",
      "users.view", "users.manage",
      "roles.view", "roles.manage",
      "settings.view", "settings.manage",
      "auditLogs.view",
    ];

    const createdPerms = await Permission.insertMany(
      defaultPermissionNames.map((pName) => ({
        organizationId: organization._id,
        name: pName,
        description: `Permission to ${pName.replace(".", " ")}`,
        isActive: true,
      }))
    );

    const permMap = {};
    createdPerms.forEach((p) => {
      permMap[p.name] = p._id;
    });

    // 2. Seed default roles for this new organization
    await Role.create([
      {
        organizationId: organization._id,
        name: "Executive",
        description: "Full oversight across occupancy, KPIs, strategy, AI approvals, and decisions",
        permissionIds: Object.values(permMap),
        isActive: true,
      },
      {
        organizationId: organization._id,
        name: "Business Analyst",
        description: "Focus on scenario modeling, reporting analytics, forecasts, and KPI tracking",
        permissionIds: [
          permMap["reports.view"],
          permMap["scenarios.view"],
          permMap["scenarios.manage"],
          permMap["decisions.view"],
          permMap["residents.view"],
          permMap["incidents.view"],
          permMap["medications.view"],
          permMap["ai.use"],
          permMap["auditLogs.view"],
        ].filter(Boolean),
        isActive: true,
      },
      {
        organizationId: organization._id,
        name: "Data Steward",
        description: "Focus on data integrity, knowledge base ingestion, audit trails, and review",
        permissionIds: [
          permMap["residents.view"],
          permMap["residents.manage"],
          permMap["auditLogs.view"],
          permMap["ai.use"],
          permMap["ai.review"],
          permMap["reports.view"],
          permMap["settings.view"],
        ].filter(Boolean),
        isActive: true,
      },
      {
        organizationId: organization._id,
        name: "Department Head",
        description: "Operational lead for clinical staff, shift schedules, care plans, and incident response",
        permissionIds: [
          permMap["staff.view"],
          permMap["staff.manage"],
          permMap["shifts.view"],
          permMap["shifts.manage"],
          permMap["carePlans.view"],
          permMap["carePlans.manage"],
          permMap["medications.view"],
          permMap["medications.manage"],
          permMap["activities.view"],
          permMap["incidents.view"],
          permMap["incidents.manage"],
          permMap["residents.view"],
          permMap["decisions.view"],
          permMap["decisions.manage"],
          permMap["reports.view"],
          permMap["ai.use"],
        ].filter(Boolean),
        isActive: true,
      },
    ]);

    // 3. Seed default settings
    await Setting.create({
      organizationId: organization._id,
      systemName: cleanName,
      thresholds: {
        occupancyAlertPercent: 80,
        fallIncidentWarning: 3,
        medicationMissRateMaxPercent: 4.5,
        minCaregiverRatio: 0.25,
        slaResponseTimeMinutes: 12,
      },
      notificationRules: {
        notifyOnCriticalIncident: true,
        notifyOnPendingAIApproval: true,
        notifyOnMissedMedication: true,
        dailyDigestEnabled: true,
      },
      workflowRules: {
        dualApprovalForHighImpact: true,
        requireOverrideReason: true,
        lockClosedIncidents: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Organization created and initialized with standard roles & permissions successfully",
      data: organization,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};