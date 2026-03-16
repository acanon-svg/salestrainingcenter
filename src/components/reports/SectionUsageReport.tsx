import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  BarChart3,
  Eye,
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { useSectionAnalytics, useUserSectionBreakdown } from "@/hooks/useSectionAnalytics";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
};

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

interface SectionUsageReportProps {
  dateRange: number;
}

export const SectionUsageReport: React.FC<SectionUsageReportProps> = ({ dateRange }) => {
  const { data: analytics, isLoading: loadingAnalytics } = useSectionAnalytics(dateRange);
  const { data: userBreakdown, isLoading: loadingBreakdown } = useUserSectionBreakdown(dateRange);
  const [userSearch, setUserSearch] = useState("");
  const [sortField, setSortField] = useState<"visits" | "duration">("visits");

  const sectionStats = analytics?.sectionStats || [];
  const totalVisits = sectionStats.reduce((sum, s) => sum + s.total_visits, 0);
  const totalUniqueUsers = new Set(analytics?.rawVisits?.map((v: any) => v.user_id) || []).size;
  const avgSessionDuration =
    sectionStats.length > 0
      ? Math.round(sectionStats.reduce((sum, s) => sum + s.total_duration_seconds, 0) / totalVisits || 0)
      : 0;

  const topSections = sectionStats.slice(0, 5);
  const bottomSections = [...sectionStats].reverse().slice(0, 5);

  // Chart data
  const chartData = sectionStats.map((s) => ({
    name: s.section_label,
    visitas: s.total_visits,
    usuarios: s.unique_users,
  }));

  // Duration chart data
  const durationChartData = [...sectionStats]
    .sort((a, b) => b.avg_duration_seconds - a.avg_duration_seconds)
    .map((s) => ({
      name: s.section_label,
      duracion: Math.round(s.avg_duration_seconds / 60 * 100) / 100,
    }));

  // Filter user breakdown
  const filteredUsers = (userBreakdown || []).filter(
    (u) =>
      u.user_name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.user_email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.section_label.toLowerCase().includes(userSearch.toLowerCase())
  );

  const sortedUsers = [...filteredUsers].sort((a, b) =>
    sortField === "visits" ? b.visits - a.visits : b.total_duration_seconds - a.total_duration_seconds
  );

  // Aggregate per-user total visits
  const userTotals: Record<string, { name: string; email: string; visits: number; duration: number; sections: number }> = {};
  (userBreakdown || []).forEach((u) => {
    if (!userTotals[u.user_id]) {
      userTotals[u.user_id] = { name: u.user_name, email: u.user_email, visits: 0, duration: 0, sections: 0 };
    }
    userTotals[u.user_id].visits += u.visits;
    userTotals[u.user_id].duration += u.total_duration_seconds;
    userTotals[u.user_id].sections++;
  });

  const topUsers = Object.values(userTotals).sort((a, b) => b.visits - a.visits).slice(0, 10);

  if (loadingAnalytics) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Eye className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{totalVisits.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Visitas Totales</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-chart-2" />
              <p className="text-2xl font-bold">{totalUniqueUsers}</p>
              <p className="text-xs text-muted-foreground">Usuarios Únicos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-chart-3" />
              <p className="text-2xl font-bold">{sectionStats.length}</p>
              <p className="text-xs text-muted-foreground">Secciones Activas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-chart-4" />
              <p className="text-2xl font-bold">{formatDuration(avgSessionDuration)}</p>
              <p className="text-xs text-muted-foreground">Duración Promedio</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visits by Section Chart */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Visitas por Sección
          </CardTitle>
          <CardDescription>Distribución de visitas y usuarios únicos por sección del portal</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="visitas" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Visitas" />
                <Bar dataKey="usuarios" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} name="Usuarios únicos" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aún no hay datos de uso. Los datos se registrarán conforme los usuarios naveguen el portal.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Duration by Section Chart */}
      {durationChartData.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-chart-4" />
              Tiempo Promedio por Sección
            </CardTitle>
            <CardDescription>Duración promedio de cada visita en minutos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={durationChartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" unit=" min" />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value} min`, "Duración promedio"]}
                />
                <Bar dataKey="duracion" radius={[0, 4, 4, 0]} name="Duración (min)">
                  {durationChartData.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top & Bottom Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              Top 5 Secciones Más Visitadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topSections.map((section, i) => (
              <div key={section.section_key} className="flex items-center gap-3">
                <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{section.section_label}</span>
                    <Badge variant="secondary">{section.total_visits} visitas</Badge>
                  </div>
                  <Progress
                    value={totalVisits > 0 ? (section.total_visits / totalVisits) * 100 : 0}
                    className="h-2"
                  />
                </div>
              </div>
            ))}
            {topSections.length === 0 && (
              <p className="text-muted-foreground text-center py-4">Sin datos disponibles</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-destructive" />
              Top 5 Secciones Menos Visitadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bottomSections.map((section, i) => (
              <div key={section.section_key} className="flex items-center gap-3">
                <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{section.section_label}</span>
                    <Badge variant="outline">{section.total_visits} visitas</Badge>
                  </div>
                  <Progress
                    value={totalVisits > 0 ? (section.total_visits / totalVisits) * 100 : 0}
                    className="h-2 [&>div]:bg-muted-foreground"
                  />
                </div>
              </div>
            ))}
            {bottomSections.length === 0 && (
              <p className="text-muted-foreground text-center py-4">Sin datos disponibles</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Users by Usage */}
      {topUsers.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-chart-2" />
              Top 10 Usuarios Más Activos
            </CardTitle>
            <CardDescription>Usuarios con mayor actividad en el portal</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead className="text-center">Visitas</TableHead>
                  <TableHead className="text-center">Secciones</TableHead>
                  <TableHead className="text-center">Tiempo Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUsers.map((user, i) => (
                  <TableRow key={user.email}>
                    <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{user.visits}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{user.sections}</TableCell>
                    <TableCell className="text-center text-sm">{formatDuration(user.duration)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Detailed User-Section Breakdown */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5 text-primary" />
            Desglose por Usuario y Sección
          </CardTitle>
          <CardDescription>Detalle de actividad de cada miembro por sección</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuario o sección..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Badge
              variant={sortField === "visits" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSortField("visits")}
            >
              Por visitas
            </Badge>
            <Badge
              variant={sortField === "duration" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSortField("duration")}
            >
              Por duración
            </Badge>
          </div>

          {loadingBreakdown ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : sortedUsers.length > 0 ? (
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Sección</TableHead>
                    <TableHead className="text-center">Visitas</TableHead>
                    <TableHead className="text-center">Tiempo Total</TableHead>
                    <TableHead className="text-center">Última Visita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.slice(0, 100).map((row) => (
                    <TableRow key={`${row.user_id}-${row.section_key}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{row.user_name}</p>
                          <p className="text-xs text-muted-foreground">{row.user_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.section_label}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{row.visits}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {formatDuration(row.total_duration_seconds)}
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">
                        {new Date(row.last_visited).toLocaleDateString("es-CO", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay datos de uso disponibles para el período seleccionado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
