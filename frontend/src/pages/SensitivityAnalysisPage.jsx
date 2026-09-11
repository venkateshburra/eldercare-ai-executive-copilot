// src/pages/SensitivityAnalysisPage.jsx
import React, { useState } from "react";
import Badge from "../components/common/Badge";
import StatCard from "../components/common/StatCard";
import {
  FiSliders,
  FiAlertTriangle,
  FiShield,
  FiActivity,
  FiCheck,
} from "react-icons/fi";
import toast from "react-hot-toast";

export const SensitivityAnalysisPage = () => {
  const [stressFactor, setStressFactor] = useState("callout_20");

  const stressProfiles = {
    callout_10: {
      label: "10% Unplanned Staff Callouts",
      availableStaff: 22,
      staffRatio: "1 : 3.3",
      projectedMargin: "$218,400",
      riskLevel: "Low",
      incidentMultiplier: "+12%",
      recommendation: "Reallocate 1 float caregiver from Assisted Living to Memory Care.",
    },
    callout_20: {
      label: "20% Clinical Staff Callouts (Winter Protocol)",
      availableStaff: 19,
      staffRatio: "1 : 3.8",
      projectedMargin: "$195,200",
      riskLevel: "Moderate",
      incidentMultiplier: "+28%",
      recommendation: "Activate on-call agency CNA roster and stagger evening meal times.",
    },
    callout_30: {
      label: "30% Critical Staff Shortage",
      availableStaff: 16,
      staffRatio: "1 : 4.5",
      projectedMargin: "$162,000",
      riskLevel: "Critical",
      incidentMultiplier: "+65%",
      recommendation: "Executive emergency declaration: restrict non-essential activities, mandate 12h nurse overtime.",
    },
    wage_inflation: {
      label: "Wage Inflation ($28/hr Blended)",
      availableStaff: 24,
      staffRatio: "1 : 3.0",
      projectedMargin: "$182,500",
      riskLevel: "Financial Risk",
      incidentMultiplier: "0%",
      recommendation: "Review resident level-of-care billing tiers to offset $3.50/hr labor inflation.",
    },
  };

  const active = stressProfiles[stressFactor];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Sensitivity & Operational Stress-Testing
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate facility resilience against unexpected nurse shortages, acuity surges, and inflation
          </p>
        </div>

        <Badge variant="primary" size="xs">
          Simulation Active
        </Badge>
      </div>

      {/* Stress Factor Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(stressProfiles).map(([key, profile]) => (
          <button
            key={key}
            onClick={() => {
              setStressFactor(key);
              toast.success(`Loaded ${profile.label}`);
            }}
            className={`p-4 rounded-lg border text-left transition-all cursor-pointer ${
              stressFactor === key
                ? "bg-blue-50 border-blue-700 shadow-2xs"
                : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[14px] font-bold uppercase ${stressFactor === key ? "text-blue-700" : "text-slate-400"}`}>
                Stress Profile
              </span>
              <span className="w-2 h-2 text-[14px] rounded-full" style={{ backgroundColor: stressFactor === key ? "#1d4ed8" : "#cbd5e1" }} />
            </div>
            <h4 className="text-xs font-bold text-slate-900 mb-1">{profile.label}</h4>
            <p className="text-[14px] text-slate-500">
              Ratio: <span className="font-semibold text-slate-700">{profile.staffRatio}</span>
            </p>
          </button>
        ))}
      </div>

      {/* Primary Sensitivity HUD Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="On-Duty Staff Available"
          value={`${active.availableStaff} FTE`}
          subtitle="After unplanned absence factor"
          icon={FiActivity}
          trend={stressFactor === "callout_30" ? "-8 staff" : "-2 to -5 staff"}
          trendDirection="down"
        />

        <StatCard
          title="Nurse-to-Resident Ratio"
          value={active.staffRatio}
          subtitle="Caregiver coverage index"
          icon={FiShield}
          trend={active.riskLevel}
          trendDirection={active.riskLevel === "Low" ? "up" : "down"}
        />

        <StatCard
          title="Est. Operating Margin"
          value={active.projectedMargin}
          subtitle="Monthly net cashflow"
          icon={FiSliders}
          trend="-14% vs Base"
          trendDirection="down"
        />

        <StatCard
          title="Projected Fall Risk Delta"
          value={active.incidentMultiplier}
          subtitle="Clinical correlation model"
          icon={FiAlertTriangle}
          trend="Escalated"
          trendDirection="down"
        />
      </div>

      {/* AI Recommendation & Human Governance Decision Card */}
      <div className="card-panel p-6 bg-white border-l-4 border-l-blue-700 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FiShield className="w-5 h-5 text-blue-700" />
            <h3 className="text-sm font-bold text-slate-900">
              AI Operational Countermeasure Recommendation
            </h3>
          </div>
          <Badge variant="primary" size="xs">
            Governed Action Required
          </Badge>
        </div>

        <div className="p-4 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
          <span className="font-bold text-slate-900 block mb-1">Recommended Response Strategy:</span>
          {active.recommendation}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <span className="text-slate-500">
            Authorization will execute shift adjustments and log rationale in compliance audit logs.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toast.success("Overtime authorization ratified into decision queue.")}
              className="btn-primary text-xs"
            >
              <FiCheck className="w-3.5 h-3.5" /> Authorize Strategy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensitivityAnalysisPage;
