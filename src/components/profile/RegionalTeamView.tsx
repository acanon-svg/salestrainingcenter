import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MapPin, Users, Trophy, Loader2, Mail, Briefcase } from "lucide-react";

interface TeamMember {
  user_id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  team: string | null;
  company_role: string | null;
  points: number;
  badges_count: number;
}

interface RegionalTeamViewProps {
  leaderRegional: string;
}

export const RegionalTeamView: React.FC<RegionalTeamViewProps> = ({ leaderRegional }) => {
  // Fetch all users in the same regional
  const { data: regionalMembers, isLoading } = useQuery({
    queryKey: ["regional-members", leaderRegional],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, avatar_url, team, company_role, points, badges_count")
        .eq("regional", leaderRegional)
        .order("team")
        .order("points", { ascending: false });

      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !!leaderRegional,
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

  // Group members by team
  const membersByTeam = React.useMemo(() => {
    if (!regionalMembers) return {};
    
    return regionalMembers.reduce((acc, member) => {
      const team = member.team || "Sin Equipo";
      if (!acc[team]) {
        acc[team] = [];
      }
      acc[team].push(member);
      return acc;
    }, {} as Record<string, TeamMember[]>);
  }, [regionalMembers]);

  const teamNames = Object.keys(membersByTeam).sort();
  const totalMembers = regionalMembers?.length || 0;
  const totalTeams = teamNames.length;

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!regionalMembers || regionalMembers.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Mi Regional
          </CardTitle>
          <CardDescription>
            No hay ejecutivos registrados en tu regional ({leaderRegional})
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Mi Regional: {leaderRegional}
        </CardTitle>
        <CardDescription>
          Visualiza todos los ejecutivos de tu regional organizados por equipo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold">{totalMembers}</p>
              <p className="text-xs text-muted-foreground">Ejecutivos</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Briefcase className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xl font-bold">{totalTeams}</p>
              <p className="text-xs text-muted-foreground">Equipos</p>
            </div>
          </div>
        </div>

        {/* Teams Accordion */}
        <Accordion type="multiple" className="space-y-2">
          {teamNames.map((teamName) => {
            const members = membersByTeam[teamName];
            const teamPoints = members.reduce((sum, m) => sum + m.points, 0);
            
            return (
              <AccordionItem 
                key={teamName} 
                value={teamName}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{teamName}</p>
                      <p className="text-xs text-muted-foreground">
                        {members.length} miembro{members.length !== 1 ? "s" : ""} • {teamPoints.toLocaleString()} pts
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    {members.map((member) => (
                      <div
                        key={member.user_id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(member.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {member.full_name || "Sin nombre"}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{member.email}</span>
                          </div>
                          {member.company_role && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {member.company_role}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 text-sm font-medium text-primary">
                            <Trophy className="h-3.5 w-3.5" />
                            {member.points.toLocaleString()}
                          </div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {member.badges_count} insignias
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
};
