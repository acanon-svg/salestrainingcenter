import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useLeaderHierarchy } from "@/hooks/useLeaderHierarchy";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Loader2, Trophy, Target, BookOpen, UserCheck, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { TeamMemberTable, TeamMember } from "@/components/team/TeamMemberTable";
import { SubordinateLeaderCard } from "@/components/team/SubordinateLeaderCard";

interface SubordinateLeader {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  team: string | null;
  regional: string | null;
  company_role: string | null;
  points: number;
}

const Team: React.FC = () => {
  const { user, hasRole, profile } = useAuth();
  const { useSubordinates } = useLeaderHierarchy();
  const isLeader = hasRole("lider");

  // Get leader's team from their profile
  const leaderTeam = profile?.team;

  // Fetch subordinate leader relationships
  const { data: subordinateRelations } = useSubordinates(user?.id || "");

  // Fetch full profiles of subordinate leaders
  const { data: subordinateLeaders, isLoading: subordinatesLoading } = useQuery({
    queryKey: ["subordinate-leader-profiles", subordinateRelations],
    queryFn: async () => {
      if (!subordinateRelations || subordinateRelations.length === 0) return [];
      
      const subordinateIds = subordinateRelations.map((r) => r.subordinate_id);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, email, avatar_url, team, regional, company_role, points")
        .in("user_id", subordinateIds)
        .order("full_name");

      if (error) throw error;
      return data as SubordinateLeader[];
    },
    enabled: !!subordinateRelations && subordinateRelations.length > 0,
  });

  // Fetch direct team members (same TEAM as the leader, not region)
  const { data: teamMembers, isLoading: membersLoading } = useQuery({
    queryKey: ["team-members-by-team", leaderTeam],
    queryFn: async () => {
      if (!leaderTeam) return [];
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, email, avatar_url, team, company_role, points, badges_count")
        .eq("team", leaderTeam)
        .order("points", { ascending: false });

      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !!leaderTeam,
  });

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isLeader) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
              <CardTitle>Acceso Restringido</CardTitle>
              <CardDescription>
                Solo los líderes pueden acceder a esta sección.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const totalPoints = teamMembers?.reduce((sum, m) => sum + m.points, 0) || 0;
  const avgPoints = teamMembers?.length ? Math.round(totalPoints / teamMembers.length) : 0;
  const topPerformer = teamMembers?.[0];
  const hasSubordinates = subordinateLeaders && subordinateLeaders.length > 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              Mi Equipo
            </h1>
            <p className="text-muted-foreground mt-1">
              Supervisa el progreso de tu equipo y líderes subordinados
            </p>
          </div>
          {leaderTeam && (
            <Badge variant="secondary" className="text-lg px-4 py-2 flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              {leaderTeam}
            </Badge>
          )}
        </div>

        {/* Stats - Only show if leader has a team */}
        {leaderTeam && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{teamMembers?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Miembros Directos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-addi-orange/10">
                    <Trophy className="h-6 w-6 text-addi-orange" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalPoints.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Puntos Totales</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-addi-cyan/10">
                    <Target className="h-6 w-6 text-addi-cyan" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{avgPoints.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Promedio Puntos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={topPerformer?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(topPerformer?.full_name || null)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-bold truncate">{topPerformer?.full_name || "N/A"}</p>
                    <p className="text-sm text-muted-foreground">Top del Equipo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Subordinate Leaders Section */}
        {hasSubordinates && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Líderes Subordinados
              </CardTitle>
              <CardDescription>
                Líderes bajo tu supervisión - expande para ver sus equipos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subordinatesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                subordinateLeaders?.map((leader) => (
                  <SubordinateLeaderCard key={leader.id} leader={leader} />
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Direct Team Table */}
        {leaderTeam ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {hasSubordinates ? "Mi Equipo Directo" : "Miembros del Equipo"}
              </CardTitle>
              <CardDescription>
                Rendimiento detallado de cada miembro de tu equipo ({leaderTeam})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeamMemberTable members={teamMembers} isLoading={membersLoading} />
            </CardContent>
          </Card>
        ) : (
          <Card className="text-center">
            <CardHeader>
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground" />
              <CardTitle>Sin Equipo Asignado</CardTitle>
              <CardDescription>
                {hasSubordinates 
                  ? "No tienes un equipo directo asignado, pero puedes ver los equipos de tus líderes subordinados arriba."
                  : "Aún no tienes un equipo asignado. Contacta al administrador para que te asigne un equipo."
                }
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Team;
