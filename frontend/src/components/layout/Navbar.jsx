// src/components/layout/Navbar.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { FiBell, FiLogOut, FiMenu } from "react-icons/fi";
import api from "../../api/client";
import Badge from "../common/Badge";
import NotificationPanel from "./NotificationPanel";

export const Navbar = ({ onOpenMobileSidebar }) => {
  const { user, roleName, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await api.get("/notifications/unread-count");
        setUnreadCount(res.data?.data?.count || 0);
      } catch {
        // Handled silently
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 45000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        {/* Left: Mobile menu toggle & Organization Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            aria-label="Open sidebar"
          >
            <FiMenu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-700" />
            <h2 className="text-sm font-bold text-slate-900 tracking-wide">
              SilverCare Senior Living
            </h2>
          </div>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="hidden sm:inline text-xs text-slate-500">
            Governance & Decision Copilot
          </span>
        </div>

        {/* Right: Actions, Notifications, User Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Notifications Button */}
          <button
            onClick={() => setIsNotifOpen(true)}
            className="relative p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Notifications"
          >
            <FiBell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-blue-700 text-[10px] font-bold text-white flex items-center justify-center rounded-full">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* User & Role Badge */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
              {user?.firstName ? user.firstName[0] : "U"}
            </div>

            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <div className="mt-0.5">
                <Badge variant="primary" size="xs">
                  {roleName}
                </Badge>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign out"
            >
              <FiLogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <NotificationPanel isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
          role="presentation"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top blue accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-blue-800" />

            <div className="p-6">
              {/* User identity */}
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100">
                <div className="w-11 h-11 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-base shadow-md shrink-0">
                  {user?.firstName ? user.firstName[0].toUpperCase() : "U"}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-tight">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-blue-700 font-semibold mt-0.5">{roleName}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{user?.email}</p>
                </div>
              </div>

              {/* Message */}
              <div className="flex items-start gap-3 mb-6">
                <div className="w-9 h-9 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                  <FiLogOut className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <h2 id="logout-confirm-title" className="text-sm font-bold text-slate-900 leading-snug">
                    Sign out of SilverCare?
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Your session will be closed. Any unsaved work may be lost. You can sign back in at any time.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FiLogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
