import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { LevelBadge } from "@/components/gamification/LevelBadge";

export interface TeamMember {
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

interface TeamMemberTableProps {
  members: TeamMember[] | undefined;
  isLoading: boolean;
  compact?: boolean;
}

export const TeamMemberTable: React.FC<TeamMemberTableProps> = ({
  members,
  isLoading,
  compact = false,
}) => {
  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Miembro</TableHead>
            {!compact && <TableHead>Cargo</TableHead>}
            <TableHead>Equipo</TableHead>
            <TableHead className="text-center">Nivel</TableHead>
            <TableHead className="text-center">Puntos</TableHead>
            {!compact && <TableHead className="text-center">Insignias</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members?.map((member, index) => (
            <TableRow key={member.id}>
              <TableCell className="font-medium text-muted-foreground">
                {index + 1}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className={compact ? "h-7 w-7" : "h-9 w-9"}>
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.full_name || "Sin nombre"}</p>
                    {!compact && (
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    )}
                  </div>
                </div>
              </TableCell>
              {!compact && <TableCell>{member.company_role || "-"}</TableCell>}
              <TableCell>{member.team || "-"}</TableCell>
              <TableCell className="text-center">
                <LevelBadge points={member.points} size="sm" />
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className="bg-addi-orange/10 text-addi-orange border-addi-orange/20">
                  {member.points.toLocaleString()}
                </Badge>
              </TableCell>
              {!compact && (
                <TableCell className="text-center">
                  <Badge variant="secondary">{member.badges_count}</Badge>
                </TableCell>
              )}
            </TableRow>
          ))}
          {(!members || members.length === 0) && (
            <TableRow>
              <TableCell colSpan={compact ? 5 : 7} className="text-center py-8 text-muted-foreground">
                No hay miembros en este equipo
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
