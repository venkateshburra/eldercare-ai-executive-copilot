// src/components/common/StatCard.jsx
import React from "react";

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendDirection = "up",
}) => {
  return (
    <div className="card-panel card-panel-hover p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>

        {Icon && (
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-600 font-medium">
          <span className="text-blue-700 font-semibold">
            {trendDirection === "up" ? "↑" : trendDirection === "down" ? "↓" : "•"} {trend}
          </span>
          <span className="text-slate-400">vs last period</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
