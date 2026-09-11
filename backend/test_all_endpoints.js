// test_all_endpoints.js
// Automated verification of all primary endpoints from Auth to Reports
import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const BASE_URL = "http://localhost:5000";

const runTests = async () => {
  console.log("==================================================");
  console.log("🧪 STARTING COMPREHENSIVE END-TO-END API TESTS");
  console.log("==================================================\n");

  const results = [];
  let token = "";
  let residentId = "";
  let scenarioId = "";
  let decisionId = "";

  const testRequest = async (name, url, method, body = null, useAuth = true) => {
    const headers = { "Content-Type": "application/json" };
    if (useAuth && token) headers["Authorization"] = `Bearer ${token}`;

    const t0 = Date.now();
    try {
      const options = { method, headers };
      if (body) options.body = JSON.stringify(body);

      const res = await fetch(url, options);
      const json = await res.json().catch(() => ({}));
      const latency = Date.now() - t0;

      const passed = res.status >= 200 && res.status < 300;
      results.push({ name, method, url, status: res.status, passed, latency });

      if (passed) {
        console.log(`✅ [${res.status}] ${method} ${url} (${latency}ms)`);
      } else {
        console.log(`❌ [${res.status}] ${method} ${url}: ${json.message || "Failed"}`);
      }
      return { res, json };
    } catch (err) {
      console.log(`❌ [ERR] ${method} ${url}: ${err.message}`);
      results.push({ name, method, url, status: 500, passed: false, error: err.message });
      return { res: { status: 500 }, json: {} };
    }
  };

  // 1. Health
  await testRequest("Health Check", `${BASE_URL}/`, "GET", null, false);

  // 2. Auth Login
  const loginRes = await testRequest("Login", `${BASE_URL}/api/auth/login`, "POST", {
    email: "executive@silvercare.org",
    password: "Password@123",
  }, false);

  token = loginRes.json?.token;
  if (!token) {
    console.error("❌ Fatal: Could not get login token. Halting test.");
    process.exit(1);
  }

  // 3. Current User Profile
  await testRequest("Get Me", `${BASE_URL}/api/auth/me`, "GET");

  // 4. Residents
  const resList = await testRequest("List Residents", `${BASE_URL}/api/residents?limit=5`, "GET");
  residentId = resList.json?.data?.[0]?._id;

  const createResidentRes = await testRequest("Create Resident", `${BASE_URL}/api/residents`, "POST", {
    firstName: "Florence",
    lastName: "Nightingale",
    dateOfBirth: "1940-05-12",
    gender: "female",
    roomNumber: "305-B",
    admissionDate: "2024-06-01",
    notes: "Requires assistance with evening medication",
  });
  if (createResidentRes.json?.data?._id) {
    residentId = createResidentRes.json.data._id;
  }

  if (residentId) {
    await testRequest("Get Resident by ID", `${BASE_URL}/api/residents/${residentId}`, "GET");
    await testRequest("Update Resident", `${BASE_URL}/api/residents/${residentId}`, "PATCH", {
      notes: "Updated care preference: likes afternoon herbal tea",
    });
  }

  // 5. Staff
  await testRequest("List Staff", `${BASE_URL}/api/staff`, "GET");

  // 6. Care Plans
  await testRequest("List Care Plans", `${BASE_URL}/api/care-plans`, "GET");
  if (residentId) {
    await testRequest("Create Care Plan", `${BASE_URL}/api/care-plans`, "POST", {
      residentId,
      title: "Comprehensive Fall Reduction Protocol",
      description: "Hourly comfort rounds and low bed protocol",
      goals: ["Maintain zero unwitnessed falls", "Ensure walker is bedside"],
      startDate: "2024-06-02",
    });
  }

  // 7. Medications
  await testRequest("List Medications", `${BASE_URL}/api/medications`, "GET");
  if (residentId) {
    await testRequest("Create Medication", `${BASE_URL}/api/medications`, "POST", {
      residentId,
      name: "Metoprolol Succinate",
      dosage: "25mg",
      frequency: "Once daily in the morning",
      route: "Oral",
      startDate: "2024-06-02",
    });
  }

  // 8. Activities
  await testRequest("List Activities", `${BASE_URL}/api/activities`, "GET");
  if (residentId) {
    await testRequest("Create Activity", `${BASE_URL}/api/activities`, "POST", {
      residentId,
      name: "Garden Sensory Walk",
      type: "recreation",
      description: "Supervised gentle walk in the sensory courtyard",
      scheduledDate: new Date(Date.now() + 86400000).toISOString(),
      duration: 30,
    });
  }

  // 9. Incidents
  await testRequest("List Incidents", `${BASE_URL}/api/incidents`, "GET");
  if (residentId) {
    await testRequest("Report Incident", `${BASE_URL}/api/incidents`, "POST", {
      residentId,
      type: "Environmental Slip",
      severity: "low",
      description: "Water spill near hallway dispenser noticed and cleaned immediately.",
      incidentDate: new Date().toISOString(),
      location: "Wing B Hallway",
      actionTaken: "Wet floor signs posted; spill wiped; resident safe.",
    });
  }

  // 10. Decisions
  const decList = await testRequest("List Decisions", `${BASE_URL}/api/decisions`, "GET");
  decisionId = decList.json?.data?.[0]?._id;

  const createDecRes = await testRequest("Create Decision", `${BASE_URL}/api/decisions`, "POST", {
    title: "Pilot Adaptive Lighting in Memory Care Corridors",
    description: "Install circadian rhythm smart lighting to reduce sundowning agitation.",
    decisionType: "operations",
    priority: "medium",
    rationale: "Evidence indicates 28% reduction in sundowning anxiety with warm amber evening lighting.",
  });
  if (createDecRes.json?.data?._id) decisionId = createDecRes.json.data._id;

  if (decisionId) {
    await testRequest("Get Decision by ID", `${BASE_URL}/api/decisions/${decisionId}`, "GET");
    await testRequest("Approve Decision", `${BASE_URL}/api/decisions/${decisionId}/approve`, "PATCH", {
      reason: "Approved based on clinical advisory review.",
      outcome: "Budget allocated for 10-fixture corridor pilot.",
    });
  }

  // 11. Scenarios
  const scenList = await testRequest("List Scenarios", `${BASE_URL}/api/scenarios`, "GET");
  scenarioId = scenList.json?.data?.[0]?._id;

  const createScenRes = await testRequest("Create Scenario", `${BASE_URL}/api/scenarios`, "POST", {
    title: "Weekend Nurse Float Coverage Model",
    description: "Assessing overtime reduction by introducing weekend staggered 10-hour nurse shifts.",
    category: "caregiver_scheduling",
    type: "base",
    assumptions: [
      { key: "caregiverStaffing", value: 26, unit: "FTE", label: "Caregiver Count" },
      { key: "residentCount", value: 75, unit: "residents", label: "Resident Count" },
      { key: "caregiverHourlyRate", value: 24, unit: "$/hr", label: "Hourly Rate" },
      { key: "occupancyRate", value: 92, unit: "%", label: "Occupancy Rate" },
    ],
  });
  if (createScenRes.json?.data?._id) scenarioId = createScenRes.json.data._id;

  if (scenarioId) {
    await testRequest("Get Scenario by ID", `${BASE_URL}/api/scenarios/${scenarioId}`, "GET");
    await testRequest("Create Scenario Version", `${BASE_URL}/api/scenarios/${scenarioId}/versions`, "POST", {
      assumptions: [
        { key: "caregiverStaffing", value: 28, unit: "FTE", label: "Caregiver Count (Adjusted)" },
        { key: "residentCount", value: 78, unit: "residents", label: "Resident Count (Adjusted)" },
        { key: "caregiverHourlyRate", value: 24.5, unit: "$/hr", label: "Hourly Rate" },
      ],
      notes: "Revised for expected late summer intake wave.",
    });
  }

  // 12. Settings
  await testRequest("Get System Settings", `${BASE_URL}/api/settings`, "GET");
  await testRequest("Update System Settings", `${BASE_URL}/api/settings`, "PATCH", {
    aiSettings: {
      confidenceThreshold: 0.78,
      strictCitations: true,
      autoApproveLowRisk: false,
    },
  });

  // 13. Reports
  await testRequest("Dashboard Summary", `${BASE_URL}/api/reports/dashboard`, "GET");
  await testRequest("Resident Analytics", `${BASE_URL}/api/reports/residents`, "GET");
  await testRequest("Incident Analytics", `${BASE_URL}/api/reports/incidents`, "GET");
  await testRequest("Medication Analytics", `${BASE_URL}/api/reports/medications`, "GET");

  // 14. Notifications
  await testRequest("List Notifications", `${BASE_URL}/api/notifications`, "GET");
  await testRequest("Get Unread Notification Count", `${BASE_URL}/api/notifications/unread-count`, "GET");

  // 15. Audit Logs
  await testRequest("Get Audit Logs", `${BASE_URL}/api/audit-logs?limit=5`, "GET");

  // 16. AI Documents
  await testRequest("List AI Knowledge Documents", `${BASE_URL}/api/ai/documents`, "GET");
  await testRequest("Get AI Run History", `${BASE_URL}/api/ai/runs?limit=5`, "GET");
  await testRequest("Get AI Approvals", `${BASE_URL}/api/ai/approvals`, "GET");

  console.log("\n==================================================");
  const passCount = results.filter(r => r.passed).length;
  console.log(`📊 SUMMARY: ${passCount} / ${results.length} ENDPOINTS PASSED SUCCESSFULLY!`);
  console.log("==================================================\n");
};

runTests();
