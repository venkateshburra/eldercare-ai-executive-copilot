// src/pages/ReportsAnalyticsPage.jsx
import React, { useState, useEffect } from "react";
import api from "../api/client";
import Badge from "../components/common/Badge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import {
  FiDownload,
  FiSearch,
} from "react-icons/fi";
import toast from "react-hot-toast";

export const ReportsAnalyticsPage = () => {
  const [reportType, setReportType] = useState("residents");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let endpoint = "/residents";
      if (reportType === "staff") endpoint = "/staff";
      if (reportType === "incidents") endpoint = "/incidents";
      if (reportType === "medications") endpoint = "/medications";

      const res = await api.get(endpoint);
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
    return (
      (item.firstName && item.firstName.toLowerCase().includes(term)) ||
      (item.lastName && item.lastName.toLowerCase().includes(term)) ||
      (item.name && item.name.toLowerCase().includes(term)) ||
      (item.title && item.title.toLowerCase().includes(term)) ||
      (item.roomNumber && item.roomNumber.toLowerCase().includes(term))
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

      {/* Tabs Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
          {[
            { id: "residents", label: "Residents Roster" },
            { id: "staff", label: "Staff Directory" },
            { id: "incidents", label: "Incident Log" },
            { id: "medications", label: "Medication Schedule" },
          ].map((tab) => (
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
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider">Designation / Role</th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider">Assigned Wing</th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider">Shift Pattern</th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider">Status</th>
                    </>
                  )}

                  {reportType === "incidents" && (
                    <>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider">Incident Title</th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider">Category</th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider">Severity</th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider">Location</th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wider">Timestamp</th>
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
                          {row.firstName || row.name} {row.lastName || ""}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {row.role || row.designation || "Caregiver"}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {row.wing || "Facility-wide"}
                        </td>
                        <td className="py-3 px-4 text-slate-600 capitalize">
                          {row.shift || "Day Shift (07:00 - 15:00)"}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="primary" size="xs">
                            {row.status || "on-duty"}
                          </Badge>
                        </td>
                      </>
                    )}

                    {reportType === "incidents" && (
                      <>
                        <td className="py-3 px-4 font-bold text-slate-900">{row.title}</td>
                        <td className="py-3 px-4 capitalize text-slate-600">
                          {row.incidentType?.replace("_", " ") || "Fall"}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={row.severity === "high" || row.severity === "critical" ? "danger" : "warning"} size="xs">
                            {row.severity || "medium"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{row.location || "Room 101"}</td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(row.createdAt || Date.now()).toLocaleString()}
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
    </div>
  );
};

export default ReportsAnalyticsPage;
