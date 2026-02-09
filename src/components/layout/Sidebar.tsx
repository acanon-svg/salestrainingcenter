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
  LogOut,
  PlusCircle,
  FolderOpen,
  Award,
  Trophy,
  Users,
  Wrench,
  ClipboardList,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import addiTrainingLogo from "@/assets/addi-training-logo.svg";
import { usePortalSectionConfigs } from "@/hooks/usePortalSectionConfigs";
import { useUnreadCourseFeedbackCount } from "@/hooks/useFeedback";
import { useRejectedCommissionCount } from "@/hooks/useCommissionReviews";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  sectionKey?: string;
  roles?: ("student" | "creator" | "admin" | "lider" | "analista")[];
  showBadge?: boolean;
}

// Map section_key to route paths for dynamic name lookup
const sectionKeyToHref: Record<string, string> = {
  dashboard: "/dashboard",
  courses: "/courses",
  training_materials: "/materials",
  ranking: "/ranking",
  badges: "/badges",
  tools: "/tools",
  team_feedback: "/team-feedback-forms",
  announcements: "/announcements",
};

const defaultNavItems: NavItem[] = [
  { label: "Home", icon: Home, href: "/dashboard", sectionKey: "dashboard" },
  { label: "Mis Cursos", icon: BookOpen, href: "/courses", sectionKey: "courses" },
  { label: "Material Formativo", icon: FolderOpen, href: "/materials", sectionKey: "training_materials" },
  // Herramientas debe ser visible para estudiantes; el acceso interno se controla por targeting
  { label: "Herramientas", icon: Wrench, href: "/tools", sectionKey: "tools" },
  { label: "Resultados", icon: TrendingUp, href: "/results", sectionKey: "results" },
  { label: "Ranking", icon: Trophy, href: "/ranking", sectionKey: "ranking" },
  { label: "Insignias", icon: Award, href: "/badges", sectionKey: "badges" },
  { label: "Notificaciones", icon: Bell, href: "/notifications" },
  { label: "Feedback", icon: MessageSquare, href: "/feedback" },
];

const creatorItems: NavItem[] = [
  { label: "Crear Curso", icon: PlusCircle, href: "/courses/create", roles: ["creator", "admin"] },
  { label: "Mis Creaciones", icon: BookOpen, href: "/my-courses", roles: ["creator", "admin"] },
  { label: "Resultados del Equipo", icon: TrendingUp, href: "/results", roles: ["creator", "admin"] },
  { label: "Anuncios", icon: Bell, href: "/announcements", sectionKey: "announcements", roles: ["creator", "admin"] },
  { label: "Herramientas", icon: Wrench, href: "/tools", sectionKey: "tools", roles: ["creator", "admin"] },
  { label: "Feedbacks al Equipo", icon: ClipboardList, href: "/team-feedback-forms", sectionKey: "team_feedback", roles: ["creator", "admin"] },
  { label: "Feedback de Cursos", icon: MessageSquare, href: "/feedback", roles: ["creator", "admin"], showBadge: true },
  { label: "Comisiones Rechazadas", icon: DollarSign, href: "/tools", roles: ["creator", "admin"], showBadge: true },
];

const leaderItems: NavItem[] = [
  { label: "Mi Equipo", icon: Users, href: "/team", roles: ["lider"] },
  { label: "Reportes Regional", icon: BarChart3, href: "/reports", roles: ["lider"], sectionKey: "reports_field_sales" },
  { label: "Herramientas", icon: Wrench, href: "/tools", sectionKey: "tools", roles: ["lider"] },
  { label: "Feedbacks al Equipo", icon: ClipboardList, href: "/team-feedback", sectionKey: "team_feedback", roles: ["lider"] },
];

const analistaItems: NavItem[] = [
  { label: "Reportes", icon: BarChart3, href: "/reports", roles: ["analista"] },
];

const adminItems: NavItem[] = [
  { label: "Usuarios", icon: Users, href: "/users", roles: ["admin"] },
  { label: "Reportes", icon: BarChart3, href: "/reports", roles: ["admin"] },
];

export const Sidebar: React.FC = () => {
  const { profile, roles, signOut, hasRole, user } = useAuth();
  const location = useLocation();
  const { configs, isSectionVisibleForUser } = usePortalSectionConfigs();
  const { data: unreadFeedbackCount = 0 } = useUnreadCourseFeedbackCount();
  const { data: rejectedCommissionCount = 0 } = useRejectedCommissionCount();
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

  // Get custom section name from config, or use default
  const getSectionLabel = (item: NavItem): string => {
    if (!item.sectionKey || !configs) return item.label;
    const config = configs.find((c) => c.section_key === item.sectionKey);
    return config?.section_name || item.label;
  };

  // Check if a nav item is visible based on portal config
  const isNavItemVisible = (item: NavItem): boolean => {
    // Herramientas siempre debe aparecer (control de acceso a herramientas específicas vive adentro del módulo)
    if (item.sectionKey === "tools") return true;
    // Resultados solo visible para Field Sales (estudiantes). Creadores, admins y líderes siempre ven.
    if (item.sectionKey === "results") {
      if (hasRole("creator") || hasRole("admin") || hasRole("lider")) return true;
      if (!profile?.team) return false;
      return profile.team.toLowerCase().includes("field sales");
    }
    if (!item.sectionKey || !configs || !user?.id) return true;
    const config = configs.find((c) => c.section_key === item.sectionKey);
    if (!config) return true;
    return isSectionVisibleForUser(config, profile?.team || null, user.id);
  };

  // Check if a leader nav item is visible (some items are Field Sales only)
  const isLeaderItemVisible = (item: NavItem): boolean => {
    if (!item.roles || !item.roles.some((role) => hasRole(role))) return false;
    // Reportes Regional solo visible para líderes de Field Sales
    if (item.sectionKey === "reports_field_sales") {
      if (!profile?.team) return false;
      return profile.team.toLowerCase().includes("field sales");
    }
    return true;
  };

  const visibleNavItems = defaultNavItems.filter(isNavItemVisible);

  // Creator items should always be visible to creators/admins - portal config visibility should NOT affect them
  // The sectionKey is only used for dynamic naming, not for hiding sections from creators
  const visibleCreatorItems = creatorItems.filter(
    (item) => !item.roles || item.roles.some((role) => hasRole(role))
  );

  // Leader items: use specific visibility check (some items gated to Field Sales)
  const visibleLeaderItems = leaderItems.filter(isLeaderItemVisible);

  const visibleAnalistaItems = analistaItems.filter(
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
            {visibleNavItems.map((item) => {
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
                  {getSectionLabel(item)}
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
                  const badgeCount = item.showBadge
                    ? item.label === "Comisiones Rechazadas"
                      ? rejectedCommissionCount
                      : unreadFeedbackCount
                    : 0;
                  const showBadgeCount = badgeCount > 0;
                  return (
                    <Link
                      key={item.href + item.label}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive(item.href)
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      <div className="relative">
                        <Icon className="h-5 w-5" />
                        {showBadgeCount && (
                          <Badge 
                            className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground"
                          >
                            {badgeCount > 9 ? "9+" : badgeCount}
                          </Badge>
                        )}
                      </div>
                      {item.label}
                    </Link>
                  );
                })}
              </>
            )}

            {visibleLeaderItems.length > 0 && (
              <>
                <Separator className="my-4 bg-sidebar-border" />
                <p className="px-3 mb-2 text-xs font-semibold uppercase text-sidebar-foreground/50">
                  Líder
                </p>
                {visibleLeaderItems.map((item) => {
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
                      {getSectionLabel(item)}
                    </Link>
                  );
                })}
              </>
            )}

            {visibleAnalistaItems.length > 0 && (
              <>
                <Separator className="my-4 bg-sidebar-border" />
                <p className="px-3 mb-2 text-xs font-semibold uppercase text-sidebar-foreground/50">
                  Reporting & Data
                </p>
                {visibleAnalistaItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={`analista-${item.href}`}
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
                      {getSectionLabel(item)}
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
