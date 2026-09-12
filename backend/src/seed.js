import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import dns from "dns";

dotenv.config();

dns.setServers(["8.8.8.8", "8.8.4.4"]);

import Organization from "./models/Organization.js";
import Permission from "./models/Permission.js";
import Role from "./models/Role.js";
import User from "./models/User.js";
import Resident from "./models/Resident.js";
import Staff from "./models/Staff.js";
import Shift from "./models/Shift.js";
import FamilyMember from "./models/FamilyMember.js";
import CarePlan from "./models/CarePlan.js";
import Medication from "./models/Medication.js";
import Activity from "./models/Activity.js";
import Incident from "./models/Incident.js";
import Decision from "./models/Decision.js";
import Scenario from "./models/Scenario.js";
import ScenarioVersion from "./models/ScenarioVersion.js";
import AIDocument from "./models/AIDocument.js";
import AIChunk from "./models/AIChunk.js";
import Notification from "./models/Notification.js";
import Setting from "./models/Setting.js";
import AuditLog from "./models/AuditLog.js";
import { generateEmbedding } from "./services/ai/gemini.service.js";

// Deterministic mock embedding generator (768 dimensions) for RAG offline testing
const generateMockEmbedding = (text) => {
  const embedding = new Array(768).fill(0);
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  for (let i = 0; i < 768; i++) {
    embedding[i] = Math.sin((hash + i) * 0.1) * 0.5;
  }
  return embedding;
};

const runSeed = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error("MONGO_URI not found in .env");

    console.log("Connecting to MongoDB for seeding...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    // 1. Organization
    let org = await Organization.findOne({ slug: "silvercare-senior-living" });
    if (!org) {
      org = await Organization.create({
        name: "SilverCare Senior Living",
        slug: "silvercare-senior-living",
        status: "active",
      });
      console.log("Created Organization: SilverCare Senior Living");
    } else {
      console.log("Using existing Organization: SilverCare Senior Living");
    }
    const orgId = org._id;

    // 2. Settings
    await Setting.findOneAndUpdate(
      { organizationId: orgId },
      {
        aiSettings: {
          confidenceThreshold: 0.75,
          strictCitations: true,
          autoApproveLowRisk: false,
          modelName: "gemini-2.0-flash",
          maxTokensPerQuery: 2048,
        },
        alertThresholds: {
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
      },
      { upsert: true, new: true }
    );
    console.log("Seeded System & Governance Settings.");

    // 3. Permissions
    const permissionNames = [
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

    const permissions = [];
    for (const name of permissionNames) {
      let perm = await Permission.findOne({ organizationId: orgId, name });
      if (!perm) {
        perm = await Permission.create({
          organizationId: orgId,
          name,
          description: `Permission to ${name.replace(".", " ")}`,
          isActive: true,
        });
      }
      permissions.push(perm);
    }
    const permMap = {};
    permissions.forEach(p => { permMap[p.name] = p._id; });
    console.log(`Verified ${permissions.length} permissions.`);

    // 4. Roles (Executive, Business Analyst, Data Steward, Department Head)
    const roleConfigs = [
      {
        name: "Executive",
        description: "Full oversight across occupancy, KPIs, strategy, AI approvals, and decisions",
        perms: Object.values(permMap),
      },
      {
        name: "Business Analyst",
        description: "Focus on scenario modeling, reporting analytics, forecasts, and KPI tracking",
        perms: [
          permMap["reports.view"],
          permMap["scenarios.view"],
          permMap["scenarios.manage"],
          permMap["decisions.view"],
          permMap["residents.view"],
          permMap["ai.use"],
          permMap["auditLogs.view"],
        ].filter(Boolean),
      },
      {
        name: "Data Steward",
        description: "Focus on data integrity, knowledge base ingestion, audit trails, and review",
        perms: [
          permMap["residents.view"],
          permMap["residents.manage"],
          permMap["auditLogs.view"],
          permMap["ai.use"],
          permMap["ai.review"],
          permMap["reports.view"],
          permMap["settings.view"],
        ].filter(Boolean),
      },
      {
        name: "Department Head",
        description: "Operational lead for clinical staff, shift schedules, care plans, and incident response",
        perms: [
          permMap["staff.view"],
          permMap["staff.manage"],
          permMap["shifts.view"],
          permMap["shifts.manage"],
          permMap["carePlans.view"],
          permMap["carePlans.manage"],
          permMap["incidents.view"],
          permMap["incidents.manage"],
          permMap["residents.view"],
          permMap["decisions.view"],
          permMap["decisions.manage"],
          permMap["ai.use"],
        ].filter(Boolean),
      },
    ];

    const roleMap = {};
    for (const rc of roleConfigs) {
      let role = await Role.findOne({ organizationId: orgId, name: rc.name });
      if (!role) {
        role = await Role.create({
          organizationId: orgId,
          name: rc.name,
          description: rc.description,
          permissionIds: rc.perms,
          isActive: true,
        });
      } else {
        role.permissionIds = rc.perms;
        await role.save();
      }
      roleMap[rc.name] = role._id;
    }
    console.log("Seeded 4 Roles: Executive, Business Analyst, Data Steward, Department Head.");

    // 5. Users
    const defaultPassword = await bcrypt.hash("Password@123", 12);
    const userConfigs = [
      {
        firstName: "Sarah",
        lastName: "Jenkins",
        email: "executive@silvercare.org",
        roleId: roleMap["Executive"],
      },
      {
        firstName: "Marcus",
        lastName: "Vance",
        email: "analyst@silvercare.org",
        roleId: roleMap["Business Analyst"],
      },
      {
        firstName: "Elena",
        lastName: "Rostova",
        email: "steward@silvercare.org",
        roleId: roleMap["Data Steward"],
      },
      {
        firstName: "David",
        lastName: "Kim",
        email: "depthead@silvercare.org",
        roleId: roleMap["Department Head"],
      },
    ];

    let executiveUser = null;
    for (const uc of userConfigs) {
      let u = await User.findOne({ email: uc.email });
      if (!u) {
        u = await User.create({
          organizationId: orgId,
          firstName: uc.firstName,
          lastName: uc.lastName,
          email: uc.email,
          password: defaultPassword,
          roleId: uc.roleId,
          status: "active",
        });
      } else {
        u.roleId = uc.roleId;
        await u.save();
      }
      if (uc.email === "executive@silvercare.org") executiveUser = u;
    }
    console.log("Seeded 4 demo users (Password: Password@123 for all).");

    const actorId = executiveUser._id;

    // 6. Residents
    const existingResidents = await Resident.countDocuments({ organizationId: orgId });
    if (existingResidents === 0) {
      const residentsData = [
        { firstName: "Eleanor", lastName: "Vance", dateOfBirth: new Date("1942-05-14"), gender: "female", admissionDate: new Date("2024-01-15"), roomNumber: "101-A", status: "active", notes: "Prefers morning tea in garden. Mild hearing loss." },
        { firstName: "Arthur", lastName: "Pendelton", dateOfBirth: new Date("1938-11-20"), gender: "male", admissionDate: new Date("2023-09-10"), roomNumber: "102-B", status: "active", notes: "High fall risk; uses walker at all times." },
        { firstName: "Margaret", lastName: "Hughes", dateOfBirth: new Date("1945-03-08"), gender: "female", admissionDate: new Date("2024-03-01"), roomNumber: "103-A", status: "active", notes: "Diabetic management; monitor evening snacks." },
        { firstName: "Robert", lastName: "Chen", dateOfBirth: new Date("1940-08-17"), gender: "male", admissionDate: new Date("2023-11-22"), roomNumber: "104-A", status: "active", notes: "Daily hypertension monitoring." },
        { firstName: "Dorothy", lastName: "Miller", dateOfBirth: new Date("1936-01-29"), gender: "female", admissionDate: new Date("2023-04-12"), roomNumber: "201-B", status: "active", notes: "Memory care wing; wanders during shift changes." },
        { firstName: "Walter", lastName: "White", dateOfBirth: new Date("1943-09-07"), gender: "male", admissionDate: new Date("2024-05-19"), roomNumber: "202-A", status: "active", notes: "Independent with medication administration assistance." },
        { firstName: "Beatrice", lastName: "Alcott", dateOfBirth: new Date("1939-12-11"), gender: "female", admissionDate: new Date("2023-08-05"), roomNumber: "203-A", status: "active", notes: "Skilled nursing oversight; physical therapy twice weekly." },
        { firstName: "Harold", lastName: "Finch", dateOfBirth: new Date("1946-04-18"), gender: "male", admissionDate: new Date("2024-02-14"), roomNumber: "204-B", status: "active", notes: "Assisted living; needs help with buttoning and shoes." },
        { firstName: "Clara", lastName: "Oswald", dateOfBirth: new Date("1944-07-22"), gender: "female", admissionDate: new Date("2023-10-01"), roomNumber: "301-A", status: "active", notes: "Memory care; enjoys afternoon piano music." },
        { firstName: "Thomas", lastName: "Shelby", dateOfBirth: new Date("1937-10-30"), gender: "male", admissionDate: new Date("2023-06-18"), roomNumber: "302-B", status: "active", notes: "Skilled nursing; oxygen therapy support at night." },
      ];
      await Resident.insertMany(residentsData.map(r => ({ ...r, organizationId: orgId })));
      console.log("Seeded 10 Residents.");
    }

    const residents = await Resident.find({ organizationId: orgId });

    // 7. Staff
    const existingStaff = await Staff.countDocuments({ organizationId: orgId });
    if (existingStaff === 0) {
      const allUsers = await User.find({ organizationId: orgId });
      const staffMembers = [
        {
          userId: allUsers[0]._id,
          employeeId: "EMP-1001",
          position: "Clinical Director & RN",
          department: "Nursing",
          phone: "555-0101",
          status: "active",
          createdBy: actorId,
        },
        {
          userId: allUsers[1]._id,
          employeeId: "EMP-1002",
          position: "Lead Care Coordinator",
          department: "Memory Care",
          phone: "555-0102",
          status: "active",
          createdBy: actorId,
        },
        {
          userId: allUsers[2]._id,
          employeeId: "EMP-1003",
          position: "Senior Data Steward",
          department: "Operations",
          phone: "555-0103",
          status: "active",
          createdBy: actorId,
        },
        {
          userId: allUsers[3]._id,
          employeeId: "EMP-1004",
          position: "Department Head",
          department: "Clinical Services",
          phone: "555-0104",
          status: "active",
          createdBy: actorId,
        },
      ];
      await Staff.insertMany(staffMembers.map(s => ({ ...s, organizationId: orgId })));
      console.log("Seeded 4 Staff Members.");
    }

    const staffList = await Staff.find({ organizationId: orgId });

    // 7.1 Shifts
    const existingShifts = await Shift.countDocuments({ organizationId: orgId });
    if (existingShifts === 0 && staffList.length > 0) {
      const shiftData = [
        {
          staffId: staffList[0]._id,
          date: new Date(),
          startTime: "07:00",
          endTime: "15:00",
          shiftType: "morning",
          status: "in_progress",
          handoverNotes: "Morning medication pass completed. Vitals stable across Wing A.",
          createdBy: actorId,
        },
        {
          staffId: staffList[1]._id,
          date: new Date(),
          startTime: "07:00",
          endTime: "15:00",
          shiftType: "morning",
          status: "in_progress",
          handoverNotes: "Memory Care sensory activities scheduled for 10:30 AM.",
          createdBy: actorId,
        },
        {
          staffId: staffList[2]._id,
          date: new Date(),
          startTime: "15:00",
          endTime: "23:00",
          shiftType: "afternoon",
          status: "scheduled",
          handoverNotes: "Physical therapy handover scheduled for Arthur Pendelton.",
          createdBy: actorId,
        },
        {
          staffId: staffList[3]._id,
          date: new Date(),
          startTime: "23:00",
          endTime: "07:00",
          shiftType: "night",
          status: "scheduled",
          handoverNotes: "Night checks every 60 mins on high fall risk rooms 102 and 201.",
          createdBy: actorId,
        },
        {
          staffId: staffList[0]._id,
          date: new Date(Date.now() - 86400000),
          startTime: "07:00",
          endTime: "15:00",
          shiftType: "morning",
          status: "completed",
          handoverNotes: "All meals assisted. Incident slip in bathroom reported and checked.",
          createdBy: actorId,
        },
      ];
      await Shift.insertMany(shiftData.map(s => ({ ...s, organizationId: orgId })));
      console.log("Seeded 5 Staff Shifts.");
    }

    // 7.2 Family Members & Relationships
    const existingFamily = await FamilyMember.countDocuments({ organizationId: orgId });
    if (existingFamily === 0 && residents.length > 0) {
      const familyData = [
        {
          residentId: residents[0]._id,
          firstName: "Claire",
          lastName: "Vance-Howard",
          relationship: "Daughter",
          email: "claire.vance@example.com",
          phone: "555-234-1101",
          isPrimaryContact: true,
          status: "active",
          notes: "Primary healthcare proxy and emergency contact. Calls every Sunday.",
        },
        {
          residentId: residents[0]._id,
          firstName: "Julian",
          lastName: "Vance",
          relationship: "Son",
          email: "julian.vance@example.com",
          phone: "555-234-1102",
          isPrimaryContact: false,
          status: "active",
          notes: "Lives out of state; visits quarterly.",
        },
        {
          residentId: residents[1]._id,
          firstName: "Thomas",
          lastName: "Pendelton Jr.",
          relationship: "Son",
          email: "t.pendelton@example.com",
          phone: "555-234-2201",
          isPrimaryContact: true,
          status: "active",
          notes: "Authorized for medical consent and financial oversight.",
        },
        {
          residentId: residents[2]._id,
          firstName: "Sarah",
          lastName: "Hughes-Miller",
          relationship: "Daughter",
          email: "sarah.miller@example.com",
          phone: "555-234-3301",
          isPrimaryContact: true,
          status: "active",
          notes: "Attends care plan reviews via video conference.",
        },
        {
          residentId: residents[3]._id,
          firstName: "Grace",
          lastName: "Chen",
          relationship: "Spouse",
          email: "grace.chen@example.com",
          phone: "555-234-4401",
          isPrimaryContact: true,
          status: "active",
          notes: "Visits daily at lunch. Assists with feeding if needed.",
        },
        {
          residentId: residents[4]._id,
          firstName: "Robert",
          lastName: "Miller",
          relationship: "Son",
          email: "robert.m@example.com",
          phone: "555-234-5501",
          isPrimaryContact: true,
          status: "active",
          notes: "Designated legal guardian and power of attorney.",
        },
      ];
      await FamilyMember.insertMany(familyData.map(f => ({ ...f, organizationId: orgId })));
      console.log("Seeded 6 Family Members & Relationships.");
    }

    // 8. Care Plans
    const existingCarePlans = await CarePlan.countDocuments({ organizationId: orgId });
    if (existingCarePlans === 0 && residents.length > 0) {
      const carePlans = [
        { residentId: residents[0]._id, title: "Memory Support & Fall Prevention", description: "Comprehensive neurocognitive care plan", goals: ["Support daily orientation", "Assist with mobility during evening hours"], startDate: new Date("2024-01-20"), status: "active", createdBy: actorId },
        { residentId: residents[1]._id, title: "Post-Stroke Rehabilitation Care", description: "Motor and mobility rehabilitation protocol", goals: ["Physical therapy twice daily", "Skin integrity checks"], startDate: new Date("2023-09-15"), status: "active", createdBy: actorId },
        { residentId: residents[2]._id, title: "Diabetes Management & Dietary Protocol", description: "Endocrine and nutrition support", goals: ["Monitor blood glucose before meals", "Enforce low glycemic diet"], startDate: new Date("2024-03-05"), status: "active", createdBy: actorId },
        { residentId: residents[3]._id, title: "Cardiovascular Wellness & Gentle Exercise", description: "Cardiology maintenance plan", goals: ["Daily blood pressure monitoring", "Light walking program"], startDate: new Date("2023-11-25"), status: "active", createdBy: actorId },
      ];
      await CarePlan.insertMany(carePlans.map(cp => ({ ...cp, organizationId: orgId })));
      console.log("Seeded 4 Care Plans.");
    }

    // 9. Medications
    const existingMeds = await Medication.countDocuments({ organizationId: orgId });
    if (existingMeds === 0 && residents.length > 0) {
      const meds = [
        { residentId: residents[0]._id, name: "Donepezil", dosage: "10mg", frequency: "Once daily at bedtime", route: "Oral", startDate: new Date("2024-01-20"), status: "active", createdBy: actorId },
        { residentId: residents[1]._id, name: "Lisinopril", dosage: "20mg", frequency: "Every morning", route: "Oral", startDate: new Date("2023-09-15"), status: "active", createdBy: actorId },
        { residentId: residents[2]._id, name: "Metformin", dosage: "500mg", frequency: "Twice daily with meals", route: "Oral", startDate: new Date("2024-03-05"), status: "active", createdBy: actorId },
        { residentId: residents[3]._id, name: "Atorvastatin", dosage: "40mg", frequency: "Once daily in the evening", route: "Oral", startDate: new Date("2023-11-25"), status: "active", createdBy: actorId },
        { residentId: residents[4]._id, name: "Donepezil", dosage: "5mg", frequency: "Once daily", route: "Oral", startDate: new Date("2023-04-20"), status: "active", createdBy: actorId },
      ];
      await Medication.insertMany(meds.map(m => ({ ...m, organizationId: orgId })));
      console.log("Seeded 5 Medication Schedules.");
    }

    // 10. Activities
    const existingActs = await Activity.countDocuments({ organizationId: orgId });
    if (existingActs === 0 && residents.length > 0) {
      const activities = [
        { residentId: residents[0]._id, name: "Morning Gentle Chair Yoga", type: "exercise", description: "Mobility and breathing exercises led by physical therapy team", scheduledDate: new Date(Date.now() + 3600000 * 2), duration: 45, status: "scheduled", createdBy: actorId },
        { residentId: residents[4]._id, name: "Memory & Music Sensory Hour", type: "therapy", description: "Therapeutic 1950s/60s music stimulation for Memory Care wing", scheduledDate: new Date(Date.now() + 3600000 * 6), duration: 60, status: "scheduled", createdBy: actorId },
        { residentId: residents[2]._id, name: "Cognitive Trivia & Bingo Social", type: "social", description: "Interactive memory puzzles, group trivia, and prizes", scheduledDate: new Date(Date.now() - 3600000 * 24), duration: 60, status: "completed", createdBy: actorId },
      ];
      await Activity.insertMany(activities.map(a => ({ ...a, organizationId: orgId })));
      console.log("Seeded 3 Activities.");
    }

    // 11. Incidents
    const existingIncidents = await Incident.countDocuments({ organizationId: orgId });
    if (existingIncidents === 0 && residents.length > 0) {
      const incidents = [
        {
          residentId: residents[0]._id,
          type: "Fall Incident",
          severity: "medium",
          description: "Resident slipped while reaching for walker. No head trauma. Checked by RN, vital signs stable, ice applied to left knee.",
          incidentDate: new Date(Date.now() - 3600000 * 12),
          location: "Room 101-A bathroom threshold",
          actionTaken: "Low bed deployed, physical therapy re-evaluation ordered.",
          status: "investigating",
          createdBy: actorId,
        },
        {
          residentId: residents[1]._id,
          type: "Medication Delay",
          severity: "low",
          description: "Evening medication dose administered 35 minutes outside window due to emergency admission triage in Wing A.",
          incidentDate: new Date(Date.now() - 3600000 * 36),
          location: "Wing A Medication Station",
          actionTaken: "Medication logged, vitals checked, charge nurse notified.",
          status: "resolved",
          createdBy: actorId,
        },
        {
          residentId: residents[4]._id,
          type: "Behavioral Agitation",
          severity: "low",
          description: "Resident exhibited restlessness and disorientation during 7PM shift change. De-escalated via music therapy.",
          incidentDate: new Date(Date.now() - 3600000 * 48),
          location: "Memory Care Day Room",
          actionTaken: "Music therapy and warm herbal beverage provided.",
          status: "resolved",
          createdBy: actorId,
        },
      ];
      await Incident.insertMany(incidents.map(inc => ({ ...inc, organizationId: orgId })));
      console.log("Seeded 3 Incidents.");
    }

    // 12. Decisions & Governance
    const existingDecisions = await Decision.countDocuments({ organizationId: orgId });
    if (existingDecisions === 0) {
      const decisions = [
        {
          organizationId: orgId,
          createdBy: actorId,
          title: "Approve 2 Additional Night-Shift Caregivers for Memory Care Wing",
          description: "AI analysis and incident trend flagged increased wander risk between 11PM and 4AM. Additional staff allocated.",
          decisionType: "staffing",
          priority: "high",
          status: "approved",
          rationale: "Mitigate fall and wander risk during late night shift changeover",
          actions: [
            {
              actorId,
              action: "approve",
              timestamp: new Date(Date.now() - 3600000 * 20),
              reason: "Executive approved allocation based on incident analysis.",
              outcome: "2 FTE Caregiver positions posted.",
            },
          ],
        },
        {
          organizationId: orgId,
          createdBy: actorId,
          title: "Transition Room 204 to High-Acuity Hospice Support",
          description: "Palliative care coordination requested by resident family and attending physician.",
          decisionType: "resident_care",
          priority: "high",
          status: "pending",
          rationale: "Requires multi-disciplinary consent and hospice care package review",
          actions: [
            {
              actorId,
              action: "create",
              timestamp: new Date(Date.now() - 3600000 * 6),
              reason: "Clinical triage request submitted by Charge Nurse.",
            },
          ],
        },
        {
          organizationId: orgId,
          createdBy: actorId,
          title: "Procure Wearable Radar Fall Sensors across all Level 3 Rooms",
          description: "AI suggested blanket immediate procurement. Overridden to conduct a 30-day 5-room pilot first.",
          decisionType: "operations",
          priority: "medium",
          status: "overridden",
          rationale: "High capital expense requiring field efficacy validation",
          actions: [
            {
              actorId,
              action: "override",
              timestamp: new Date(Date.now() - 3600000 * 10),
              reason: "Cost-benefit ratio requires verification on false-alarm rate before full facility rollout.",
              outcome: "Authorized 5-room pilot program in Wing B.",
            },
          ],
        },
      ];
      await Decision.insertMany(decisions);
      console.log("Seeded 3 Governance Decisions.");
    }

    // 13. Scenarios & Versions
    const existingScenarios = await Scenario.countDocuments({ organizationId: orgId });
    if (existingScenarios === 0) {
      const scenarioData = [
        {
          title: "Q4 Caregiver Staffing Optimization",
          description: "Base staffing model comparing 1:4 vs 1:5 ratio under expected 92% occupancy.",
          category: "caregiver_scheduling",
          type: "base",
          assumptions: [
            { key: "caregiverStaffing", value: 24, unit: "FTE", label: "Caregiver Staff Count" },
            { key: "residentCount", value: 72, unit: "residents", label: "Projected Residents" },
            { key: "caregiverHourlyRate", value: 23, unit: "$/hr", label: "Average Hourly Rate" },
            { key: "occupancyRate", value: 90, unit: "%", label: "Target Occupancy" },
          ],
          result: {
            staffToResidentRatio: 0.33,
            estimatedMonthlyRevenue: 324000,
            estimatedStaffCost: 95573,
            netOperatingMargin: 228427,
            riskIndex: "Low",
            projectedIncidentRate: 1.6,
          },
          status: "active",
        },
        {
          title: "Capacity Expansion Wing B (15 New Assisted Living Beds)",
          description: "Upside revenue and clinical load analysis upon opening newly renovated Wing B.",
          category: "capacity_expansion",
          type: "upside",
          assumptions: [
            { key: "caregiverStaffing", value: 30, unit: "FTE", label: "Expanded Staff Count" },
            { key: "residentCount", value: 87, unit: "residents", label: "Total Residents" },
            { key: "caregiverHourlyRate", value: 24, unit: "$/hr", label: "Average Hourly Rate" },
            { key: "occupancyRate", value: 95, unit: "%", label: "Target Occupancy" },
          ],
          result: {
            staffToResidentRatio: 0.34,
            estimatedMonthlyRevenue: 391500,
            estimatedStaffCost: 124704,
            netOperatingMargin: 266796,
            riskIndex: "Low",
            projectedIncidentRate: 1.5,
          },
          status: "draft",
        },
        {
          title: "Winter Flu & Respiratory Acuity Surge",
          description: "Downside scenario testing 20% staff call-out and elevated resident care plan intensity.",
          category: "care_plan_intensity",
          type: "downside",
          assumptions: [
            { key: "caregiverStaffing", value: 16, unit: "FTE", label: "Available Staff Count" },
            { key: "residentCount", value: 74, unit: "residents", label: "Current Residents" },
            { key: "caregiverHourlyRate", value: 28, unit: "$/hr (overtime)", label: "Blended Hourly Rate" },
            { key: "occupancyRate", value: 88, unit: "%", label: "Target Occupancy" },
          ],
          result: {
            staffToResidentRatio: 0.22,
            estimatedMonthlyRevenue: 333000,
            estimatedStaffCost: 77594,
            netOperatingMargin: 255406,
            riskIndex: "High",
            projectedIncidentRate: 2.3,
          },
          status: "active",
        },
      ];

      for (const sc of scenarioData) {
        const scenario = await Scenario.create({
          organizationId: orgId,
          createdBy: actorId,
          ...sc,
        });

        const v1 = await ScenarioVersion.create({
          organizationId: orgId,
          scenarioId: scenario._id,
          versionNumber: 1,
          createdBy: actorId,
          assumptions: sc.assumptions,
          result: sc.result,
          notes: "Initial seed scenario version",
        });

        scenario.latestVersionId = v1._id;
        await scenario.save();
      }
      console.log("Seeded 3 Scenarios with Versions.");
    }

    // 14. AI Documents (RAG Knowledge Base)
    const existingDocs = await AIDocument.countDocuments({ organizationId: orgId });
    if (existingDocs === 0) {
      const documentsData = [
        {
          title: "Admission Intake & Acuity Assessment Policy 2026",
          description: "Standard operating guidelines for clinical intake, ADL scoring, and level-of-care placement.",
          sourceType: "admission_form",
          content: `SilverCare Admission Policy 2026:
Every incoming resident undergoes a mandatory 72-hour clinical intake assessment conducted by a licensed Registered Nurse.
Scoring determines placement: Level 1 (Independent with meal support), Level 2 (Assisted Living, 1-2 ADL supports), Level 3 (Memory Care with secure perimeter), Level 4 (Skilled Nursing, continuous clinical oversight).
Consent forms must be signed by the designated Power of Attorney or legal guardian prior to room allocation.
All resident allergies, emergency contacts, and active prescriptions must be reconciled in the electronic health record within 24 hours of arrival.`,
        },
        {
          title: "Fall Prevention, Gait Assessment & Safeguarding Protocol",
          description: "Procedures for assessing fall vulnerability, sensor deployment, and post-fall triage.",
          sourceType: "care_assessment",
          content: `SilverCare Fall Prevention Protocol:
All residents with a Morse Fall Scale score over 45 are classified as High Fall Risk.
Mandatory interventions for High Fall Risk residents include: low-bed positioning, non-slip footwear, motion-activated ambient night lighting, and hourly comfort rounds by caregivers.
In the event of a fall: Do NOT move resident if head trauma, neck pain, or visible deformity is suspected. Immediately summon the supervising RN.
A post-fall neurological check must be recorded at 15 minutes, 1 hour, and 4 hours following any unwitnessed slip or fall. An Incident Report must be filed within 2 hours.`,
        },
        {
          title: "Medication Administration & Controlled Substances SOP",
          description: "Procedures for medication charting, double-checking high-risk drugs, and shift handover reconciliation.",
          sourceType: "policy",
          content: `Medication Administration Guidelines:
Medications must be administered within a 60-minute window of the prescribed schedule (30 minutes before to 30 minutes after).
High-alert medications (including insulin, anticoagulants, and controlled narcotics) require a dual-sign-off by two licensed nurses.
If a resident refuses a dose: record the refusal immediately, notify the attending charge nurse, and re-attempt after 20 minutes with a calming approach.
Controlled substance counting must be executed jointly by the off-going and on-coming nurses at each shift change. Any count discrepancy must trigger an immediate freeze and leadership escalation.`,
        },
      ];

      for (const doc of documentsData) {
        const newDoc = await AIDocument.create({
          organizationId: orgId,
          createdBy: actorId,
          title: doc.title,
          description: doc.description,
          sourceType: doc.sourceType,
          content: doc.content,
          status: "active",
        });

        // Create vector chunks
        const lines = doc.content.split("\n").filter(l => l.trim().length > 10);
        const chunkDocs = [];
        for (let idx = 0; idx < lines.length; idx++) {
          const line = lines[idx].trim();
          let embedding;
          try {
            embedding = process.env.GEMINI_API_KEY ? await generateEmbedding(line) : generateMockEmbedding(line);
          } catch {
            embedding = generateMockEmbedding(line);
          }
          chunkDocs.push({
            organizationId: orgId,
            documentId: newDoc._id,
            chunkIndex: idx,
            content: line,
            embedding,
            metadata: { title: newDoc.title, sourceType: newDoc.sourceType },
          });
        }

        await AIChunk.insertMany(chunkDocs);
      }
      console.log("Seeded 3 AI Documents with indexed vector chunks.");
    }

    // 15. Notifications
    const existingNotifications = await Notification.countDocuments({ organizationId: orgId });
    if (existingNotifications === 0) {
      const notifications = [
        {
          organizationId: orgId,
          userId: actorId,
          title: "Fall Incident Alert Filed",
          message: "A medium-severity slip was reported in Wing A by Nurse Rachel Green.",
          type: "alert",
          severity: "high",
          isRead: false,
        },
        {
          organizationId: orgId,
          userId: actorId,
          title: "AI Approval Required: Night Staffing",
          message: "Recommendation for additional caregiver allocation is awaiting executive sign-off.",
          type: "approval_required",
          severity: "medium",
          isRead: false,
        },
        {
          organizationId: orgId,
          userId: actorId,
          title: "Care Plan Review Due: Arthur Pendelton",
          message: "Quarterly multidisciplinary care plan review scheduled for tomorrow.",
          type: "due_date",
          severity: "low",
          isRead: true,
          readAt: new Date(),
        },
      ];
      await Notification.insertMany(notifications);
      console.log("Seeded 3 Notifications.");
    }

    // 16. Audit Log
    const existingAudit = await AuditLog.countDocuments({ organizationId: orgId });
    if (existingAudit === 0) {
      await AuditLog.create({
        organizationId: orgId,
        actorId,
        action: "config_change",
        resourceType: "organization",
        resourceId: orgId,
        metadata: { message: "Initial database seed completed successfully" },
        outcome: "success",
      });
      console.log("Created initial Audit Log record.");
    }

    console.log("\n=======================================================");
    console.log("🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("=======================================================");
    console.log("Demo Accounts (Organization: SilverCare Senior Living):");
    console.log("1. Executive:         executive@silvercare.org   | Password: Password@123");
    console.log("2. Business Analyst:  analyst@silvercare.org     | Password: Password@123");
    console.log("3. Data Steward:      steward@silvercare.org     | Password: Password@123");
    console.log("4. Department Head:   depthead@silvercare.org    | Password: Password@123");
    console.log("=======================================================\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed with error:", err);
    process.exit(1);
  }
};

runSeed();
