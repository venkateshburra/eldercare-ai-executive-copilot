import express from "express";
import dotenv from "dotenv";
import dns from "dns";
import connectDB from "./config/db.js";
import organizationRoutes from "./routes/organization.routes.js";
import userRoutes from "./routes/user.routes.js";
import roleRoutes from "./routes/role.routes.js";
import permissionRoutes from "./routes/permission.routes.js";
import authRoutes from "./routes/auth.routes.js";
import residentRoutes from "./routes/resident.routes.js";
import familyMemberRoutes from "./routes/familyMember.routes.js";
import carePlanRoutes from "./routes/carePlan.routes.js";
import medicationRoutes from "./routes/medication.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import incidentRoutes from "./routes/incident.routes.js";
import staffRoutes from "./routes/staff.routes.js";
import decisionRoutes from "./routes/decision.routes.js";
import reportRoutes from "./routes/report.routes.js";



dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

dns.setServers(["8.8.8.8", "8.8.4.4"]);

app.use(express.json());

connectDB();

app.use("/api/organizations", organizationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/residents", residentRoutes);
app.use("/api/family-members", familyMemberRoutes);
app.use("/api/care-plans", carePlanRoutes);
app.use("/api/medications", medicationRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/decisions", decisionRoutes);
app.use("/api/reports", reportRoutes);


app.get("/", (req, res) => {
  res.json({
    message: "Elder Care Copilot API is running",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});