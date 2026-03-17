import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Activity, TrendingUp, TrendingDown, ArrowUpRight, Database, AlertCircle } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ZAxis } from "recharts";
import type { UserTrainingData } from "@/hooks/useImpactDashboardData";

interface Props {
  users: UserTrainingData[];
  onExport: () => void;
}

type EngagementKey = "engagement_score" | "days_active" | "total_visits" | "total_time_minutes";
type BusinessKey = "gmv_month" | "signatures_month" | "cumplimiento_firmas" | "cumplimiento_gmv";

const engagementOptions: { value: EngagementKey; label: string; shortLabel: string; format: (v: number) => string }[] = [
  { value: "engagement_score", label: "Score de Engagement (0-100)", shortLabel: "Engagement", format: (v) => `${v}` },
  { value: "days_active", label: "Días Activos en Plataforma", shortLabel: "Días Activos", format: (v) => `${v} días` },
  { value: "total_visits", label: "Total Visitas a Secciones", shortLabel: "Visitas", format: (v) => v.toLocaleString() },
  { value: "total_time_minutes", label: "Tiempo Total en Plataforma (min)", shortLabel: "Tiempo (min)", format: (v) => `${v} min` },
];

const businessOptions: { value: BusinessKey; label: string; shortLabel: string; format: (v: number) => string }[] = [
  { value: "gmv_month", label: "GMV Mensual Promedio (USD)", shortLabel: "GMV", format: (v) => `$${v.toLocaleString()}` },
  { value: "signatures_month", label: "Firmas Promedio/Mes", shortLabel: "Firmas", format: (v) => v.toLocaleString() },
  { value: "cumplimiento_firmas", label: "Cumplimiento Firmas (%)", shortLabel: "Cumpl. Firmas", format: (v) => `${v}%` },
  { value: "cumplimiento_gmv", label: "Cumplimiento GMV (%)", shortLabel: "Cumpl. GMV", format: (v) => `${v}%` },
];

const teamColors: Record<string, string> = {
  Hunters: "hsl(var(--primary))",
  Farmers: "hsl(var(--chart-2))",
  MBs: "hsl(var(--chart-3))",
  Leaders: "hsl(var(--chart-4))",
  Otro: "hsl(var(--chart-5))",
};

export const EngagementCorrelationPanel: React.FC<Props> = ({ users, onExport }) => {
  const [engagementMetric, setEngagementMetric] = useState<EngagementKey>("engagement_score");
  const [businessMetric, setBusinessMetric] = useState<BusinessKey>("gmv_month");

  const selEngagement = engagementOptions.find(m => m.value === engagementMetric)!;
  const selBusiness = businessOptions.find(m => m.value === businessMetric)!;

  const usersWithBizData = useMemo(() => users.filter(u => u.has_real_business_data), [users]);
  const dataSource = usersWithBizData.length > 0 ? usersWithBizData : users;
  const hasRealData = usersWithBizData.length > 0;

  // Quartile analysis by engagement
  const quartileAnalysis = useMemo(() => {
    if (dataSource.length < 4) return null;
    const sorted = [...dataSource].sort((a, b) => b[engagementMetric] - a[engagementMetric]);
    const q = Math.max(1, Math.floor(sorted.length * 0.25));
    const highEngagement = sorted.slice(0, q);
    const lowEngagement = sorted.slice(-q);

    const avgHighBiz = highEngagement.reduce((s, u) => s + u[businessMetric], 0) / highEngagement.length;
    const avgLowBiz = lowEngagement.reduce((s, u) => s + u[businessMetric], 0) / lowEngagement.length;
    const avgHighEng = highEngagement.reduce((s, u) => s + u[engagementMetric], 0) / highEngagement.length;
    const avgLowEng = lowEngagement.reduce((s, u) => s + u[engagementMetric], 0) / lowEngagement.length;
    const delta = avgLowBiz > 0 ? Math.round(((avgHighBiz - avgLowBiz) / avgLowBiz) * 100) : 0;

    return {
      avgHighBiz, avgLowBiz, avgHighEng, avgLowEng,
      delta, highCount: highEngagement.length, lowCount: lowEngagement.length,
      highEngagement, lowEngagement,
    };
  }, [dataSource, engagementMetric, businessMetric]);

  // Scatter plot data
  const scatterData = useMemo(() => {
    return dataSource.map(u => ({
      x: u[engagementMetric],
      y: u[businessMetric],
      name: u.user_name,
      team: u.team,
      engagement_score: u.engagement_score,
      days_active: u.days_active,
      total_visits: u.total_visits,
    }));
  }, [dataSource, engagementMetric, businessMetric]);

  // Ranked by engagement
  const rankedUsers = useMemo(() => {
    return [...dataSource].sort((a, b) => b[engagementMetric] - a[engagementMetric]);
  }, [dataSource, engagementMetric]);

  // Compute simple correlation coefficient
  const correlation = useMemo(() => {
    if (scatterData.length < 3) return null;
    const n = scatterData.length;
    const sumX = scatterData.reduce((s, d) => s + d.x, 0);
    const sumY = scatterData.reduce((s, d) => s + d.y, 0);
    const sumXY = scatterData.reduce((s, d) => s + d.x * d.y, 0);
    const sumX2 = scatterData.reduce((s, d) => s + d.x * d.x, 0);
    const sumY2 = scatterData.reduce((s, d) => s + d.y * d.y, 0);
    const denom = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    if (denom === 0) return 0;
    return Math.round(((n * sumXY - sumX * sumY) / denom) * 100) / 100;
  }, [scatterData]);

  const correlationLabel = (r: number | null) => {
    if (r === null) return "Insuficientes datos";
    const abs = Math.abs(r);
    if (abs >= 0.7) return "Correlación fuerte";
    if (abs >= 0.4) return "Correlación moderada";
    if (abs >= 0.2) return "Correlación débil";
    return "Sin correlación significativa";
  };

  return (
    <div className="space-y-4">
      {/* Data source indicator */}
      <div className="flex items-center gap-2">
        {hasRealData ? (
          <Badge variant="outline" className="gap-1 text-xs bg-green-500/10 text-green-700 border-green-300">
            <Database className="h-3 w-3" />
            Datos reales — {usersWithBizData.length} hunters con métricas de negocio
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 text-xs bg-amber-500/10 text-amber-700 border-amber-300">
            <AlertCircle className="h-3 w-3" />
            Sin datos de negocio cargados
          </Badge>
        )}
      </div>

      {/* Summary Card */}
      {quartileAnalysis && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  {quartileAnalysis.delta > 0 ? (
                    <TrendingUp className="h-6 w-6 text-primary" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-destructive" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-bold">
                    Los usuarios más activos generan{" "}
                    <span className="text-primary">{Math.abs(quartileAnalysis.delta)}% {quartileAnalysis.delta >= 0 ? "más" : "menos"}</span>{" "}
                    {selBusiness.shortLabel.toLowerCase()} que los menos activos
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Top 25% engagement ({quartileAnalysis.highCount}): {selBusiness.format(Math.round(quartileAnalysis.avgHighBiz))} promedio vs
                    Bottom 25% ({quartileAnalysis.lowCount}): {selBusiness.format(Math.round(quartileAnalysis.avgLowBiz))} promedio
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Badge variant={quartileAnalysis.delta > 0 ? "default" : "destructive"} className="text-base px-4 py-1">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  {quartileAnalysis.delta > 0 ? "+" : ""}{quartileAnalysis.delta}%
                </Badge>
                {correlation !== null && (
                  <span className="text-xs text-muted-foreground">
                    r = {correlation} — {correlationLabel(correlation)}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metric selectors */}
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <Select value={engagementMetric} onValueChange={(v) => setEngagementMetric(v as EngagementKey)}>
          <SelectTrigger className="w-[260px]">
            <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {engagementOptions.map(m => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground text-sm">vs</span>
        <Select value={businessMetric} onValueChange={(v) => setBusinessMetric(v as BusinessKey)}>
          <SelectTrigger className="w-[260px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {businessOptions.map(m => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="h-4 w-4 mr-1" /> CSV
        </Button>
      </div>

      {/* Scatter Plot */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {selEngagement.shortLabel} vs {selBusiness.shortLabel} — Dispersión por usuario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name={selEngagement.shortLabel}
                  label={{ value: selEngagement.shortLabel, position: "bottom", offset: 0, style: { fontSize: 12 } }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name={selBusiness.shortLabel}
                  label={{ value: selBusiness.shortLabel, angle: -90, position: "insideLeft", offset: 5, style: { fontSize: 12 } }}
                />
                <ZAxis range={[50, 200]} />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0]?.payload;
                    if (!d) return null;
                    return (
                      <div className="bg-popover border rounded-lg p-3 shadow-lg text-sm">
                        <p className="font-medium">{d.name}</p>
                        <p className="text-muted-foreground">{d.team}</p>
                        <p>{selEngagement.label}: {selEngagement.format(d.x)}</p>
                        <p>{selBusiness.label}: {selBusiness.format(d.y)}</p>
                      </div>
                    );
                  }}
                />
                <Scatter data={scatterData}>
                  {scatterData.map((entry, index) => (
                    <Cell key={index} fill={teamColors[entry.team] || "hsl(var(--primary))"} opacity={0.75} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {Object.entries(teamColors).map(([team, color]) => (
              <div key={team} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                {team}
              </div>
            ))}
            {correlation !== null && (
              <Badge variant="outline" className="text-xs ml-4">
                Coeficiente de correlación: r = {correlation}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ranking Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Ranking por {selEngagement.shortLabel} vs {selBusiness.shortLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Equipo</TableHead>
                  <TableHead className="text-right">Engagement</TableHead>
                  <TableHead className="text-right">Días Activos</TableHead>
                  <TableHead className="text-right">Visitas</TableHead>
                  <TableHead className="text-right">Tiempo (min)</TableHead>
                  <TableHead className="text-right">{selBusiness.shortLabel}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankedUsers.map((u, i) => {
                  const q = Math.max(1, Math.floor(rankedUsers.length * 0.25));
                  const isTop = i < q;
                  const isBottom = i >= rankedUsers.length - q;
                  return (
                    <TableRow
                      key={u.user_id}
                      className={isTop ? "bg-primary/5" : isBottom ? "bg-destructive/5" : ""}
                    >
                      <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{u.user_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{u.team}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{u.engagement_score}</TableCell>
                      <TableCell className="text-right">{u.days_active}</TableCell>
                      <TableCell className="text-right">{u.total_visits}</TableCell>
                      <TableCell className="text-right">{u.total_time_minutes}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {selBusiness.format(u[businessMetric])}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            <span className="inline-block w-3 h-3 rounded bg-primary/20 mr-1 align-middle" /> Top 25% engagement
            <span className="mx-3">|</span>
            <span className="inline-block w-3 h-3 rounded bg-destructive/20 mr-1 align-middle" /> Bottom 25%
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
