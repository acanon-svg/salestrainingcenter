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
  ClipboardCheck,
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

interface SidebarContentProps {
  onNavigate?: () => void;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  sectionKey?: string;
  roles?: ("student" | "creator" | "admin" | "lider" | "analista")[];
  showBadge?: boolean;
}

const defaultNavItems: NavItem[] = [
  { label: "Home", icon: Home, href: "/dashboard", sectionKey: "dashboard" },
  { label: "Mis Cursos", icon: BookOpen, href: "/courses", sectionKey: "courses" },
  { label: "Material Formativo", icon: FolderOpen, href: "/materials", sectionKey: "training_materials" },
  { label: "Herramientas", icon: Wrench, href: "/tools", sectionKey: "tools" },
  { label: "Resultados", icon: TrendingUp, href: "/results", sectionKey: "results" },
  { label: "Ranking", icon: Trophy, href: "/ranking", sectionKey: "ranking" },
  { label: "Insignias", icon: Award, href: "/badges", sectionKey: "badges" },
  { label: "Seguimientos", icon: ClipboardCheck, href: "/followups", sectionKey: "followups" },
  { label: "Notificaciones", icon: Bell, href: "/notifications", sectionKey: "notifications" },
  { label: "Feedback", icon: MessageSquare, href: "/feedback", sectionKey: "feedback" },
];

const creatorItems: NavItem[] = [
  { label: "Crear Curso", icon: PlusCircle, href: "/courses/create", roles: ["creator"], sectionKey: "create_course" },
  { label: "Mis Creaciones", icon: BookOpen, href: "/my-courses", roles: ["creator"], sectionKey: "my_courses" },
  { label: "Resultados del Equipo", icon: TrendingUp, href: "/results", roles: ["creator", "admin"], sectionKey: "results" },
  { label: "Anuncios", icon: Bell, href: "/announcements", sectionKey: "announcements", roles: ["creator"] },
  { label: "Herramientas", icon: Wrench, href: "/tools", sectionKey: "tools", roles: ["creator", "admin"] },
  { label: "Feedbacks al Equipo", icon: ClipboardList, href: "/team-feedback-forms", sectionKey: "team_feedback", roles: ["creator", "admin"] },
  { label: "Feedback de Cursos", icon: MessageSquare, href: "/feedback", roles: ["creator", "admin"], sectionKey: "feedback", showBadge: true },
  { label: "Comisiones Rechazadas", icon: DollarSign, href: "/tools?view=rejected-commissions", roles: ["creator", "admin"], sectionKey: "rejected_commissions", showBadge: true },
];

const leaderItems: NavItem[] = [
  { label: "Mi Equipo", icon: Users, href: "/team", roles: ["lider"], sectionKey: "team" },
  { label: "Reportes Regional", icon: BarChart3, href: "/reports", roles: ["lider"], sectionKey: "reports_field_sales" },
  { label: "Herramientas", icon: Wrench, href: "/tools", sectionKey: "tools", roles: ["lider"] },
  { label: "Feedbacks al Equipo", icon: ClipboardList, href: "/team-feedback", sectionKey: "team_feedback", roles: ["lider"] },
];

const analistaItems: NavItem[] = [
  { label: "Reportes", icon: BarChart3, href: "/reports", roles: ["analista"], sectionKey: "reports" },
];

const adminItems: NavItem[] = [
  { label: "Usuarios", icon: Users, href: "/users", roles: ["admin"], sectionKey: "users" },
  { label: "Reportes", icon: BarChart3, href: "/reports", roles: ["admin"], sectionKey: "reports" },
];

export const SidebarContent: React.FC<SidebarContentProps> = ({ onNavigate }) => {
  const { profile, roles, signOut, hasRole, user } = useAuth();
  const location = useLocation();
  const { configs, isSectionVisibleForUser } = usePortalSectionConfigs();
  const { data: unreadFeedbackCount = 0 } = useUnreadCourseFeedbackCount();
  const { data: rejectedCommissionCount = 0 } = useRejectedCommissionCount();

  const isActive = (href: string) => {
    const questionMark = href.indexOf("?");
    if (questionMark !== -1) {
      const path = href.substring(0, questionMark);
      const query = href.substring(questionMark);
      return location.pathname === path && location.search === query;
    }
    return location.pathname === href && location.search === "";
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getSectionLabel = (item: NavItem): string => {
    if (!item.sectionKey || !configs) return item.label;
    const config = configs.find((c) => c.section_key === item.sectionKey);
    return config?.section_name || item.label;
  };

  const isNavItemVisible = (item: NavItem): boolean => {
    if (!item.sectionKey || !configs || !user?.id) return true;
    
    // Special logic for results - only show to field sales students
    if (item.sectionKey === "results" && !hasRole("creator") && !hasRole("admin") && !hasRole("lider")) {
      if (!profile?.team) return false;
      if (!profile.team.toLowerCase().includes("field sales")) return false;
    }
    
    // Special logic for reports_field_sales - only show to field sales leaders
    if (item.sectionKey === "reports_field_sales") {
      if (!profile?.team) return false;
      if (!profile.team.toLowerCase().includes("field sales")) return false;
    }

    const config = configs.find((c) => c.section_key === item.sectionKey);
    if (!config) return true;
    return isSectionVisibleForUser(config, profile?.team || null, user.id);
  };

  const isRoleItemVisible = (item: NavItem): boolean => {
    if (item.roles && !item.roles.some((role) => hasRole(role))) return false;
    return isNavItemVisible(item);
  };

  const visibleNavItems = defaultNavItems.filter(isNavItemVisible);
  const visibleCreatorItems = creatorItems.filter(isRoleItemVisible);
  const visibleLeaderItems = leaderItems.filter(isRoleItemVisible);
  const visibleAnalistaItems = analistaItems.filter(isRoleItemVisible);
  const visibleAdminItems = adminItems.filter(isRoleItemVisible);

  const handleClick = () => onNavigate?.();

  const renderNavLink = (item: NavItem, badgeCount?: number) => {
    const Icon = item.icon;
    const showBadgeCount = (badgeCount ?? 0) > 0;
    return (
      <Link
        key={item.href + item.label}
        to={item.href}
        onClick={handleClick}
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
            <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground">
              {(badgeCount ?? 0) > 9 ? "9+" : badgeCount}
            </Badge>
          )}
        </div>
        {item.showBadge ? item.label : getSectionLabel(item)}
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-sidebar-border">
        <Link to="/dashboard" onClick={handleClick} className="flex items-center gap-2">
          <img src={addiTrainingLogo} alt="Addi Training Center" className="h-10 w-auto" />
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {visibleNavItems.map((item) => renderNavLink(item))}

          {visibleCreatorItems.length > 0 && (
            <>
              <Separator className="my-4 bg-sidebar-border" />
              <p className="px-3 mb-2 text-xs font-semibold uppercase text-sidebar-foreground/50">Creador</p>
              {visibleCreatorItems.map((item) => {
                const badgeCount = item.showBadge
                  ? item.label === "Comisiones Rechazadas"
                    ? rejectedCommissionCount
                    : unreadFeedbackCount
                  : 0;
                return renderNavLink(item, badgeCount);
              })}
            </>
          )}

          {visibleLeaderItems.length > 0 && (
            <>
              <Separator className="my-4 bg-sidebar-border" />
              <p className="px-3 mb-2 text-xs font-semibold uppercase text-sidebar-foreground/50">Líder</p>
              {visibleLeaderItems.map((item) => renderNavLink(item))}
            </>
          )}

          {visibleAnalistaItems.length > 0 && (
            <>
              <Separator className="my-4 bg-sidebar-border" />
              <p className="px-3 mb-2 text-xs font-semibold uppercase text-sidebar-foreground/50">Reporting & Data</p>
              {visibleAnalistaItems.map((item) => renderNavLink(item))}
            </>
          )}

          {visibleAdminItems.length > 0 && (
            <>
              <Separator className="my-4 bg-sidebar-border" />
              <p className="px-3 mb-2 text-xs font-semibold uppercase text-sidebar-foreground/50">Administrador</p>
              {visibleAdminItems.map((item) => renderNavLink(item))}
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
            <p className="text-sm font-medium truncate">{profile?.full_name || "Usuario"}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{profile?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/profile" onClick={handleClick} className="flex-1">
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
  );
};
