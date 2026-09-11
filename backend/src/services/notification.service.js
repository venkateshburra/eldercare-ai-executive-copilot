// src/services/notification.service.js
import Notification from "../models/Notification.js";
import logger from "../utils/logger.js";

/**
 * Create a notification for a specific user.
 */
export const createNotification = async ({
  organizationId,
  userId,
  type,
  title,
  message,
  severity = "low",
  metadata = {},
  relatedResourceType = null,
  relatedResourceId = null,
}) => {
  try {
    const notification = await Notification.create({
      organizationId,
      userId,
      type,
      title,
      message,
      severity,
      metadata,
      relatedResourceType,
      relatedResourceId,
    });
    return notification;
  } catch (err) {
    logger.error("Notification creation failed:", err.message);
  }
};

export default createNotification;
