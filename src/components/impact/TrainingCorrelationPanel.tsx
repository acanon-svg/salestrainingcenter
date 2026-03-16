import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from "recharts";
import type { UserTrainingData } from "@/hooks/useImpactDashboardData";

interface Props {
  users: UserTrainingData[];
  onExport: () => void;
}

type MetricKey = "gmv_month" | "signatures_month" | "originations_month" | "conversion_rate";

const metricOptions: { value: MetricKey; label: string; format: (v: number) => string }[] = [
  { value: "gmv_month", label: "GMV Mensual (USD)", format: (v) => `$${v.toLocaleString()}` },
  { value: "signatures_month", label: "Firmas Mensuales", format: (v) => v.toLocaleString() },
  { value: "originations_month", label: "Originaciones Mensuales", format: (v) => v.toLocaleString() },
  { value: "conversion_rate", label: "Tasa de Conversión (%)", format: (v) => `${v}%` },
];

export const TrainingCorrelationPanel: React.FC<Props> = ({ users, onExport }) => {
  const [metric, setMetric] = useState<MetricKey>("gmv_month");

  const selectedMetric = metricOptions.find(m => m.value === metric)!;

  const scatterData = useMemo(() => {
    return users.map(u => ({
      name: u.user_name,
      training: u.modules_completed,
      business: u[metric],
      team: u.team,
      pct: Math.round((u.modules_completed / Math.max(u.total_modules, 1)) * 100),
    }));
  }, [users, metric]);

  // Compute summary: top 25% vs bottom 25%
  const summary = useMemo(() => {
    if (users.length < 4) return null;
    const sorted = [...users].sort((a, b) => b.modules_completed - a.modules_completed);
    const q = Math.max(1, Math.floor(sorted.length * 0.25));
    const top25 = sorted.slice(0, q);
    const bottom25 = sorted.slice(-q);
    const avgTop = top25.reduce((s, u) => s + u[metric], 0) / top25.length;
    const avgBottom = bottom25.reduce((s, u) => s + u[metric], 0) / bottom25.length;
    const delta = avgBottom > 0 ? Math.round(((avgTop - avgBottom) / avgBottom) * 100) : 0;
    return { avgTop, avgBottom, delta, topCount: top25.length, bottomCount: bottom25.length };
  }, [users, metric]);

  // Simple linear trend line points
  const trendLine = useMemo(() => {
    if (scatterData.length < 2) return [];
    const n = scatterData.length;
    const sumX = scatterData.reduce((s, d) => s + d.training, 0);
    const sumY = scatterData.reduce((s, d) => s + d.business, 0);
    const sumXY = scatterData.reduce((s, d) => s + d.training * d.business, 0);
    const sumX2 = scatterData.reduce((s, d) => s + d.training * d.training, 0);
    const denom = n * sumX2 - sumX * sumX;
    if (denom === 0) return [];
    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;
    const minX = Math.min(...scatterData.map(d => d.training));
    const maxX = Math.max(...scatterData.map(d => d.training));
    return [
      { training: minX, trend: Math.round(slope * minX + intercept) },
      { training: maxX, trend: Math.round(slope * maxX + intercept) },
    ];
  }, [scatterData]);

  const teamColors: Record<string, string> = {
    Hunters: "hsl(var(--primary))",
    Farmers: "hsl(var(--chart-2))",
    MBs: "hsl(var(--chart-3))",
    Leaders: "hsl(var(--chart-4))",
    Otro: "hsl(var(--chart-5))",
  };

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      {summary && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  {summary.delta > 0 ? (
                    <TrendingUp className="h-6 w-6 text-primary" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-destructive" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-bold">
                    Los representantes entrenados generan{" "}
                    <span className="text-primary">{Math.abs(summary.delta)}% {summary.delta >= 0 ? "más" : "menos"}</span>{" "}
                    {selectedMetric.label.toLowerCase()} que los no entrenados
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Top 25% ({summary.topCount} usuarios) promedio: {selectedMetric.format(Math.round(summary.avgTop))} vs
                    Bottom 25% ({summary.bottomCount} usuarios) promedio: {selectedMetric.format(Math.round(summary.avgBottom))}
                  </p>
                </div>
              </div>
              <Badge variant={summary.delta > 0 ? "default" : "destructive"} className="text-base px-4 py-1">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                {summary.delta > 0 ? "+" : ""}{summary.delta}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scatter Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Correlación: Entrenamiento vs Desempeño</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={metric} onValueChange={(v) => setMetric(v as MetricKey)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {metricOptions.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={scatterData} margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="training"
                  type="number"
                  name="Módulos completados"
                  label={{ value: "Módulos completados", position: "bottom", offset: 0, style: { fontSize: 12 } }}
                />
                <YAxis
                  dataKey="business"
                  type="number"
                  name={selectedMetric.label}
                  label={{ value: selectedMetric.label, angle: -90, position: "insideLeft", style: { fontSize: 12 } }}
                />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0]?.payload;
                    if (!d?.name) return null;
                    return (
                      <div className="bg-popover border rounded-lg p-3 shadow-lg text-sm">
                        <p className="font-medium">{d.name}</p>
                        <p className="text-muted-foreground">{d.team}</p>
                        <p>Módulos: {d.training} ({d.pct}%)</p>
                        <p>{selectedMetric.label}: {selectedMetric.format(d.business)}</p>
                      </div>
                    );
                  }}
                />
                {Object.entries(teamColors).map(([team, color]) => (
                  <Scatter
                    key={team}
                    name={team}
                    data={scatterData.filter(d => d.team === team)}
                    fill={color}
                    opacity={0.7}
                  />
                ))}
                <Line
                  data={trendLine}
                  dataKey="trend"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  legendType="none"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {Object.entries(teamColors).map(([team, color]) => (
              <div key={team} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                {team}
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-6 border-t-2 border-dashed border-destructive" />
              Línea de tendencia
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
