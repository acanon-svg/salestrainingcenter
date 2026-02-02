import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Users, Briefcase, Trophy } from "lucide-react";
import { TeamMemberTable, TeamMember } from "./TeamMemberTable";

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

interface SubordinateLeaderCardProps {
  leader: SubordinateLeader;
}

export const SubordinateLeaderCard: React.FC<SubordinateLeaderCardProps> = ({ leader }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch team members for this subordinate leader's TEAM AND REGIONAL
  const { data: teamMembers, isLoading: membersLoading } = useQuery({
    queryKey: ["subordinate-team-members-by-team-regional", leader.team, leader.regional],
    queryFn: async () => {
      if (!leader.team) return [];
      
      let query = supabase
        .from("profiles")
        .select("id, user_id, full_name, email, avatar_url, team, company_role, points, badges_count")
        .eq("team", leader.team);
      
      // Filter by regional if the leader has one assigned
      if (leader.regional) {
        query = query.eq("regional", leader.regional);
      }
      
      const { data, error } = await query.order("points", { ascending: false });

      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: isOpen && !!leader.team,
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

  const totalPoints = teamMembers?.reduce((sum, m) => sum + m.points, 0) || 0;
  const memberCount = teamMembers?.length || 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-l-4 border-l-primary/50">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={leader.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(leader.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {leader.full_name || "Sin nombre"}
                    <Badge variant="outline" className="text-xs">Líder</Badge>
                  </CardTitle>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    {leader.team && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {leader.team}
                      </span>
                    )}
                    {leader.regional && (
                      <span className="flex items-center gap-1 text-xs opacity-70">
                        ({leader.regional})
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <div className="flex items-center gap-2 justify-end">
                    <Trophy className="h-4 w-4 text-addi-orange" />
                    <span className="font-semibold">{leader.points.toLocaleString()} pts</span>
                  </div>
                  {isOpen && memberCount > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {memberCount} miembros · {totalPoints.toLocaleString()} pts totales
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {leader.team ? (
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Equipo de {leader.full_name}
                </h4>
                <TeamMemberTable 
                  members={teamMembers} 
                  isLoading={membersLoading} 
                  compact 
                />
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Este líder no tiene un equipo asignado
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
