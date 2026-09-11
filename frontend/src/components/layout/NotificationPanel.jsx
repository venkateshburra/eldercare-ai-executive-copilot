// src/components/layout/NotificationPanel.jsx
import React, { useEffect, useState } from "react";
import { FiX, FiCheck, FiBell } from "react-icons/fi";
import api from "../../api/client";
import Badge from "../common/Badge";
import LoadingSpinner from "../common/LoadingSpinner";
import toast from "react-hot-toast";

export const NotificationPanel = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/notifications");
      setNotifications(res.data?.data || []);
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      toast.error("Failed to mark notification as read");
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  if (!isOpen) return null;

  const severityVariant = (sev) => {
    switch (sev) {
      case "critical":
      case "high":
        return "danger";
      case "medium":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className="relative w-full max-w-md bg-white border-l border-slate-200 shadow-xl flex flex-col h-full z-10">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <FiBell className="w-5 h-5 text-blue-700" />
            <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
            <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
              {notifications.filter(n => !n.isRead).length} unread
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              className="text-xs text-blue-700 hover:text-blue-800 flex items-center gap-1 font-medium px-2 py-1 rounded cursor-pointer"
              title="Mark all as read"
            >
              <FiCheck className="w-3.5 h-3.5" />
              Mark all
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
          {loading ? (
            <LoadingSpinner text="Fetching notifications..." />
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No notifications at this time.
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item._id}
                className={`p-3 rounded-md border transition-all ${
                  item.isRead
                    ? "bg-slate-50 border-slate-200 opacity-75"
                    : "bg-white border-blue-200 shadow-2xs"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900">{item.title}</span>
                    <Badge variant={severityVariant(item.severity)} size="xs">
                      {item.severity}
                    </Badge>
                  </div>
                  {!item.isRead && (
                    <button
                      onClick={() => markAsRead(item._id)}
                      className="text-[11px] text-blue-700 font-semibold hover:underline cursor-pointer"
                    >
                      Mark read
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-600 mb-2 leading-relaxed">{item.message}</p>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="capitalize">{item.type.replace("_", " ")}</span>
                  <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
