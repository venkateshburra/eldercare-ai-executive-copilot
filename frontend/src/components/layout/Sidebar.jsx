// src/components/layout/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import {
  FiGrid,
  FiSearch,
  FiSliders,
  FiCheckSquare,
  FiMessageSquare,
  FiTarget,
  FiBarChart2,
  FiBell,
  FiUsers,
  FiSettings,
  FiCompass,
  FiX,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

export const Sidebar = ({ isOpen, onClose }) => {
  const { roleName, hasPermission } = useAuth();

  const navItems = [
    {
      label: "Decision Workspace",
      items: [
        { name: "Executive Dashboard", path: "/", icon: FiGrid, permission: null },
        { name: "Knowledge Search", path: "/knowledge-search", icon: FiSearch, permission: "ai.use" },
        { name: "Scenario Builder", path: "/scenario-builder", icon: FiSliders, permission: "scenarios.view" },
        { name: "Briefings & Decisions", path: "/decisions", icon: FiCheckSquare, permission: "decisions.view" },
        { name: "Source-Cited AI Q&A", path: "/ai-qa", icon: FiMessageSquare, permission: "ai.use" },
      ],
    },
    {
      label: "Analytics & Oversight",
      items: [
        { name: "Sensitivity Analysis", path: "/sensitivity-analysis", icon: FiSliders, permission: "scenarios.view" },
        { name: "Outcome Review", path: "/outcome-review", icon: FiTarget, permission: "ai.review" },
        { name: "Reports & Analytics", path: "/reports", icon: FiBarChart2, permission: "reports.view" },
        { name: "Notification Center", path: "/notifications", icon: FiBell, permission: null },
      ],
    },
    {
      label: "Administration",
      items: [
        { name: "Users & Roles", path: "/users", icon: FiUsers, permission: "users.manage" },
        { name: "Audit & Settings", path: "/settings", icon: FiSettings, permission: "auditLogs.view" },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-2xs transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col h-screen overflow-y-auto transition-transform duration-200 ease-in-out lg:z-30 lg:translate-x-0 ${isOpen ? "translate-x-0 shadow-xl" : "-translate-x-full shadow-none"
          }`}
      >
        {/* Brand / Logo Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center shadow-xs">
              <FiCompass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-wide">SILVERCARE</h1>
              <span className="text-[10px] text-blue-700 font-semibold tracking-wider uppercase block">
                Executive Copilot
              </span>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            aria-label="Close menu"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Groups - Filtered by RBAC permissions */}
        <nav className="flex-1 px-3 py-4 space-y-6">
          {navItems.map((group, gIdx) => {
            const visibleItems = group.items.filter(
              (item) => !item.permission || hasPermission(item.permission)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={gIdx}>
                <p className="px-3 text-[14px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                  {group.label}
                </p>
                <div className="space-y-2">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/"}
                      onClick={() => {
                        if (onClose) onClose();
                      }}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-md text-xs lg:text-[16px] font-medium transition-colors ${isActive
                          ? "bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-700"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span>{item.name}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer Role Card */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 shrink-0">
          <div className="p-2.5 rounded border border-slate-200 bg-white text-xs text-slate-600 flex items-center justify-between shadow-2xs">
            <span className="text-slate-400">Role Scope:</span>
            <span className="font-semibold text-blue-700">{roleName}</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
