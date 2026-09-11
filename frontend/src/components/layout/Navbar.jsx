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
              onClick={logout}
              className="p-2 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <FiLogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <NotificationPanel isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
};

export default Navbar;
