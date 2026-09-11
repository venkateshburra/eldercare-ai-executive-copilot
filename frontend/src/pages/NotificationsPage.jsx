// src/pages/NotificationsPage.jsx
import React, { useState, useEffect } from "react";
import api from "../api/client";
import Badge from "../components/common/Badge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import {
  FiCheck,
  FiTrash2,
  FiAlertTriangle,
} from "react-icons/fi";
import toast from "react-hot-toast";

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState("all");

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data?.data || []);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all read");
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success("Notification removed");
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  const filtered = notifications.filter((n) => {
    if (filterSeverity === "all") return true;
    return n.severity === filterSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Governance Notification Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational alerts, fall escalations, and shift handover updates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={markAllRead} className="btn-secondary text-xs">
            <FiCheck className="w-3.5 h-3.5" /> Mark All as Read
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {["all", "critical", "high", "medium", "low"].map((sev) => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors cursor-pointer ${
              filterSeverity === sev
                ? "bg-blue-700 text-white shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Notifications List Card */}
      <div className="card-panel bg-white overflow-hidden shadow-xs">
        {loading ? (
          <LoadingSpinner text="Retrieving operational alerts..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No alerts in this category"
            description="You are caught up with all operational and clinical notices."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <div
                key={item._id}
                className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                  item.isRead ? "bg-white opacity-70" : "bg-blue-50/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-md mt-0.5 ${
                    item.severity === "critical" || item.severity === "high"
                      ? "bg-rose-50 text-rose-600 border border-rose-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}>
                    <FiAlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                      <Badge variant={item.severity === "high" || item.severity === "critical" ? "danger" : "primary"} size="xs">
                        {item.severity}
                      </Badge>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-700" title="Unread" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{item.message}</p>
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="capitalize">Type: {item.type?.replace("_", " ")}</span>
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!item.isRead && (
                    <button
                      onClick={() => markAsRead(item._id)}
                      className="text-xs text-blue-700 font-semibold hover:underline cursor-pointer"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(item._id)}
                    className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    title="Delete Notification"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
