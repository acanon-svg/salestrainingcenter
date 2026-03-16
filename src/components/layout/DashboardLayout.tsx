import React from "react";
import { Sidebar } from "./Sidebar";
import { MobileSidebar } from "./MobileSidebar";
import { DemoModeSelector } from "@/components/demo/DemoModeSelector";
import { Watermark } from "@/components/Watermark";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useSectionTracking } from "@/hooks/useSectionTracking";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { profile } = useAuth();
  useSectionTracking();
  
  const lastLogin = profile?.last_login
    ? format(new Date(profile.last_login), "d 'de' MMMM, HH:mm", { locale: es })
    : null;

  return (
    <div className="min-h-screen bg-background relative">
      <Sidebar />
      <MobileSidebar />
      <main className="md:pl-64 relative">
        {/* Barra sutil con crédito - visible en todas las secciones */}
        <div className="hidden md:flex items-center justify-end px-8 pt-4 pb-0">
          <span className="text-[11px] text-muted-foreground/40 italic">
            by Alexandra Cañon
          </span>
        </div>
        <div className="p-4 pt-18 md:p-6 md:pt-2 lg:p-8 lg:pt-2 pb-20">
          {children}
        </div>
      </main>
      <DemoModeSelector />
      <Watermark />
    </div>
  );
};
