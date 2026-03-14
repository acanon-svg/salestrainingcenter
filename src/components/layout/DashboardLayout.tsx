import React from "react";
import { Sidebar } from "./Sidebar";
import { MobileSidebar } from "./MobileSidebar";
import { DemoModeSelector } from "@/components/demo/DemoModeSelector";
import { Watermark } from "@/components/Watermark";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background relative">
      <Sidebar />
      <MobileSidebar />
      <main className="md:pl-64 relative">
        <div className="p-4 pt-18 md:p-6 md:pt-6 lg:p-8 pb-20">
          {children}
        </div>
      </main>
      <DemoModeSelector />
      <Watermark />
    </div>
  );
};
