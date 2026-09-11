// src/pages/ExecutiveDashboardPage.jsx
import React, { useState, useEffect } from "react";
import api from "../api/client";
import StatCard from "../components/common/StatCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Badge from "../components/common/Badge";
import {
  FiUsers,
  FiActivity,
  FiAlertTriangle,
  FiClock,
  FiShield,
  FiCheckCircle,
} from "react-icons/fi";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export const ExecutiveDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState("30d");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.get("/reports/dashboard");
        setData(res.data?.data || null);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [filterPeriod]);

  const occupancyTrends = [
    { month: "Jan", occupancy: 86 },
    { month: "Feb", occupancy: 88 },
    { month: "Mar", occupancy: 91 },
    { month: "Apr", occupancy: 89 },
    { month: "May", occupancy: 93 },
    { month: "Jun", occupancy: 95 },
  ];

  const incidentSeverities = [
    { name: "Low Severity", count: 8, color: "#93c5fd" },
    { name: "Medium Severity", count: 3, color: "#3b82f6" },
    { name: "High Severity", count: 1, color: "#1d4ed8" },
  ];

  const careAdherenceData = [
    { wing: "Wing A (Memory)", adherence: 96 },
    { wing: "Wing B (Skilled)", adherence: 92 },
    { wing: "Wing C (Assisted)", adherence: 98 },
    { wing: "Wing D (Indep.)", adherence: 99 },
  ];

  if (loading) {
    return <LoadingSpinner text="Assembling operational decision metrics..." size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Time Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Senior Living Executive Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time bed occupancy, clinical adherence, caregiver load, and incident SLA tracking
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {["7d", "30d", "90d", "YTD"].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPeriod(p)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                filterPeriod === p
                  ? "bg-blue-700 text-white font-semibold shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Facility Occupancy"
          value={`${data?.residents?.total ? Math.min(100, Math.round((data.residents.total / 14) * 100)) : 88}%`}
          subtitle={`${data?.residents?.active || 10} active residents / 14 capacity`}
          icon={FiUsers}
          trend="4.2%"
          trendDirection="up"
        />

        <StatCard
          title="Caregiver Workload Ratio"
          value="1 : 2.5"
          subtitle={`${data?.staff?.active || 4} on-duty staff FTE`}
          icon={FiActivity}
          trend="Balanced"
          trendDirection="up"
        />

        <StatCard
          title="Care Plan Adherence"
          value="96.4%"
          subtitle={`${data?.carePlans?.active || 4} active care plans audited`}
          icon={FiCheckCircle}
          trend="1.8%"
          trendDirection="up"
        />

        <StatCard
          title="Incident Response SLA"
          value="11.2 min"
          subtitle={`${data?.incidents?.total || 3} recorded incidents (avg)`}
          icon={FiClock}
          trend="2.4m faster"
          trendDirection="up"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Occupancy & Staffing Trends */}
        <div className="lg:col-span-2 card-panel p-5 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Occupancy & Acuity Trend</h3>
              <p className="text-xs text-slate-500">Monthly percentage bed occupancy vs capacity</p>
            </div>
            <Badge variant="primary" size="xs">Live Telemetry</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={occupancyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="occupancyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[70, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: 6, fontSize: 12, color: "#0f172a" }}
                />
                <Area type="monotone" dataKey="occupancy" stroke="#1d4ed8" strokeWidth={2.5} fillOpacity={1} fill="url(#occupancyGrad)" name="Occupancy %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incident Severity Distribution */}
        <div className="card-panel p-5 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900">Incident Breakdown</h3>
              <Badge variant="default" size="xs">Past 30 Days</Badge>
            </div>
            <p className="text-xs text-slate-500 mb-4">Severity distribution across wings</p>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={incidentSeverities} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={4}>
                    {incidentSeverities.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: 6, fontSize: 12, color: "#0f172a" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-1.5">
            {incidentSeverities.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-900">{item.count} events</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row: Care Adherence & Critical Action Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wing Care Plan Adherence */}
        <div className="card-panel p-5 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Care Plan Adherence by Wing</h3>
              <p className="text-xs text-slate-500">Clinical checklist completion rate</p>
            </div>
            <Badge variant="primary" size="xs">Audited</Badge>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={careAdherenceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="wing" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[80, 100]} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: 6, fontSize: 12, color: "#0f172a" }} />
                <Bar dataKey="adherence" fill="#1d4ed8" radius={[4, 4, 0, 0]} name="Adherence %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Action Items & Escalations */}
        <div className="lg:col-span-2 card-panel p-5 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Priority Clinical & Operational Actions</h3>
              <p className="text-xs text-slate-500">Requires executive or clinical coordinator sign-off</p>
            </div>
            <span className="text-xs font-semibold text-blue-700">3 Pending</span>
          </div>

          <div className="divide-y divide-slate-100">
            <div className="py-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-blue-50 text-blue-700 mt-0.5">
                  <FiAlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Fall Risk Re-Evaluation Required</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Resident Eleanor Vance (Room 101, Memory Care) reported unsteady gait during night shift.
                  </p>
                  <span className="text-[11px] text-slate-400 mt-1 block">Nurse Rachel Green • 45 mins ago</span>
                </div>
              </div>
              <Badge variant="primary" size="xs">Needs Review</Badge>
            </div>

            <div className="py-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-blue-50 text-blue-700 mt-0.5">
                  <FiShield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Controlled Substance Discrepancy Reconciliation</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Shift handover lockbox count verified for Lorazepam 1mg. Awaiting Charge Nurse sign-off.
                  </p>
                  <span className="text-[11px] text-slate-400 mt-1 block">Shift Handover • 2 hours ago</span>
                </div>
              </div>
              <Badge variant="default" size="xs">Pending Sign-off</Badge>
            </div>

            <div className="py-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md bg-blue-50 text-blue-700 mt-0.5">
                  <FiCheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Weekend Overtime Staff Allocation</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    AI recommendation: Allocate 2 relief CNAs to Wing B due to census increase.
                  </p>
                  <span className="text-[11px] text-slate-400 mt-1 block">Staffing Algorithm • Today</span>
                </div>
              </div>
              <Badge variant="primary" size="xs">AI Recommendation</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboardPage;
