import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegionalData } from "@/hooks/useReportsData";
import { Skeleton } from "@/components/ui/skeleton";

interface ComplianceBarChartProps {
  data: RegionalData[] | undefined;
  isLoading: boolean;
}

export const ComplianceBarChart: React.FC<ComplianceBarChartProps> = ({ data, isLoading }) => {
  const getBarColor = (rate: number) => {
    if (rate >= 80) return "hsl(var(--success))";
    if (rate >= 60) return "hsl(var(--addi-yellow))";
    return "hsl(var(--destructive))";
  };

  const chartData = data?.map(item => ({
    name: item.name,
    compliance: item.completion_rate,
    promedio: item.avg_score,
  })) || [];

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Compliance por Regional</CardTitle>
        <CardDescription>Tasa de completado de cursos por región (meta: 80%)</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : chartData.length > 0 ? (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
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
                  formatter={(value: number) => [`${value}%`, 'Compliance']}
                />
                <ReferenceLine 
                  y={80} 
                  stroke="hsl(var(--success))" 
                  strokeDasharray="5 5" 
                  label={{ value: 'Meta 80%', fill: 'hsl(var(--success))', fontSize: 11 }}
                />
                <Bar dataKey="compliance" radius={[4, 4, 0, 0]} maxBarSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.compliance)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No hay datos disponibles
          </div>
        )}
      </CardContent>
    </Card>
  );
};
