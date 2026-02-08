import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { TeamResult } from "@/hooks/useTeamResults";

interface Props {
  data: TeamResult[];
  indicator: "firmas" | "originaciones" | "gmv";
}

const INDICATOR_LABELS: Record<string, string> = {
  firmas: "Firmas",
  originaciones: "Originaciones",
  gmv: "GMV (USD)",
};

export const ResultsBarLineChart: React.FC<Props> = ({ data, indicator }) => {
  const chartData = useMemo(() => {
    // Aggregate by user: use latest record per user
    const userMap = new Map<string, { real: number; meta: number; expected: number; email: string }>();

    // Group all records by user_email
    const grouped = new Map<string, TeamResult[]>();
    data.forEach((r) => {
      const list = grouped.get(r.user_email) || [];
      list.push(r);
      grouped.set(r.user_email, list);
    });

    grouped.forEach((records, email) => {
      // Sum all real values and take max meta
      const totalReal = records.reduce((sum, r) => {
        switch (indicator) {
          case "firmas": return sum + Number(r.firmas_real);
          case "originaciones": return sum + Number(r.originaciones_real);
          case "gmv": return sum + Number(r.gmv_real);
        }
      }, 0);

      const meta = Math.max(...records.map((r) => {
        switch (indicator) {
          case "firmas": return Number(r.firmas_meta);
          case "originaciones": return Number(r.originaciones_meta);
          case "gmv": return Number(r.gmv_meta);
        }
      }));

      // Calculate expected based on days elapsed in the month
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const dayOfMonth = now.getDate();
      const expected = Math.round((meta / daysInMonth) * dayOfMonth);

      const name = email.split("@")[0].replace(/\./g, " ");
      userMap.set(email, { real: totalReal, meta, expected, email: name });
    });

    return Array.from(userMap.values())
      .sort((a, b) => b.real - a.real)
      .map((u) => ({
        name: u.email,
        real: u.real,
        expected: u.expected,
        meta: u.meta,
      }));
  }, [data, indicator]);

  const chartConfig = {
    real: { label: "Resultado Real", color: "hsl(var(--primary))" },
    expected: { label: "Debería llevar", color: "hsl(var(--muted-foreground))" },
    meta: { label: "Meta Total", color: "hsl(var(--destructive))" },
  };

  if (chartData.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="pt-6 text-center py-12">
          <p className="text-muted-foreground">No hay datos para mostrar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">
          {INDICATOR_LABELS[indicator]} — Comparativa por Ejecutivo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
            />
            <YAxis yAxisId="left" className="fill-muted-foreground" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" className="fill-muted-foreground" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number) => value.toLocaleString("es-CO")}
            />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
            <Bar yAxisId="left" dataKey="real" name="Resultado Real" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={20} />
            <Bar yAxisId="left" dataKey="expected" name="Debería llevar" fill="hsl(var(--muted-foreground) / 0.4)" radius={[4, 4, 0, 0]} barSize={20} />
            <Line yAxisId="right" type="monotone" dataKey="meta" name="Meta Total" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 4 }} />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
