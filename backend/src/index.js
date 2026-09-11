import express from "express";
import dotenv from "dotenv";
dotenv.config();

import helmet from "helmet";
import cors from "cors";
import { rateLimit } from "express-rate-limit";

import dns from "dns";
import connectDB from "./config/db.js";
import logger from "./utils/logger.js";
import errorHandler from "./middleware/errorHandler.middleware.js";

// Routes
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
import aiRoutes from "./routes/ai.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import taskRoutes from "./routes/task.routes.js";
import shiftRoutes from "./routes/shift.routes.js";
import alertRoutes from "./routes/alert.routes.js";
import auditLogRoutes from "./routes/auditLog.routes.js";
import scenarioRoutes from "./routes/scenario.routes.js";
import settingRoutes from "./routes/setting.routes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// DNS
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// ── Security headers ────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173").split(",");
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser tools (curl, Postman) and allowed origins
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// ── Global rate limiter ───────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_GLOBAL || "500"),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later.", code: "RATE_LIMIT_EXCEEDED" },
});
app.use(globalLimiter);

// ── Auth rate limiter ─────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_AUTH || "30"),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many auth requests, please try again later.", code: "RATE_LIMIT_EXCEEDED" },
});

// ── AI rate limiter ───────────────────────────────────────────────────────────
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: parseInt(process.env.RATE_LIMIT_AI || "30"),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "AI rate limit exceeded, please wait.", code: "RATE_LIMIT_EXCEEDED" },
});

// ── Body parsing ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ── DB ─────────────────────────────────────────────────────────────────────────
connectDB();

// ── Health check ───────────────────────────────────────────────────────────────
app.get(["/", "/api/health"], (req, res) => {
  res.json({ success: true, message: "Elder Care Copilot API is running", version: "1.0.0" });
});

// ── API Routes ──────────────────────────────────────────────────────────────────
app.use("/api/organizations", organizationRoutes);
app.use("/api/users",         userRoutes);
app.use("/api/roles",         roleRoutes);
app.use("/api/permissions",   permissionRoutes);
app.use("/api/auth",          authLimiter, authRoutes);
app.use("/api/residents",     residentRoutes);
app.use("/api/family-members", familyMemberRoutes);
app.use("/api/care-plans",    carePlanRoutes);
app.use("/api/medications",   medicationRoutes);
app.use("/api/activities",    activityRoutes);
app.use("/api/incidents",     incidentRoutes);
app.use("/api/staff",         staffRoutes);
app.use("/api/decisions",     decisionRoutes);
app.use("/api/reports",       reportRoutes);
app.use("/api/ai",            aiLimiter, aiRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/tasks",         taskRoutes);
app.use("/api/shifts",        shiftRoutes);
app.use("/api/alerts",        alertRoutes);
app.use("/api/audit-logs",    auditLogRoutes);
app.use("/api/scenarios",     scenarioRoutes);
app.use("/api/settings",      settingRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found", code: "ROUTE_NOT_FOUND" });
});

// ── Global error handler (MUST be last) ──────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
});

export default app;