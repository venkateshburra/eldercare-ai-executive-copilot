// src/components/common/EmptyState.jsx
import React from "react";
import { FiInbox } from "react-icons/fi";

export const EmptyState = ({
  title = "No records found",
  description = "There is currently no data to display for this view.",
  actionLabel,
  onAction,
  icon: Icon = FiInbox,
}) => {
  return (
    <div className="card-panel p-8 text-center flex flex-col items-center justify-center my-6 bg-white">
      <div className="p-3 rounded-full bg-slate-100 border border-slate-200 text-slate-500 mb-3">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-base font-semibold text-slate-800">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary text-xs">
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
