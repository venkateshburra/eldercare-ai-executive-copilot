// src/components/common/LoadingSpinner.jsx
import React from "react";

export const LoadingSpinner = ({ text = "Loading data...", size = "md", fullScreen = false }) => {
  const sizeClasses = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div
        className={`${sizeClasses[size]} border-blue-200 border-t-blue-700 rounded-full animate-spin mb-3`}
      />
      {text && <p className="text-sm font-medium text-slate-600">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
