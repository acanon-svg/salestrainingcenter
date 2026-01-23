import React, { useState } from "react";
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyComparison } from "@/hooks/useReportsData";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MonthlyComparisonChartProps {
  data: MonthlyComparison[] | undefined;
  isLoading: boolean;
}

const ChangeIndicator: React.FC<{ current: number; previous: number; suffix?: string }> = ({ 
  current, 
  previous, 
  suffix = "" 
}) => {
  if (previous === 0) return <span className="text-muted-foreground text-sm">-</span>;
  
  const change = ((current - previous) / previous) * 100;
  const isPositive = change > 0;
  const isNeutral = change === 0;

  return (
    <span className={`flex items-center gap-1 text-sm font-medium ${
      isNeutral ? "text-muted-foreground" : isPositive ? "text-success" : "text-destructive"
    }`}>
      {isNeutral ? (
        <Minus className="w-3 h-3" />
      ) : isPositive ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      {isPositive ? "+" : ""}{change.toFixed(1)}%{suffix}
    </span>
  );
};

export const MonthlyComparisonChart: React.FC<MonthlyComparisonChartProps> = ({ data, isLoading }) => {
  const [activeView, setActiveView] = useState<"volume" | "performance">("volume");

  // Calculate month-over-month changes
  const getMonthComparison = () => {
    if (!data || data.length < 2) return null;
    
    const currentMonth = data[data.length - 1];
    const previousMonth = data[data.length - 2];
    
    return {
      current: currentMonth,
      previous: previousMonth,
    };
  };

  const comparison = getMonthComparison();

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Comparativa Mensual</CardTitle>
            <CardDescription>Rendimiento mes a mes (últimos 6 meses)</CardDescription>
          </div>
          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "volume" | "performance")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="volume">Volumen</TabsTrigger>
              <TabsTrigger value="performance">Rendimiento</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : data && data.length > 0 ? (
          <>
            {/* Month-over-Month Summary */}
            {comparison && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Inscripciones</p>
                  <p className="text-2xl font-bold">{comparison.current.enrollments}</p>
                  <ChangeIndicator 
                    current={comparison.current.enrollments} 
                    previous={comparison.previous.enrollments} 
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Completados</p>
                  <p className="text-2xl font-bold">{comparison.current.completions}</p>
                  <ChangeIndicator 
                    current={comparison.current.completions} 
                    previous={comparison.previous.completions} 
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Tasa Completado</p>
                  <p className="text-2xl font-bold">{comparison.current.completionRate}%</p>
                  <ChangeIndicator 
                    current={comparison.current.completionRate} 
                    previous={comparison.previous.completionRate}
                    suffix=" pts"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Promedio</p>
                  <p className="text-2xl font-bold">{comparison.current.avgScore}%</p>
                  <ChangeIndicator 
                    current={comparison.current.avgScore} 
                    previous={comparison.previous.avgScore}
                    suffix=" pts"
                  />
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    allowDecimals={false}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === "Tasa Completado" || name === "Promedio") {
                        return [`${value}%`, name];
                      }
                      return [value, name];
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '10px' }}
                    formatter={(value) => (
                      <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
                    )}
                  />

                  {activeView === "volume" ? (
                    <>
                      <Bar 
                        yAxisId="left"
                        dataKey="enrollments" 
                        name="Inscripciones" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      />
                      <Bar 
                        yAxisId="left"
                        dataKey="completions" 
                        name="Completados" 
                        fill="hsl(var(--success))" 
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="completionRate"
                        name="Tasa Completado"
                        stroke="hsl(var(--addi-yellow))"
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--addi-yellow))', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                      />
                    </>
                  ) : (
                    <>
                      <Bar 
                        yAxisId="right"
                        dataKey="completionRate" 
                        name="Tasa Completado" 
                        fill="hsl(var(--success))" 
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="avgScore"
                        name="Promedio"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                      />
                    </>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No hay datos disponibles para comparar
          </div>
        )}
      </CardContent>
    </Card>
  );
};
