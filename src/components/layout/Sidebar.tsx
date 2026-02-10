import React from "react";
import { SidebarContent } from "./SidebarContent";

export const Sidebar: React.FC = () => {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border hidden md:block">
      <SidebarContent />
    </aside>
  );
};
