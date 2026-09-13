// src/pages/ReportsAnalyticsPage.jsx
import React, { useState, useEffect } from "react";
import api from "../api/client";
import Badge from "../components/common/Badge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import {
  FiDownload,
  FiSearch,
  FiLock,
  FiX,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

// Each tab mapped to the permission required to view it
const ALL_TABS = [
  { id: "residents",   label: "Residents Roster",    permission: "residents.view" },
  { id: "staff",       label: "Staff Directory",      permission: "staff.view" },
  { id: "incidents",   label: "Incident Log",         permission: "incidents.view" },
  { id: "medications", label: "Medication Schedule",  permission: "medications.view" },
];

export const ReportsAnalyticsPage = () => {
  const { hasPermission } = useAuth();

  // Only expose tabs the current user is allowed to see
  const visibleTabs = ALL_TABS.filter((t) => hasPermission(t.permission));

  const [reportType, setReportType] = useState(() => visibleTabs[0]?.id || "residents");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  // If permissions change and the active tab is no longer visible, reset to first allowed tab
  useEffect(() => {
    if (!visibleTabs.find((t) => t.id === reportType)) {
      setReportType(visibleTabs[0]?.id || "residents");
    }
  }, [visibleTabs.map((t) => t.id).join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReportData = async () => {
    // Don't fetch if the user has no permission for this tab
    if (!hasPermission(ALL_TABS.find((t) => t.id === reportType)?.permission)) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const endpointMap = {
        residents:   "/residents",
        staff:       "/staff",
        incidents:   "/incidents",
        medications: "/medications",
      };
      const res = await api.get(endpointMap[reportType]);
      setData(res.data?.data || []);
    } catch {
      toast.error(`Failed to load ${reportType} report data`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [reportType]);

  const statusConfig = {
    residents: { permission: "residents.manage", endpoint: "/residents", options: ["active", "inactive", "discharged"] },
    staff: { permission: "staff.manage", endpoint: "/staff", options: ["active", "inactive", "on_leave"] },
    incidents: { permission: "incidents.manage", endpoint: "/incidents", options: ["open", "investigating", "resolved"] },
    medications: { permission: "medications.manage", endpoint: "/medications", options: ["active", "completed", "discontinued"] },
  };

  const statusVariant = (status) => {
    if (status === "inactive") return "danger";
    if (["on_leave", "discharged", "discontinued", "completed"].includes(status)) return "default";
    if (["investigating"].includes(status)) return "warning";
    if (["resolved", "active"].includes(status)) return "primary";
    if (["open"].includes(status)) return "danger";
    return "default";
  };

  const openRecordDetails = (record) => {
    setSelectedRecord({ type: reportType, record });
    setSelectedStatus(record.status || "");
  };

  const handleStatusUpdate = async (event) => {
    event.preventDefault();
    if (!selectedRecord || !selectedStatus) return;

    const config = statusConfig[selectedRecord.type];
    setSavingStatus(true);
    try {
      await api.patch(`${config.endpoint}/${selectedRecord.record._id}`, { status: selectedStatus });
      setData((currentData) => currentData.map((item) => (
        item._id === selectedRecord.record._id ? { ...item, status: selectedStatus } : item
      )));
      toast.success("Status updated successfully");
      setSelectedRecord(null);
      setSelectedStatus("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setSavingStatus(false);
    }
  };

  const handleExportCSV = () => {
    if (!data.length) {
      toast.error("No data available to export");
      return;
    }

    try {
      const headers = Object.keys(data[0]).filter((k) => typeof data[0][k] !== "object");
      const csvRows = [];
      csvRows.push(headers.join(","));

      for (const row of data) {
        const values = headers.map((h) => {
          const val = row[h] === null || row[h] === undefined ? "" : String(row[h]);
          return `"${val.replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(","));
      }

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `silvercare_${reportType}_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`${reportType.toUpperCase()} report exported as CSV`);
    } catch {
      toast.error("Failed to generate CSV export");
    }
  };

  const filteredData = data.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const residentName = item.residentId
      ? `${item.residentId.firstName || ""} ${item.residentId.lastName || ""}`
      : "";
    const staffName = item.userId
      ? `${item.userId.firstName || ""} ${item.userId.lastName || ""}`
      : "";
    return (
      (item.firstName && item.firstName.toLowerCase().includes(term)) ||
      (item.lastName && item.lastName.toLowerCase().includes(term)) ||
      (item.name && item.name.toLowerCase().includes(term)) ||
      (item.title && item.title.toLowerCase().includes(term)) ||
      (item.roomNumber && item.roomNumber.toLowerCase().includes(term)) ||
      (item.employeeId && item.employeeId.toLowerCase().includes(term)) ||
      (item.department && item.department.toLowerCase().includes(term)) ||
      (item.position && item.position.toLowerCase().includes(term)) ||
      (item.phone && item.phone.toLowerCase().includes(term)) ||
      (item.type && item.type.toLowerCase().includes(term)) ||
      (item.description && item.description.toLowerCase().includes(term)) ||
      (item.location && item.location.toLowerCase().includes(term)) ||
      (item.status && item.status.toLowerCase().includes(term)) ||
      residentName.toLowerCase().includes(term) ||
      staffName.toLowerCase().includes(term) ||
      (item.userId?.email && item.userId.email.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Operational Reports & Export Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-ready data tables for state inspection compliance and executive analytics
          </p>
        </div>

        <button onClick={handleExportCSV} className="btn-primary self-start">
          <FiDownload className="w-4 h-4" /> Export View to CSV
        </button>
      </div>

      {/* No accessible tabs at all */}
      {visibleTabs.length === 0 ? (
        <div className="card-panel bg-white p-10 flex flex-col items-center gap-3 text-center">
          <FiLock className="w-8 h-8 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">Access Restricted</p>
          <p className="text-xs text-slate-400">
            You don't have permission to view any report sections. Contact your administrator.
          </p>
        </div>
      ) : (
        <>
          {/* Tabs Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setReportType(tab.id);
                    setSearchTerm("");
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    reportType === tab.id
                      ? "bg-white text-blue-700 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Filter ${reportType}...`}
                className="form-input pl-8 py-1.5 text-xs"
              />
            </div>
          </div>

          {/* Table Card */}
          <div className="card-panel bg-white overflow-hidden shadow-xs">
            {loading ? (
              <LoadingSpinner text={`Retrieving ${reportType} records...`} />
            ) : filteredData.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No matching records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <tr>
                      {reportType === "residents" && (
                        <>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider">Resident Name</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider">Age / Gender</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider">Room / Wing</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider">Care Level</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider">Fall Risk</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider">Status</th>
                        </>
                      )}

                      {reportType === "staff" && (
                        <>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider">Staff Member</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider">Employee ID</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider">Position / Department</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider">Contact</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider">Status</th>
                        </>
                      )}

                      {reportType === "incidents" && (
                        <>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider">Type / Description</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider">Resident</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider">Severity</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider">Location</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider">Incident Date / Status</th>
                        </>
                      )}

                      {reportType === "medications" && (
                        <>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider">Medication Name</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider">Dosage</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider">Schedule</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider">Controlled</th>
                          <th className="py-3 px-4 font-semibold uppercase tracking-wider">Status</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredData.map((row, i) => (
                      <tr
                        key={row._id || i}
                        onClick={() => openRecordDetails(row)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") openRecordDetails(row);
                        }}
                        tabIndex={0}
                        className="hover:bg-slate-50/80 focus:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-300 transition-colors cursor-pointer"
                        title="Open record details"
                      >
                        {reportType === "residents" && (
                          <>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {row.firstName} {row.lastName}
                            </td>
                            <td className="py-3 px-4 text-slate-600 capitalize">
                              {row.age || "—"} yrs • {row.gender || "—"}
                            </td>
                            <td className="py-3 px-4 text-slate-700">
                              Room {row.roomNumber || "—"} ({row.wing || "General"})
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              Level {row.careLevel || 2}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={row.fallRisk === "high" ? "danger" : row.fallRisk === "medium" ? "warning" : "primary"} size="xs">
                                {row.fallRisk || "low"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={statusVariant(row.status || "active")} size="xs">
                                {row.status || "active"}
                              </Badge>
                            </td>
                          </>
                        )}

                        {reportType === "staff" && (
                          <>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              <div>{row.userId?.firstName || "—"} {row.userId?.lastName || ""}</div>
                              <div className="mt-0.5 font-normal text-slate-500">{row.userId?.email || "—"}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-700">
                              {row.employeeId || "—"}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              <div>{row.position || "—"}</div>
                              <div className="text-slate-500">{row.department || "—"}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {row.phone || "—"}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={statusVariant(row.status || row.userId?.status)} size="xs">
                                {row.status || row.userId?.status || "—"}
                              </Badge>
                            </td>
                          </>
                        )}

                        {reportType === "incidents" && (
                          <>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              <div>{row.type || "Incident"}</div>
                              <div className="mt-0.5 max-w-sm truncate font-normal text-slate-500" title={row.description}>
                                {row.description || "—"}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-700">
                              {row.residentId ? (
                                <>
                                  <div>{row.residentId.firstName} {row.residentId.lastName}</div>
                                  <div className="text-slate-500">Room {row.residentId.roomNumber || "—"}</div>
                                </>
                              ) : "—"}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={row.severity === "high" || row.severity === "critical" ? "danger" : row.severity === "medium" ? "warning" : "primary"} size="xs">
                                {row.severity || "—"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-slate-700">
                              <div>{row.location || "—"}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              <div>{row.incidentDate ? new Date(row.incidentDate).toLocaleString() : "—"}</div>
                              <Badge variant={statusVariant(row.status)} size="xs">
                                {row.status || "—"}
                              </Badge>
                            </td>
                          </>
                        )}

                        {reportType === "medications" && (
                          <>
                            <td className="py-3 px-4 font-bold text-slate-900">{row.name}</td>
                            <td className="py-3 px-4 text-slate-700">{row.dosage || "10mg"}</td>
                            <td className="py-3 px-4 text-slate-600">{row.frequency || "Once Daily"}</td>
                            <td className="py-3 px-4">
                              <Badge variant={row.isControlled ? "danger" : "default"} size="xs">
                                {row.isControlled ? "Controlled (Dual Sign-off)" : "Standard"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={statusVariant(row.status)} size="xs">
                                {row.status || "—"}
                              </Badge>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {selectedRecord && (() => {
        const { type, record } = selectedRecord;
        const config = statusConfig[type];
        const canManage = hasPermission(config.permission);
        const recordName = type === "residents"
          ? `${record.firstName || ""} ${record.lastName || ""}`.trim()
          : type === "staff"
            ? `${record.userId?.firstName || ""} ${record.userId?.lastName || ""}`.trim()
            : type === "incidents"
              ? record.type || "Incident"
              : record.name || record.medicationName || "Medication";

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
            <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-lg w-full shadow-xl">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-blue-700">{type} details</p>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{recordName || "Record details"}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                  aria-label="Close record details"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-5">
                {Object.entries(record)
                  .filter(([key, value]) => !["_id", "__v", "organizationId", "createdBy", "updatedAt"].includes(key) && typeof value !== "object")
                  .map(([key, value]) => (
                    <div key={key} className="border-b border-slate-100 pb-2">
                      <dt className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, " $1")}</dt>
                      <dd className="mt-0.5 text-slate-700 wrap-break-word">{String(value || "—")}</dd>
                    </div>
                  ))}
              </div>

              {canManage ? (
                <form onSubmit={handleStatusUpdate} className="border-t border-slate-200 pt-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="record-status">
                    Change status
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      id="record-status"
                      value={selectedStatus}
                      onChange={(event) => setSelectedStatus(event.target.value)}
                      className="form-input text-xs"
                    >
                      {config.options.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <button type="submit" disabled={savingStatus || selectedStatus === record.status} className="btn-primary text-xs">
                      {savingStatus ? "Saving..." : "Save Status"}
                    </button>
                  </div>
                </form>
              ) : (
                <p className="border-t border-slate-200 pt-4 text-xs text-slate-500">You have read-only access to this record.</p>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ReportsAnalyticsPage;
