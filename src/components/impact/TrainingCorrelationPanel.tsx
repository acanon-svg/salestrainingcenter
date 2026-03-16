import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, TrendingUp, TrendingDown, ArrowUpRight, ChevronRight, Medal } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { UserTrainingData } from "@/hooks/useImpactDashboardData";

interface Props {
  users: UserTrainingData[];
  onExport: () => void;
}

type MetricKey = "gmv_month" | "signatures_month" | "originations_month" | "conversion_rate";

const metricOptions: { value: MetricKey; label: string; shortLabel: string; format: (v: number) => string }[] = [
  { value: "gmv_month", label: "GMV Mensual (USD)", shortLabel: "GMV", format: (v) => `$${v.toLocaleString()}` },
  { value: "signatures_month", label: "Firmas Mensuales", shortLabel: "Firmas", format: (v) => v.toLocaleString() },
  { value: "originations_month", label: "Originaciones Mensuales", shortLabel: "Orig.", format: (v) => v.toLocaleString() },
  { value: "conversion_rate", label: "Tasa de Conversión (%)", shortLabel: "Conv.", format: (v) => `${v}%` },
];

export const TrainingCorrelationPanel: React.FC<Props> = ({ users, onExport }) => {
  const [metric, setMetric] = useState<MetricKey>("gmv_month");
  const [showDrilldown, setShowDrilldown] = useState(false);

  const selectedMetric = metricOptions.find(m => m.value === metric)!;

  // Sort users by training intensity
  const rankedUsers = useMemo(() => {
    return [...users]
      .map(u => ({
        ...u,
        pct: Math.round((u.modules_completed / Math.max(u.total_modules, 1)) * 100),
      }))
      .sort((a, b) => b.modules_completed - a.modules_completed);
  }, [users]);

  // Top 25% vs Bottom 25% summary
  const summary = useMemo(() => {
    if (users.length < 4) return null;
    const sorted = [...users].sort((a, b) => b.modules_completed - a.modules_completed);
    const q = Math.max(1, Math.floor(sorted.length * 0.25));
    const top25 = sorted.slice(0, q);
    const bottom25 = sorted.slice(-q);
    const avgTop = top25.reduce((s, u) => s + u[metric], 0) / top25.length;
    const avgBottom = bottom25.reduce((s, u) => s + u[metric], 0) / bottom25.length;
    const delta = avgBottom > 0 ? Math.round(((avgTop - avgBottom) / avgBottom) * 100) : 0;
    return { avgTop, avgBottom, delta, topCount: top25.length, bottomCount: bottom25.length, top25, bottom25 };
  }, [users, metric]);

  // Bar chart data: top 15 users
  const barData = useMemo(() => {
    return rankedUsers.slice(0, 15).map(u => ({
      name: u.user_name.length > 18 ? u.user_name.substring(0, 16) + "…" : u.user_name,
      fullName: u.user_name,
      training: u.modules_completed,
      business: u[metric],
      team: u.team,
      pct: u.pct,
    }));
  }, [rankedUsers, metric]);

  const teamColors: Record<string, string> = {
    Hunters: "hsl(var(--primary))",
    Farmers: "hsl(var(--chart-2))",
    MBs: "hsl(var(--chart-3))",
    Leaders: "hsl(var(--chart-4))",
    Otro: "hsl(var(--chart-5))",
  };

  // Drilldown: compare each top25 user vs bottom25 average
  const drilldownData = useMemo(() => {
    if (!summary) return [];
    return summary.top25.map(u => ({
      ...u,
      metricValue: u[metric],
      vsBottom: summary.avgBottom > 0
        ? Math.round(((u[metric] - summary.avgBottom) / summary.avgBottom) * 100)
        : 0,
    })).sort((a, b) => b.metricValue - a.metricValue);
  }, [summary, metric]);

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      {summary && (
        <Card
          className="border-primary/20 bg-primary/5 cursor-pointer hover:border-primary/40 transition-colors"
          onClick={() => setShowDrilldown(true)}
        >
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
                    {selectedMetric.shortLabel.toLowerCase()} que los no entrenados
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Top 25% ({summary.topCount}): {selectedMetric.format(Math.round(summary.avgTop))} promedio vs
                    Bottom 25% ({summary.bottomCount}): {selectedMetric.format(Math.round(summary.avgBottom))} promedio
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={summary.delta > 0 ? "default" : "destructive"} className="text-base px-4 py-1">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  {summary.delta > 0 ? "+" : ""}{summary.delta}%
                </Badge>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metric selector + export */}
      <div className="flex items-center gap-2 justify-end">
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

      {/* Bar Chart: Top 15 users — Training vs Business side-by-side */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Top 15 Usuarios: Módulos Completados vs {selectedMetric.shortLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0]?.payload;
                    if (!d) return null;
                    return (
                      <div className="bg-popover border rounded-lg p-3 shadow-lg text-sm">
                        <p className="font-medium">{d.fullName}</p>
                        <p className="text-muted-foreground">{d.team}</p>
                        <p>Módulos: {d.training} ({d.pct}%)</p>
                        <p>{selectedMetric.label}: {selectedMetric.format(d.business)}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="business" radius={[0, 4, 4, 0]} barSize={18}>
                  {barData.map((entry, index) => (
                    <Cell key={index} fill={teamColors[entry.team] || "hsl(var(--primary))"} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {Object.entries(teamColors).map(([team, color]) => (
              <div key={team} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                {team}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ranking Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ranking Completo: Entrenamiento vs {selectedMetric.shortLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Equipo</TableHead>
                  <TableHead className="text-right">Módulos</TableHead>
                  <TableHead className="text-right">Avance</TableHead>
                  <TableHead className="text-right">Quiz Avg</TableHead>
                  <TableHead className="text-right">{selectedMetric.shortLabel}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankedUsers.map((u, i) => {
                  const isTop25 = summary && i < summary.topCount;
                  const isBottom25 = summary && i >= rankedUsers.length - summary.bottomCount;
                  return (
                    <TableRow
                      key={u.user_id}
                      className={
                        isTop25
                          ? "bg-primary/5"
                          : isBottom25
                          ? "bg-destructive/5"
                          : ""
                      }
                    >
                      <TableCell className="font-medium text-muted-foreground">
                        {i + 1}
                        {isTop25 && <Medal className="h-3 w-3 inline ml-1 text-primary" />}
                      </TableCell>
                      <TableCell className="font-medium">{u.user_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{u.team}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{u.modules_completed}</TableCell>
                      <TableCell className="text-right">{u.pct}%</TableCell>
                      <TableCell className="text-right">{u.quiz_avg_score}%</TableCell>
                      <TableCell className="text-right font-semibold">
                        {selectedMetric.format(u[metric])}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            <span className="inline-block w-3 h-3 rounded bg-primary/20 mr-1 align-middle" /> Top 25% entrenados
            <span className="mx-3">|</span>
            <span className="inline-block w-3 h-3 rounded bg-destructive/20 mr-1 align-middle" /> Bottom 25%
          </p>
        </CardContent>
      </Card>

      {/* Drilldown Dialog */}
      <Dialog open={showDrilldown} onOpenChange={setShowDrilldown}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5 text-primary" />
              Top 25% Entrenados — Detalle Individual
            </DialogTitle>
          </DialogHeader>
          {summary && (
            <div className="space-y-4">
              <Card className="bg-muted/50">
                <CardContent className="pt-4 pb-3">
                  <p className="text-sm">
                    Cada usuario del <strong>Top 25%</strong> comparado contra el promedio del <strong>Bottom 25%</strong>{" "}
                    ({selectedMetric.format(Math.round(summary.avgBottom))})
                  </p>
                </CardContent>
              </Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Equipo</TableHead>
                    <TableHead className="text-right">Módulos</TableHead>
                    <TableHead className="text-right">{selectedMetric.shortLabel}</TableHead>
                    <TableHead className="text-right">vs Bottom 25%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drilldownData.map((u, i) => (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{u.user_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{u.team}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{u.modules_completed}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {selectedMetric.format(u.metricValue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={u.vsBottom > 0 ? "default" : "destructive"} className="text-xs">
                          {u.vsBottom > 0 ? "+" : ""}{u.vsBottom}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
