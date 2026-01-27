import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AnnouncementManager } from "@/components/announcements/AnnouncementManager";
import { Megaphone } from "lucide-react";

const Announcements: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-primary" />
            Anuncios y Banners
          </h1>
          <p className="text-muted-foreground">
            Crea y gestiona comunicaciones para el equipo comercial
          </p>
        </div>

        {/* Announcement Manager */}
        <AnnouncementManager />
      </div>
    </DashboardLayout>
  );
};

export default Announcements;
