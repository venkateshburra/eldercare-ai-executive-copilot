// src/pages/ReportsAnalyticsPage.jsx
import React, { useState, useEffect } from "react";
import api from "../api/client";
import Badge from "../components/common/Badge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import {
  FiDownload,
  FiSearch,
  FiLock,
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
                      <tr key={row._id || i} className="hover:bg-slate-50/80 transition-colors">
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
                              <Badge variant="primary" size="xs">
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
                              <Badge variant="primary" size="xs">
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
                              <Badge variant={row.status === "resolved" ? "primary" : row.status === "investigating" ? "warning" : "danger"} size="xs">
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
                              <Badge variant="primary" size="xs">Active</Badge>
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
    </div>
  );
};

export default ReportsAnalyticsPage;
