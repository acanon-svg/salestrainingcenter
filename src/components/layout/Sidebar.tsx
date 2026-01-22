import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  Home,
  BookOpen,
  BarChart3,
  User,
  Bell,
  MessageSquare,
  Settings,
  LogOut,
  PlusCircle,
  Award,
  Trophy,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import addiTrainingLogo from "@/assets/addi-training-logo.svg";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  roles?: ("student" | "creator" | "admin")[];
}

const navItems: NavItem[] = [
  { label: "Home", icon: Home, href: "/dashboard" },
  { label: "Mis Cursos", icon: BookOpen, href: "/courses" },
  { label: "Ranking", icon: Trophy, href: "/ranking" },
  { label: "Insignias", icon: Award, href: "/badges" },
  { label: "Notificaciones", icon: Bell, href: "/notifications" },
  { label: "Feedback", icon: MessageSquare, href: "/feedback" },
];

const creatorItems: NavItem[] = [
  { label: "Crear Curso", icon: PlusCircle, href: "/courses/create", roles: ["creator", "admin"] },
  { label: "Mis Creaciones", icon: BookOpen, href: "/my-courses", roles: ["creator", "admin"] },
];

const adminItems: NavItem[] = [
  { label: "Usuarios", icon: Users, href: "/users", roles: ["admin"] },
  { label: "Reportes", icon: BarChart3, href: "/reports", roles: ["admin"] },
  { label: "Configuración", icon: Settings, href: "/settings", roles: ["admin"] },
];

export const Sidebar: React.FC = () => {
  const { profile, roles, signOut, hasRole } = useAuth();
  const location = useLocation();

  const isActive = (href: string) => location.pathname === href;

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const visibleCreatorItems = creatorItems.filter(
    (item) => !item.roles || item.roles.some((role) => hasRole(role))
  );

  const visibleAdminItems = adminItems.filter(
    (item) => !item.roles || item.roles.some((role) => hasRole(role))
  );

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-4 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img 
              src={addiTrainingLogo} 
              alt="Addi Training Center" 
              className="h-10 w-auto"
            />
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}

            {visibleCreatorItems.length > 0 && (
              <>
                <Separator className="my-4 bg-sidebar-border" />
                <p className="px-3 mb-2 text-xs font-semibold uppercase text-sidebar-foreground/50">
                  Creador
                </p>
                {visibleCreatorItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive(item.href)
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </>
            )}

            {visibleAdminItems.length > 0 && (
              <>
                <Separator className="my-4 bg-sidebar-border" />
                <p className="px-3 mb-2 text-xs font-semibold uppercase text-sidebar-foreground/50">
                  Administrador
                </p>
                {visibleAdminItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive(item.href)
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
        </ScrollArea>

        {/* User Profile */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground">
                {getInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {profile?.full_name || "Usuario"}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {profile?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/profile" className="flex-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <User className="h-4 w-4" />
                Mi Perfil
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
};
