// src/services/audit.service.js
import AuditLog from "../models/AuditLog.js";
import logger from "../utils/logger.js";

/**
 * Create an audit log entry.
 *
 * @param {Object} params
 * @param {string}   params.organizationId
 * @param {string}   [params.actorId]       - User ID (null for system events)
 * @param {string}   params.action          - One of the AuditLog action enum values
 * @param {string}   params.resourceType    - e.g. "resident", "user", "aiRun"
 * @param {string}   [params.resourceId]
 * @param {Object}   [params.metadata]      - Any extra data to store
 * @param {Object}   [params.req]           - Express request (for IP / UA extraction)
 * @param {string}   [params.outcome]       - "success" | "failure"
 */
export const createAuditLog = async ({
  organizationId,
  actorId = null,
  action,
  resourceType,
  resourceId = null,
  metadata = {},
  req = null,
  outcome = "success",
}) => {
  try {
    const ipAddress = req
      ? (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "")
      : "";
    const userAgent = req ? (req.headers["user-agent"] || "") : "";

    await AuditLog.create({
      organizationId,
      actorId,
      action,
      resourceType,
      resourceId,
      metadata,
      ipAddress,
      userAgent,
      outcome,
    });
  } catch (err) {
    // Never let audit failures break business logic
    logger.error("Audit log creation failed:", err.message);
  }
};

export default createAuditLog;
