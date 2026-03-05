import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import { MemberCourseBreakdown } from "@/hooks/useTeamMemberCourseBreakdown";

interface TeamMemberBreakdownTableProps {
  data: MemberCourseBreakdown[] | undefined;
  isLoading: boolean;
}

export const TeamMemberBreakdownTable: React.FC<TeamMemberBreakdownTableProps> = ({
  data,
  isLoading,
}) => {
  const [search, setSearch] = useState("");

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) return null;

  const filtered = data.filter(
    (m) =>
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      (m.team || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Desglose por Miembro del Equipo
            </CardTitle>
            <CardDescription>
              Detalle de cursos por cada miembro de la región ({data.length} miembros)
            </CardDescription>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar miembro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Miembro</TableHead>
                <TableHead className="text-center">Equipo</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5 text-success" />
                    Completados
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-addi-yellow" />
                    En Curso
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                    Sin Iniciar
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <XCircle className="h-3.5 w-3.5 text-destructive" />
                    No Aprobados
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                    Vencidos
                  </div>
                </TableHead>
                <TableHead className="text-center">Promedio</TableHead>
                <TableHead className="text-center">Compliance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((member) => (
                <TableRow key={member.user_id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{member.full_name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-xs">
                      {member.team || "Sin equipo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-success">{member.completed}</span>
                    <span className="text-xs text-muted-foreground">/{member.total_courses}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-addi-yellow">
                      {Math.max(0, member.in_progress)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-muted-foreground">
                      {member.not_started}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-destructive">{member.failed}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-destructive">{member.expired}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      className={
                        member.avg_score >= 80
                          ? "bg-success"
                          : member.avg_score >= 60
                          ? "bg-addi-yellow text-black"
                          : "bg-destructive"
                      }
                    >
                      {member.avg_score}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <Progress
                        value={member.completion_rate}
                        className={`h-2 flex-1 ${
                          member.completion_rate >= 80
                            ? "[&>div]:bg-success"
                            : member.completion_rate >= 60
                            ? "[&>div]:bg-addi-yellow"
                            : "[&>div]:bg-destructive"
                        }`}
                      />
                      <span className="text-xs font-medium w-10 text-right">
                        {member.completion_rate}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No se encontraron miembros con ese criterio de búsqueda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
