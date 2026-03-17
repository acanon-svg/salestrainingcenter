import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useImpactDashboardData } from "@/hooks/useImpactDashboardData";
import { TrainingCorrelationPanel } from "@/components/impact/TrainingCorrelationPanel";
import { EngagementCorrelationPanel } from "@/components/impact/EngagementCorrelationPanel";
import { FeatureUsagePanel } from "@/components/impact/FeatureUsagePanel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, BarChart3, Users, Clock, BookOpen, Activity } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const teamOptions = [
  { value: "all", label: "Todos los equipos" },
  { value: "Hunters", label: "Hunters" },
  { value: "Farmers", label: "Farmers" },
  { value: "MBs", label: "MBs" },
  { value: "Leaders", label: "Leaders" },
];

const periodOptions = [
  { value: "30", label: "Últimos 30 días" },
  { value: "60", label: "Últimos 60 días" },
  { value: "90", label: "Últimos 90 días" },
];

const ImpactDashboard: React.FC = () => {
  const [teamFilter, setTeamFilter] = useState("all");
  const [period, setPeriod] = useState("30");

  const { data, isLoading } = useImpactDashboardData(teamFilter, parseInt(period));

  const exportCSV = (rows: Record<string, any>[], filename: string) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => `"${r[h] ?? ""}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const users = data?.users || [];
  const featureStats = data?.featureStats || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Impact Dashboard</h1>
            <p className="text-muted-foreground">Mide el impacto real del entrenamiento en los resultados de negocio</p>
          </div>
          <div className="flex gap-2">
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {teamOptions.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{users.length}</p>
                      <p className="text-xs text-muted-foreground">Usuarios analizados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">
                        {users.length > 0 ? Math.round(users.reduce((s, u) => s + u.modules_completed, 0) / users.length) : 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Promedio módulos completados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">
                        {users.length > 0 ? Math.round(users.reduce((s, u) => s + u.quiz_avg_score, 0) / users.length) : 0}%
                      </p>
                      <p className="text-xs text-muted-foreground">Promedio quiz score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">
                        {users.length > 0 ? Math.round(users.reduce((s, u) => s + u.days_active, 0) / users.length) : 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Promedio días activos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Question 1 */}
            <div>
              <h2 className="text-lg font-semibold mb-1">¿El entrenamiento realmente mueve las métricas de negocio?</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Correlación entre consumo de la plataforma y desempeño comercial por usuario
              </p>
              <TrainingCorrelationPanel
                users={users}
                onExport={() => exportCSV(users.map(u => ({
                  Nombre: u.user_name,
                  Email: u.user_email,
                  Equipo: u.team,
                  "Módulos completados": u.modules_completed,
                  "Quiz promedio": u.quiz_avg_score,
                  Insignias: u.badges_earned,
                  "Días activos": u.days_active,
                  "Firmas promedio/mes": u.signatures_month,
                  "Originaciones promedio/mes": u.originations_month,
                  "GMV promedio/mes": u.gmv_month,
                  "Cumplimiento Firmas %": u.cumplimiento_firmas,
                  "Cumplimiento GMV %": u.cumplimiento_gmv,
                })), "impact-correlation")}
              />
            </div>

            <Separator />

            {/* Question 2 */}
            <div>
              <h2 className="text-lg font-semibold mb-1">¿Qué funcionalidades de la plataforma se usan realmente?</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Heatmap de uso y engagement por funcionalidad del portal
              </p>
              <FeatureUsagePanel
                featureStats={featureStats}
                last7days={data?.last7days || []}
                totalActiveUsers={data?.totalActiveUsers || 1}
                onExport={() => exportCSV(featureStats.map(f => ({
                  Funcionalidad: f.feature_label,
                  "Total usos": f.total_uses,
                  "Usuarios únicos": f.unique_users,
                  "% usuarios activos": f.pct_active_users,
                  "Baja adopción": f.is_dead ? "Sí" : "No",
                })), "feature-usage")}
              />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ImpactDashboard;
