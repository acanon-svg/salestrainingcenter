import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Table2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTeamResults } from "@/hooks/useTeamResults";
import { ResultsBarLineChart } from "./ResultsBarLineChart";
import { ResultsHeatmapTable } from "./ResultsHeatmapTable";
import { ResultsTimelineChart } from "./ResultsTimelineChart";

type Indicator = "firmas" | "originaciones" | "gmv";
type ChartType = "combined" | "table";
type TimePeriod = "90" | "180" | "365";

interface Props {
  /** If provided, shows only this user's data (student view) */
  userEmail?: string;
  /** If true, shows the bar+line chart (leaders/admins only) */
  showTeamChart?: boolean;
  /** If true, shows timeline filter for leaders */
  showTimePeriodFilter?: boolean;
  /** Regional filter */
  regional?: string;
}

export const ResultsSection: React.FC<Props> = ({
  userEmail,
  showTeamChart = false,
  showTimePeriodFilter = false,
  regional,
}) => {
  const [indicator, setIndicator] = useState<Indicator>("firmas");
  const [chartType, setChartType] = useState<ChartType>("combined");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("90");

  const { data: results, isLoading } = useTeamResults({
    regional,
    email: userEmail,
  });

  // Filter by time period
  const filteredByTime = React.useMemo(() => {
    if (!results) return [];
    const days = parseInt(timePeriod);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return results.filter((r) => new Date(r.period_date) >= cutoff);
  }, [results, timePeriod]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="pt-6 text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            {userEmail
              ? "Aún no hay resultados cargados para tu perfil."
              : "No hay resultados cargados para esta regional."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Indicador</Label>
          <Select value={indicator} onValueChange={(v) => setIndicator(v as Indicator)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="firmas">Firmas</SelectItem>
              <SelectItem value="originaciones">Originaciones</SelectItem>
              <SelectItem value="gmv">GMV (USD)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showTeamChart && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tipo de Gráfico</Label>
            <Select value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="combined">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Barras + Línea
                  </div>
                </SelectItem>
                <SelectItem value="table">
                  <div className="flex items-center gap-2">
                    <Table2 className="h-4 w-4" />
                    Tabla Heatmap
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {showTimePeriodFilter && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Período</Label>
            <Select value={timePeriod} onValueChange={(v) => setTimePeriod(v as TimePeriod)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="90">Último trimestre</SelectItem>
                <SelectItem value="180">Último semestre</SelectItem>
                <SelectItem value="365">Último año</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Team Chart (leaders/admins) */}
      {showTeamChart && (
        chartType === "combined" ? (
          <ResultsBarLineChart data={filteredByTime} indicator={indicator} />
        ) : (
          <ResultsHeatmapTable data={filteredByTime} indicator={indicator} />
        )
      )}

      {/* Timeline Chart (both students and leaders) */}
      <ResultsTimelineChart
        data={filteredByTime}
        indicator={indicator}
        showOnlyUser={userEmail}
      />
    </div>
  );
};
