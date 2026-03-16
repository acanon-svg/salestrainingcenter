import React, { useMemo, useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendDataPoint } from "@/hooks/useReportsData";
import { Skeleton } from "@/components/ui/skeleton";
import type { TeamResult } from "@/hooks/useTeamResults";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TrendLineChartProps {
  data: TrendDataPoint[] | undefined;
  isLoading: boolean;
  dateRange: string;
  teamResults?: TeamResult[];
  loadingTeamResults?: boolean;
}

const INDICATOR_LABELS: Record<string, string> = {
  firmas: "Firmas",
  originaciones: "Originaciones",
  gmv: "GMV (USD)",
};

const MONTH_NAMES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

export const TrendLineChart: React.FC<TrendLineChartProps> = ({
  data,
  isLoading,
  dateRange,
  teamResults,
  loadingTeamResults,
}) => {
  const [indicator, setIndicator] = useState<"firmas" | "originaciones" | "gmv">("firmas");
  const hasTeamResults = teamResults && teamResults.length > 0;

  // Aggregate team results by day
  const teamDailyData = useMemo(() => {
    if (!teamResults || teamResults.length === 0) return new Map<string, { real: number; meta: number }>();

    const map = new Map<string, { real: number; meta: number }>();

    teamResults.forEach((r) => {
      const d = new Date(r.period_date + "T00:00:00");
      const key = format(d, "dd MMM", { locale: es });

      if (!map.has(key)) map.set(key, { real: 0, meta: 0 });
      const entry = map.get(key)!;

      switch (indicator) {
        case "firmas":
          entry.real += Number(r.firmas_real);
          entry.meta += Number(r.firmas_meta);
          break;
        case "originaciones":
          entry.real += Number(r.originaciones_real);
          entry.meta += Number(r.originaciones_meta);
          break;
        case "gmv":
          entry.real += Number(r.gmv_real);
          entry.meta += Number(r.gmv_meta);
          break;
      }
    });

    return map;
  }, [teamResults, indicator]);

  // Training data (enrollments/completions) sampled
  const trainingChartData = useMemo(() => {
    if (!data) return [];
    if (data.length > 30) {
      const step = Math.ceil(data.length / 30);
      return data.filter((_, index) => index % step === 0);
    }
    return data;
  }, [data]);

  // Combined chart data by day when team results exist
  const combinedChartData = useMemo(() => {
    if (!hasTeamResults) return null;

    const days = [...teamDailyData.keys()];

    return days.map((dayLabel) => {
      const team = teamDailyData.get(dayLabel) || { real: 0, meta: 0 };
      return {
        date: dayLabel,
        real: team.real,
        meta: team.meta,
      };
    });
  }, [hasTeamResults, teamDailyData]);

  // Also build training-only view with team results overlay per month
  const mergedChartData = useMemo(() => {
    if (!hasTeamResults) return trainingChartData;

    // If we have team results, show monthly combined view
    // Aggregate training completions by month
    const trainingByMonth = new Map<string, { enrollments: number; completions: number }>();

    if (data) {
      // data points have date like "01 ene", "15 feb" etc
      // We need to group them by month label matching team results format
      // Since training data uses "dd MMM" and team uses "Mes YYYY", we'll use a combined approach
      data.forEach((point) => {
        // We can't perfectly match without year info, so let's just present both datasets
      });
    }

    return null; // Signal to use dual-axis chart
  }, [hasTeamResults, trainingChartData, data]);

  const getPeriodLabel = () => {
    switch (dateRange) {
      case "7": return "los últimos 7 días";
      case "15": return "los últimos 15 días";
      case "30": return "los últimos 30 días";
      case "90": return "los últimos 90 días";
      case "365": return "el último año";
      default: return "el período seleccionado";
    }
  };

  const anyLoading = isLoading || loadingTeamResults;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle>Tendencia de Actividad</CardTitle>
            <CardDescription>
              {hasTeamResults
                ? `Entrenamiento vs. Métricas del equipo (${INDICATOR_LABELS[indicator]})`
                : `Inscripciones y completados durante ${getPeriodLabel()}`}
            </CardDescription>
          </div>
          {(hasTeamResults || loadingTeamResults) && (
            <Select value={indicator} onValueChange={(v) => setIndicator(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="firmas">Firmas</SelectItem>
                <SelectItem value="originaciones">Originaciones</SelectItem>
                <SelectItem value="gmv">GMV (USD)</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {anyLoading ? (
          <Skeleton className="h-[350px] w-full" />
        ) : hasTeamResults && combinedChartData && combinedChartData.length > 0 ? (
          <div className="space-y-4">
            {/* Training activity mini-chart */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">📚 Actividad de Entrenamiento</p>
              <div className="h-[160px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trainingChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} allowDecimals={false} width={35} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Bar dataKey="enrollments" name="Inscripciones" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} barSize={12} />
                    <Bar dataKey="completions" name="Completados" fill="hsl(var(--success))" radius={[2, 2, 0, 0]} barSize={12} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Team metrics chart */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">📊 Métricas del Equipo — {INDICATOR_LABELS[indicator]}</p>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={combinedChartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} width={50} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => value.toLocaleString("es-CO")}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Bar dataKey="real" name="Resultado Real" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={20} />
                    <Line
                      type="monotone"
                      dataKey="meta"
                      name="Meta"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : trainingChartData.length > 0 ? (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trainingChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "10px" }}
                  formatter={(value) => <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>}
                />
                <Line
                  type="monotone"
                  dataKey="enrollments"
                  name="Inscripciones"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="completions"
                  name="Completados"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--success))", strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No hay datos disponibles para el período seleccionado
          </div>
        )}
      </CardContent>
    </Card>
  );
};
