// src/pages/AuditSettingsPage.jsx
import React, { useState, useEffect } from "react";
import api from "../api/client";
import Badge from "../components/common/Badge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import {
  FiShield,
  FiSliders,
  FiSearch,
  FiSave,
} from "react-icons/fi";
import toast from "react-hot-toast";

export const AuditSettingsPage = () => {
  const [activeTab, setActiveTab] = useState("audit");
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [searchAction, setSearchAction] = useState("");

  // Settings State
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Form Fields for Settings
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.75);
  const [strictCitations, setStrictCitations] = useState(true);
  const [autoApproveLowRisk, setAutoApproveLowRisk] = useState(false);
  const [fallIncidentWarning, setFallIncidentWarning] = useState(3);
  const [slaResponseTimeMinutes, setSlaResponseTimeMinutes] = useState(12);

  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const res = await api.get("/audit-logs?limit=30");
      setAuditLogs(res.data?.data || []);
    } catch {
      toast.error("Failed to fetch audit log trail");
    } finally {
      setLoadingAudit(false);
    }
  };

  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await api.get("/settings");
      const s = res.data?.data || {};
      setSettings(s);
      if (s.aiSettings) {
        setConfidenceThreshold(s.aiSettings.confidenceThreshold || 0.75);
        setStrictCitations(s.aiSettings.strictCitations ?? true);
        setAutoApproveLowRisk(s.aiSettings.autoApproveLowRisk ?? false);
      }
      if (s.alertThresholds) {
        setFallIncidentWarning(s.alertThresholds.fallIncidentWarning || 3);
        setSlaResponseTimeMinutes(s.alertThresholds.slaResponseTimeMinutes || 12);
      }
    } catch {
      toast.error("Failed to load governance settings");
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    if (activeTab === "audit") {
      fetchAuditLogs();
    } else {
      fetchSettings();
    }
  }, [activeTab]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.patch("/settings", {
        aiSettings: {
          confidenceThreshold: Number(confidenceThreshold),
          strictCitations: Boolean(strictCitations),
          autoApproveLowRisk: Boolean(autoApproveLowRisk),
        },
        alertThresholds: {
          fallIncidentWarning: Number(fallIncidentWarning),
          slaResponseTimeMinutes: Number(slaResponseTimeMinutes),
        },
      });
      toast.success("Governance parameters saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (!searchAction.trim()) return true;
    const term = searchAction.toLowerCase();
    return (
      (log.action && log.action.toLowerCase().includes(term)) ||
      (log.resourceType && log.resourceType.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Compliance Audit Trail & Governance Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable operation history and AI clinical threshold management
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200 self-start">
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "audit"
                ? "bg-white text-blue-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Audit Logs
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "settings"
                ? "bg-white text-blue-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Governance Settings
          </button>
        </div>
      </div>

      {activeTab === "audit" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                type="text"
                value={searchAction}
                onChange={(e) => setSearchAction(e.target.value)}
                placeholder="Search action or resource..."
                className="form-input pl-8 py-1.5 text-xs"
              />
            </div>
            <button onClick={fetchAuditLogs} className="btn-secondary text-xs">
              Refresh Trail
            </button>
          </div>

          <div className="card-panel bg-white overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Immutable Audit Ledger</h3>
                <p className="text-xs text-slate-500">Append-only compliance log with IP and actor traceability</p>
              </div>
              <Badge variant="primary" size="xs">
                {auditLogs.length} Events Logged
              </Badge>
            </div>

            {loadingAudit ? (
              <LoadingSpinner text="Retrieving compliance audit records..." />
            ) : filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No audit entries match query.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider">Timestamp</th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider">Action Executed</th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider">Resource</th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider">Actor ID</th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-slate-600">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 capitalize text-slate-600 font-medium">
                          {log.resourceType}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {log.actorId ? String(log.actorId).slice(-8) : "System"}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {log.ipAddress || "127.0.0.1"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Settings Tab */
        <div className="card-panel p-6 bg-white shadow-xs max-w-3xl">
          <div className="pb-4 border-b border-slate-200 mb-6">
            <h3 className="text-base font-bold text-slate-900">Governance Parameters</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure system safeguards, confidence cutoffs, and regulatory thresholds.
            </p>
          </div>

          {loadingSettings ? (
            <LoadingSpinner text="Loading current settings..." />
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* AI Policy Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FiShield className="w-4 h-4 text-blue-700" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    AI Decision & Citation Governance
                  </h4>
                </div>

                <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="font-semibold text-slate-700">
                        Minimum RAG Confidence Threshold
                      </span>
                      <span className="text-blue-700 font-bold">
                        {Math.round(confidenceThreshold * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="0.95"
                      step="0.05"
                      value={confidenceThreshold}
                      onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-700"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Answers below this threshold automatically trigger insufficient-evidence notices.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Strict Source Attribution</p>
                      <p className="text-[11px] text-slate-500">Require citation cards for all clinical recommendations.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={strictCitations}
                      onChange={(e) => setStrictCitations(e.target.checked)}
                      className="rounded border-slate-300 text-blue-700 focus:ring-blue-600 w-4 h-4"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Auto-Approve Low-Risk Tasks</p>
                      <p className="text-[11px] text-slate-500">Bypasses human review on non-clinical administrative tasks.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoApproveLowRisk}
                      onChange={(e) => setAutoApproveLowRisk(e.target.checked)}
                      className="rounded border-slate-300 text-blue-700 focus:ring-blue-600 w-4 h-4"
                    />
                  </div>
                </div>
              </div>

              {/* Operational Alert Thresholds */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FiSliders className="w-4 h-4 text-blue-700" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Clinical Alert Thresholds
                  </h4>
                </div>

                <div className="p-4 rounded-md bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Fall Incident Escalation Count
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={fallIncidentWarning}
                      onChange={(e) => setFallIncidentWarning(Number(e.target.value))}
                      className="form-input text-xs"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Triggers facility-wide wing alert if exceeded.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Incident Response SLA (Minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={slaResponseTimeMinutes}
                      onChange={(e) => setSlaResponseTimeMinutes(Number(e.target.value))}
                      className="form-input text-xs"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Maximum allowed elapsed time before escalation.</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="btn-primary text-xs font-semibold"
                >
                  <FiSave className="w-4 h-4" />
                  {savingSettings ? "Saving..." : "Save Governance Configuration"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditSettingsPage;
