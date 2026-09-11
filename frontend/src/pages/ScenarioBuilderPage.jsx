// src/pages/ScenarioBuilderPage.jsx
import React, { useState, useEffect } from "react";
import api from "../api/client";
import Badge from "../components/common/Badge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import StatCard from "../components/common/StatCard";
import {
  FiSliders,
  FiSave,
  FiTrendingUp,
  FiDollarSign,
  FiAlertTriangle,
  FiCheckCircle,
  FiLayers,
} from "react-icons/fi";
import toast from "react-hot-toast";

export const ScenarioBuilderPage = () => {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dynamic assumptions state for interactive modeling
  const [caregivers, setCaregivers] = useState(24);
  const [residents, setResidents] = useState(72);
  const [hourlyRate, setHourlyRate] = useState(23);
  const [occupancyRate, setOccupancyRate] = useState(90);
  const [notes, setNotes] = useState("");
  const [savingVersion, setSavingVersion] = useState(false);

  const fetchScenarios = async () => {
    try {
      setLoading(true);
      const res = await api.get("/scenarios");
      const list = res.data?.data || [];
      setScenarios(list);
      if (list.length > 0) {
        selectScenario(list[0]);
      }
    } catch {
      toast.error("Failed to load scenarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  const selectScenario = (sc) => {
    setSelectedScenario(sc);
    const map = {};
    (sc.assumptions || []).forEach(a => { map[a.key] = a.value; });

    if (map.caregiverStaffing) setCaregivers(Number(map.caregiverStaffing));
    if (map.residentCount) setResidents(Number(map.residentCount));
    if (map.caregiverHourlyRate) setHourlyRate(Number(map.caregiverHourlyRate));
    if (map.occupancyRate) setOccupancyRate(Number(map.occupancyRate));
  };

  // Real-time calculations
  const staffRatio = Math.round((caregivers / (residents || 1)) * 100) / 100;
  const monthlyRevenue = Math.round(residents * 4500 * (occupancyRate / 100));
  const staffCost = Math.round(caregivers * 40 * 4.33 * hourlyRate);
  const operatingMargin = monthlyRevenue - staffCost;
  const marginPct = Math.round((operatingMargin / (monthlyRevenue || 1)) * 100);
  const riskIndex = staffRatio < 0.25 ? "High Risk" : staffRatio < 0.32 ? "Moderate" : "Optimal";
  const projectedIncidents = Math.max(0.5, Math.round((2.8 - (staffRatio * 3.5)) * 10) / 10);

  // Save new scenario version to backend
  const handleSaveVersion = async () => {
    if (!selectedScenario?._id) return;
    setSavingVersion(true);

    try {
      const payload = {
        assumptions: [
          { key: "caregiverStaffing", value: caregivers, unit: "FTE", label: "Caregiver Count" },
          { key: "residentCount", value: residents, unit: "residents", label: "Resident Count" },
          { key: "caregiverHourlyRate", value: hourlyRate, unit: "$/hr", label: "Hourly Rate" },
          { key: "occupancyRate", value: occupancyRate, unit: "%", label: "Target Occupancy" },
        ],
        notes: notes.trim() || `Model adjusted to ${caregivers} staff and ${residents} residents`,
      };

      const res = await api.post(`/scenarios/${selectedScenario._id}/versions`, payload);
      toast.success(res.data?.message || "Scenario version saved!");
      setNotes("");
      fetchScenarios();
    } catch {
      toast.error("Failed to save scenario version");
    } finally {
      setSavingVersion(false);
    }
  };

  // Preset Scenario Handlers
  const applyPreset = (type) => {
    if (type === "base") {
      setCaregivers(24);
      setResidents(72);
      setHourlyRate(23);
      setOccupancyRate(90);
    } else if (type === "upside") {
      setCaregivers(30);
      setResidents(85);
      setHourlyRate(24);
      setOccupancyRate(96);
    } else if (type === "downside") {
      setCaregivers(18);
      setResidents(74);
      setHourlyRate(28);
      setOccupancyRate(85);
    }
    toast.success(`Applied ${type.toUpperCase()} scenario assumptions`);
  };

  if (loading) {
    return <LoadingSpinner text="Loading scenario models..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Scenario Builder & Assumption Modeling
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive simulation of caregiver staffing, financial margins, and risk outcomes
          </p>
        </div>

        {/* Preset Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 mr-1 hidden sm:inline">Presets:</span>
          <button
            onClick={() => applyPreset("base")}
            className="btn-secondary text-xs px-2.5 py-1"
          >
            Base Case
          </button>
          <button
            onClick={() => applyPreset("upside")}
            className="btn-secondary text-xs px-2.5 py-1"
          >
            Upside (+Beds)
          </button>
          <button
            onClick={() => applyPreset("downside")}
            className="btn-secondary text-xs px-2.5 py-1"
          >
            Downside (Stress)
          </button>
        </div>
      </div>

      {/* Main Grid: Sliders on Left, Real-Time Calculations on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sliders Form (2 Cols) */}
        <div className="lg:col-span-2 card-panel p-6 bg-white space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <FiSliders className="w-5 h-5 text-blue-700" />
              <h3 className="text-sm font-bold text-slate-900">Adjustable Assumption Parameters</h3>
            </div>
            {selectedScenario && (
              <Badge variant="primary" size="xs">
                {selectedScenario.title}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Slider 1: Caregivers */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Caregiver Staffing (FTE)</span>
                <span className="text-blue-700 font-bold">{caregivers} on duty</span>
              </div>
              <input
                type="range"
                min="10"
                max="45"
                value={caregivers}
                onChange={(e) => setCaregivers(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-700"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>10 FTE</span>
                <span>Baseline: 24</span>
                <span>45 FTE</span>
              </div>
            </div>

            {/* Slider 2: Resident Count */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Resident Census Count</span>
                <span className="text-blue-700 font-bold">{residents} residents</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={residents}
                onChange={(e) => setResidents(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-700"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>30</span>
                <span>Baseline: 72</span>
                <span>100</span>
              </div>
            </div>

            {/* Slider 3: Caregiver Hourly Rate */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Blended Hourly Wage</span>
                <span className="text-blue-700 font-bold">${hourlyRate} / hr</span>
              </div>
              <input
                type="range"
                min="18"
                max="38"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-700"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>$18/hr</span>
                <span>Baseline: $23</span>
                <span>$38/hr</span>
              </div>
            </div>

            {/* Slider 4: Occupancy Rate */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Target Bed Occupancy</span>
                <span className="text-blue-700 font-bold">{occupancyRate}%</span>
              </div>
              <input
                type="range"
                min="65"
                max="100"
                value={occupancyRate}
                onChange={(e) => setOccupancyRate(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-700"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>65%</span>
                <span>Baseline: 90%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Version Snapshot Save */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Rationale / snapshot notes (e.g., 'Tested 15% wage increase buffer')..."
              className="form-input flex-1"
            />
            <button
              onClick={handleSaveVersion}
              disabled={savingVersion}
              className="btn-primary shrink-0"
            >
              <FiSave className="w-4 h-4" />
              {savingVersion ? "Saving..." : "Save Model Version"}
            </button>
          </div>
        </div>

        {/* Real-time Projected Outputs (1 Col) */}
        <div className="card-panel p-6 bg-white space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Projected Financial Impact</h3>
              <Badge variant="primary" size="xs">Live Model</Badge>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Est. Monthly Revenue</p>
                <h4 className="text-xl font-bold text-slate-900 mt-0.5">
                  ${monthlyRevenue.toLocaleString()}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Based on ${Math.round(monthlyRevenue / (residents || 1))} / bed</p>
              </div>

              <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Est. Monthly Labor Cost</p>
                <h4 className="text-xl font-bold text-slate-900 mt-0.5">
                  ${staffCost.toLocaleString()}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{caregivers} FTE @ ${hourlyRate}/hr</p>
              </div>

              <div className="p-3 rounded-md bg-blue-50 border border-blue-200">
                <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Net Operating Margin</p>
                <div className="flex items-baseline justify-between mt-0.5">
                  <h4 className="text-xl font-bold text-blue-900">
                    ${operatingMargin.toLocaleString()}
                  </h4>
                  <span className="text-xs font-bold text-blue-700">
                    {marginPct}% Margin
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Staff-to-Resident Ratio:</span>
                <span className="font-bold text-slate-900">1 : {Math.round((residents / (caregivers || 1)) * 10) / 10}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Staffing Adequacy Index:</span>
                <Badge variant={riskIndex === "High Risk" ? "danger" : "primary"} size="xs">
                  {riskIndex}
                </Badge>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Projected Monthly Incidents:</span>
                <span className="font-bold text-slate-900">{projectedIncidents} events</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scenarios Catalog Table */}
      <div className="card-panel bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Saved Scenario Library</h3>
            <p className="text-xs text-slate-500">Historical models and executive version snapshots</p>
          </div>
          <span className="text-xs text-slate-500 font-semibold">{scenarios.length} Models Loaded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Scenario Title</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Category</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Type</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Revenue</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Staff Cost</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider">Margin</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scenarios.map((sc) => (
                <tr key={sc._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">{sc.title}</td>
                  <td className="py-3 px-4 capitalize text-slate-600">{sc.category?.replace("_", " ")}</td>
                  <td className="py-3 px-4">
                    <Badge variant={sc.type === "downside" ? "warning" : "primary"} size="xs">
                      {sc.type}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-700">${sc.result?.estimatedMonthlyRevenue?.toLocaleString() || "—"}</td>
                  <td className="py-3 px-4 text-slate-700">${sc.result?.estimatedStaffCost?.toLocaleString() || "—"}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    ${sc.result?.netOperatingMargin?.toLocaleString() || "—"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => selectScenario(sc)}
                      className="text-xs text-blue-700 font-semibold hover:underline cursor-pointer"
                    >
                      Load into Builder
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ScenarioBuilderPage;
