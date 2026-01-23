import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar as CalendarIcon,
  BarChart3,
  Users,
  Target,
  Trophy,
} from "lucide-react";
import { usePeriodComparison, PeriodConfig } from "@/hooks/usePeriodComparison";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const PERIOD_PRESETS: { value: string; label: string; config: PeriodConfig }[] = [
  {
    value: "custom",
    label: "Personalizado",
    config: {
      period1: { label: "Período 1" },
      period2: { label: "Período 2" },
    },
  },
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

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

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
  format: formatType = "number",
  icon: Icon,
}) => {
  const diff = period2Value - period1Value;
  const percentChange = period1Value > 0 ? ((diff / period1Value) * 100).toFixed(1) : "N/A";
  const isPositive = diff > 0;
  const isNeutral = diff === 0;

  const formatValue = (value: number) =>
    formatType === "percentage" ? `${value}%` : value.toLocaleString();

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

interface DateRangePickerProps {
  label: string;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  label,
  dateRange,
  onDateRangeChange,
}) => {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal flex-1",
                !dateRange.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? format(dateRange.from, "dd/MM/yyyy", { locale: es }) : "Inicio"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.from}
              onSelect={(date) => onDateRangeChange({ ...dateRange, from: date })}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal flex-1",
                !dateRange.to && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.to ? format(dateRange.to, "dd/MM/yyyy", { locale: es }) : "Fin"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.to}
              onSelect={(date) => onDateRangeChange({ ...dateRange, to: date })}
              disabled={(date) => dateRange.from ? date < dateRange.from : false}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export const PeriodComparisonCard: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState(PERIOD_PRESETS[1].value);
  const [period1Range, setPeriod1Range] = useState<DateRange>({ from: undefined, to: undefined });
  const [period2Range, setPeriod2Range] = useState<DateRange>({ from: undefined, to: undefined });

  const isCustom = selectedPreset === "custom";
  const currentPreset = PERIOD_PRESETS.find((p) => p.value === selectedPreset);

  // Build config based on selection
  const config: PeriodConfig = isCustom
    ? {
        period1: {
          customStart: period1Range.from,
          customEnd: period1Range.to,
          label: "Período 1",
        },
        period2: {
          customStart: period2Range.from,
          customEnd: period2Range.to,
          label: "Período 2",
        },
      }
    : currentPreset?.config || PERIOD_PRESETS[1].config;

  const hasValidCustomDates = !isCustom || 
    (period1Range.from && period1Range.to && period2Range.from && period2Range.to);

  const { data, isLoading } = usePeriodComparison(config);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex flex-col gap-4">
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
                <CalendarIcon className="w-3 h-3 inline mr-1" />
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

          {/* Custom Date Pickers */}
          {isCustom && (
            <div className="grid gap-4 sm:grid-cols-2 p-4 rounded-lg bg-muted/30 border border-border/30">
              <DateRangePicker
                label="Período 1 (Base)"
                dateRange={period1Range}
                onDateRangeChange={setPeriod1Range}
              />
              <DateRangePicker
                label="Período 2 (Comparación)"
                dateRange={period2Range}
                onDateRangeChange={setPeriod2Range}
              />
              {!hasValidCustomDates && (
                <p className="col-span-2 text-xs text-muted-foreground text-center">
                  Selecciona fechas de inicio y fin para ambos períodos
                </p>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasValidCustomDates ? (
          <div className="text-center py-8 text-muted-foreground">
            Selecciona fechas para ver la comparación
          </div>
        ) : isLoading ? (
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

            {/* Bar Chart Comparison */}
            <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/30">
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Gráfico Comparativo
              </h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        metric: "Inscripciones",
                        [data.period1.label]: data.period1.enrollments,
                        [data.period2.label]: data.period2.enrollments,
                      },
                      {
                        metric: "Completados",
                        [data.period1.label]: data.period1.completions,
                        [data.period2.label]: data.period2.completions,
                      },
                      {
                        metric: "Tasa Completado (%)",
                        [data.period1.label]: data.period1.completionRate,
                        [data.period2.label]: data.period2.completionRate,
                      },
                      {
                        metric: "Promedio (%)",
                        [data.period1.label]: data.period1.avgScore,
                        [data.period2.label]: data.period2.avgScore,
                      },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis 
                      dataKey="metric" 
                      tick={{ fontSize: 12 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      className="fill-muted-foreground"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Legend />
                    <Bar 
                      dataKey={data.period1.label} 
                      fill="hsl(var(--muted-foreground))" 
                      radius={[4, 4, 0, 0]}
                      name={data.period1.label}
                    />
                    <Bar 
                      dataKey={data.period2.label} 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                      name={data.period2.label}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
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
