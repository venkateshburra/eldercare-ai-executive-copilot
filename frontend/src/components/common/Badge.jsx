// src/components/common/Badge.jsx
import React from "react";

export const Badge = ({ children, variant = "default", size = "sm" }) => {
  const variants = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    primary: "bg-blue-50 text-blue-700 border-blue-200 font-semibold",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    royal: "bg-blue-700 text-white border-blue-700",
  };

  const sizes = {
    xs: "text-[11px] px-2 py-0.5",
    sm: "text-xs px-2.5 py-0.5 font-medium",
    md: "text-xs px-3 py-1 font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border ${variants[variant] || variants.default} ${sizes[size] || sizes.sm}`}
    >
      {children}
    </span>
  );
};

export default Badge;
