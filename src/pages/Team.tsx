import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useLeaderRegion } from "@/hooks/useLeaderRegion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Shield, MapPin, Loader2, Trophy, Target, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { LevelBadge } from "@/components/gamification/LevelBadge";

interface TeamMember {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  team: string | null;
  company_role: string | null;
  points: number;
  badges_count: number;
}

const Team: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { data: leaderRegion, isLoading: regionLoading } = useLeaderRegion(user?.id);
  const isLeader = hasRole("lider");

  const { data: teamMembers, isLoading: membersLoading } = useQuery({
    queryKey: ["team-members", leaderRegion?.regional],
    queryFn: async () => {
      if (!leaderRegion?.regional) return [];
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, email, avatar_url, team, company_role, points, badges_count")
        .eq("regional", leaderRegion.regional)
        .order("points", { ascending: false });

      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !!leaderRegion?.regional,
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

  if (regionLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!leaderRegion) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
              <CardTitle>Sin Región Asignada</CardTitle>
              <CardDescription>
                Aún no tienes una región asignada. Contacta al administrador para que te asigne una región.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const totalPoints = teamMembers?.reduce((sum, m) => sum + m.points, 0) || 0;
  const avgPoints = teamMembers?.length ? Math.round(totalPoints / teamMembers.length) : 0;
  const topPerformer = teamMembers?.[0];

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
              Supervisa el progreso de los miembros de tu región
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {leaderRegion.regional}
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{teamMembers?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Miembros</p>
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

        {/* Team Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Miembros del Equipo
            </CardTitle>
            <CardDescription>
              Rendimiento detallado de cada miembro de tu región
            </CardDescription>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Miembro</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Equipo</TableHead>
                      <TableHead className="text-center">Nivel</TableHead>
                      <TableHead className="text-center">Puntos</TableHead>
                      <TableHead className="text-center">Insignias</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers?.map((member, index) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={member.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {getInitials(member.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.full_name || "Sin nombre"}</p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{member.company_role || "-"}</TableCell>
                        <TableCell>{member.team || "-"}</TableCell>
                        <TableCell className="text-center">
                          <LevelBadge points={member.points} size="sm" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-addi-orange/10 text-addi-orange border-addi-orange/20">
                            {member.points.toLocaleString()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{member.badges_count}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!teamMembers || teamMembers.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No hay miembros en esta región
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Team;
