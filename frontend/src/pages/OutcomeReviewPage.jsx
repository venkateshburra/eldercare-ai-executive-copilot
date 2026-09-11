// src/pages/OutcomeReviewPage.jsx
import React, { useState } from "react";
import StatCard from "../components/common/StatCard";
import Badge from "../components/common/Badge";
import {
  FiTarget,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiThumbsUp,
  FiThumbsDown,
} from "react-icons/fi";
import toast from "react-hot-toast";

export const OutcomeReviewPage = () => {
  const [feedbackGiven, setFeedbackGiven] = useState({});

  const pastPredictions = [
    {
      id: "pred-1",
      feature: "Staffing Optimization",
      date: "2026-08-15",
      recommendation: "Deploy 2 additional CNAs to Memory Care between 11PM-4AM to curb falls",
      actualOutcome: "Zero falls recorded in Memory Care over 30-day monitoring window",
      accuracy: "96%",
      status: "Validated",
      latencyMs: 380,
    },
    {
      id: "pred-2",
      feature: "Occupancy Revenue Forecast",
      date: "2026-08-01",
      recommendation: "Projected monthly operating revenue of $324,000 at 90% occupancy",
      actualOutcome: "Actual reconciled revenue reached $326,500 (+0.7% variance)",
      accuracy: "99%",
      status: "Validated",
      latencyMs: 410,
    },
    {
      id: "pred-3",
      feature: "Acuity Shift Surge",
      date: "2026-07-20",
      recommendation: "Predicted 3.2 incident occurrences during seasonal intake transition",
      actualOutcome: "Recorded 2 minor slips and 1 medication delay",
      accuracy: "94%",
      status: "Validated",
      latencyMs: 520,
    },
  ];

  const handleFeedback = (id, type) => {
    setFeedbackGiven((prev) => ({ ...prev, [id]: type }));
    toast.success(`Feedback recorded: ${type === "up" ? "Helpful" : "Needs Review"}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          AI Outcome Review & Model Calibration
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Auditing AI recommendation efficacy against ground-truth clinical and financial reconciliations
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Historical Accuracy"
          value="96.3%"
          subtitle="Across 42 logged decisions"
          icon={FiTarget}
          trend="+1.2%"
          trendDirection="up"
        />

        <StatCard
          title="Prediction Drift Delta"
          value="< 2.5%"
          subtitle="Safe variance threshold"
          icon={FiTrendingUp}
          trend="Stable"
          trendDirection="up"
        />

        <StatCard
          title="Avg Inference Latency"
          value="436 ms"
          subtitle="Model response SLA"
          icon={FiClock}
          trend="Optimal"
          trendDirection="up"
        />

        <StatCard
          title="Clinical Agreement Rate"
          value="98.1%"
          subtitle="Executive & Nurse reviews"
          icon={FiCheckCircle}
          trend="Compliant"
          trendDirection="up"
        />
      </div>

      {/* Reconciled Outcomes Table */}
      <div className="card-panel bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Reconciled Decision Audits</h3>
            <p className="text-xs text-slate-500">Historical AI projections mapped against real recorded outcomes</p>
          </div>
          <Badge variant="primary" size="xs">
            Model Governed
          </Badge>
        </div>

        <div className="divide-y divide-slate-100">
          {pastPredictions.map((pred) => (
            <div key={pred.id} className="p-5 hover:bg-slate-50/60 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{pred.feature}</span>
                  <Badge variant="primary" size="xs">
                    {pred.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>Reconciled on {pred.date}</span>
                  <span>Accuracy: <strong className="text-blue-700 font-bold">{pred.accuracy}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-3">
                <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    AI Forecasted Recommendation:
                  </span>
                  <p className="text-xs text-slate-700">{pred.recommendation}</p>
                </div>

                <div className="p-3 rounded-md bg-blue-50 border border-blue-200">
                  <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
                    Actual Reconciled Outcome:
                  </span>
                  <p className="text-xs text-slate-800 font-medium">{pred.actualOutcome}</p>
                </div>
              </div>

              {/* Feedback controls */}
              <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                <span>Inference time: {pred.latencyMs}ms</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[11px]">Was this forecast accurate?</span>
                  <button
                    onClick={() => handleFeedback(pred.id, "up")}
                    className={`p-1.5 rounded border transition-colors cursor-pointer ${
                      feedbackGiven[pred.id] === "up"
                        ? "bg-blue-50 border-blue-700 text-blue-700"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                    title="Accurate Prediction"
                  >
                    <FiThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleFeedback(pred.id, "down")}
                    className={`p-1.5 rounded border transition-colors cursor-pointer ${
                      feedbackGiven[pred.id] === "down"
                        ? "bg-rose-50 border-rose-600 text-rose-600"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                    title="Variance Detected"
                  >
                    <FiThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OutcomeReviewPage;
