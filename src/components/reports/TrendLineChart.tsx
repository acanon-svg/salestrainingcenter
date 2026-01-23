import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendDataPoint } from "@/hooks/useReportsData";
import { Skeleton } from "@/components/ui/skeleton";

interface TrendLineChartProps {
  data: TrendDataPoint[] | undefined;
  isLoading: boolean;
  dateRange: string;
}

export const TrendLineChart: React.FC<TrendLineChartProps> = ({ data, isLoading, dateRange }) => {
  // Sample data if there's too many points (for better visualization)
  const chartData = React.useMemo(() => {
    if (!data) return [];
    
    // For longer periods, aggregate data
    if (data.length > 30) {
      const step = Math.ceil(data.length / 30);
      return data.filter((_, index) => index % step === 0);
    }
    return data;
  }, [data]);

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

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Tendencia de Actividad</CardTitle>
        <CardDescription>Inscripciones y completados durante {getPeriodLabel()}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : chartData.length > 0 ? (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(value) => (
                    <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="enrollments"
                  name="Inscripciones"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="completions"
                  name="Completados"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 2 }}
                />
              </LineChart>
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
