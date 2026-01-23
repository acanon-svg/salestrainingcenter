import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  BarChart3,
  Users,
  Target,
  Trophy,
} from "lucide-react";
import { usePeriodComparison, PeriodConfig, PeriodComparisonResult } from "@/hooks/usePeriodComparison";

const PERIOD_PRESETS: { value: string; label: string; config: PeriodConfig }[] = [
  {
    value: "q1_vs_q2",
    label: "Q1 vs Q2",
    config: {
      period1: { startMonth: 0, endMonth: 2, label: "Q1" },
      period2: { startMonth: 3, endMonth: 5, label: "Q2" },
    },
  },
  {
    value: "q2_vs_q3",
    label: "Q2 vs Q3",
    config: {
      period1: { startMonth: 3, endMonth: 5, label: "Q2" },
      period2: { startMonth: 6, endMonth: 8, label: "Q3" },
    },
  },
  {
    value: "q3_vs_q4",
    label: "Q3 vs Q4",
    config: {
      period1: { startMonth: 6, endMonth: 8, label: "Q3" },
      period2: { startMonth: 9, endMonth: 11, label: "Q4" },
    },
  },
  {
    value: "h1_vs_h2",
    label: "H1 vs H2 (Semestre)",
    config: {
      period1: { startMonth: 0, endMonth: 5, label: "H1" },
      period2: { startMonth: 6, endMonth: 11, label: "H2" },
    },
  },
  {
    value: "last_30_vs_prev_30",
    label: "Últimos 30 días vs anteriores",
    config: {
      period1: { daysAgo: 60, daysLength: 30, label: "Hace 30-60 días" },
      period2: { daysAgo: 30, daysLength: 30, label: "Últimos 30 días" },
    },
  },
  {
    value: "last_90_vs_prev_90",
    label: "Últimos 90 días vs anteriores",
    config: {
      period1: { daysAgo: 180, daysLength: 90, label: "Hace 90-180 días" },
      period2: { daysAgo: 90, daysLength: 90, label: "Últimos 90 días" },
    },
  },
];

interface MetricCardProps {
  label: string;
  period1Value: number;
  period2Value: number;
  period1Label: string;
  period2Label: string;
  format?: "number" | "percentage";
  icon: React.ElementType;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  period1Value,
  period2Value,
  period1Label,
  period2Label,
  format = "number",
  icon: Icon,
}) => {
  const diff = period2Value - period1Value;
  const percentChange = period1Value > 0 ? ((diff / period1Value) * 100).toFixed(1) : "N/A";
  const isPositive = diff > 0;
  const isNeutral = diff === 0;

  const formatValue = (value: number) =>
    format === "percentage" ? `${value}%` : value.toLocaleString();

  return (
    <div className="p-4 rounded-lg border border-border/50 bg-card space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">{period1Label}</p>
          <p className="text-xl font-bold">{formatValue(period1Value)}</p>
        </div>

        <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />

        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">{period2Label}</p>
          <p className="text-xl font-bold">{formatValue(period2Value)}</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 pt-2 border-t border-border/30">
        {isNeutral ? (
          <>
            <Minus className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Sin cambio</span>
          </>
        ) : (
          <>
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-success" />
            ) : (
              <TrendingDown className="w-4 h-4 text-destructive" />
            )}
            <span
              className={`text-sm font-medium ${
                isPositive ? "text-success" : "text-destructive"
              }`}
            >
              {isPositive ? "+" : ""}
              {formatValue(diff)} ({percentChange}%)
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export const PeriodComparisonCard: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState(PERIOD_PRESETS[0].value);

  const currentPreset = PERIOD_PRESETS.find((p) => p.value === selectedPreset);
  const { data, isLoading } = usePeriodComparison(currentPreset?.config || PERIOD_PRESETS[0].config);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Comparativa de Períodos
            </CardTitle>
            <CardDescription>
              Compara métricas clave entre dos períodos específicos
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">
              <Calendar className="w-3 h-3 inline mr-1" />
              Período:
            </Label>
            <Select value={selectedPreset} onValueChange={setSelectedPreset}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : data ? (
          <>
            {/* Period Labels */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <Badge variant="outline" className="px-4 py-1">
                {data.period1.label}: {data.period1.dateRange}
              </Badge>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <Badge variant="secondary" className="px-4 py-1">
                {data.period2.label}: {data.period2.dateRange}
              </Badge>
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Inscripciones"
                period1Value={data.period1.enrollments}
                period2Value={data.period2.enrollments}
                period1Label={data.period1.label}
                period2Label={data.period2.label}
                icon={Users}
              />
              <MetricCard
                label="Completados"
                period1Value={data.period1.completions}
                period2Value={data.period2.completions}
                period1Label={data.period1.label}
                period2Label={data.period2.label}
                icon={Target}
              />
              <MetricCard
                label="Tasa de Completado"
                period1Value={data.period1.completionRate}
                period2Value={data.period2.completionRate}
                period1Label={data.period1.label}
                period2Label={data.period2.label}
                format="percentage"
                icon={TrendingUp}
              />
              <MetricCard
                label="Promedio Calificación"
                period1Value={data.period1.avgScore}
                period2Value={data.period2.avgScore}
                period1Label={data.period1.label}
                period2Label={data.period2.label}
                format="percentage"
                icon={Trophy}
              />
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/30">
              <h4 className="font-medium mb-2">Resumen de Cambios</h4>
              <div className="grid gap-2 md:grid-cols-2 text-sm">
                <div className="flex items-center gap-2">
                  {data.period2.enrollments >= data.period1.enrollments ? (
                    <TrendingUp className="w-4 h-4 text-success" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-destructive" />
                  )}
                  <span>
                    Las inscripciones{" "}
                    {data.period2.enrollments >= data.period1.enrollments
                      ? "aumentaron"
                      : "disminuyeron"}{" "}
                    en {Math.abs(data.period2.enrollments - data.period1.enrollments)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {data.period2.completionRate >= data.period1.completionRate ? (
                    <TrendingUp className="w-4 h-4 text-success" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-destructive" />
                  )}
                  <span>
                    La tasa de completado{" "}
                    {data.period2.completionRate >= data.period1.completionRate
                      ? "mejoró"
                      : "bajó"}{" "}
                    {Math.abs(data.period2.completionRate - data.period1.completionRate)}%
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No hay datos disponibles para la comparación
          </div>
        )}
      </CardContent>
    </Card>
  );
};
