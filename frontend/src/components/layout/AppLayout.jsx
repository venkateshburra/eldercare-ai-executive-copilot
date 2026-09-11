// src/components/layout/AppLayout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export const AppLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative">
      {/* Fixed Left Sidebar (always fixed on desktop, slide-over drawer on mobile) */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area:
          - Desktop (lg): offset by pl-64 to clear the 64-width fixed sidebar
          - Mobile: pl-0 so content spans 100% full width with zero empty left space
      */}
      <div className="lg:pl-64 flex flex-col min-h-screen w-full min-w-0">
        <Navbar onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />

        <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
