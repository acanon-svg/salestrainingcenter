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
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-indexed

      // Sum all real values and calculate expected per-record based on whether month is past or current
      let totalReal = 0;
      let totalExpected = 0;
      let maxMeta = 0;

      records.forEach((r) => {
        const real = (() => {
          switch (indicator) {
            case "firmas": return Number(r.firmas_real);
            case "originaciones": return Number(r.originaciones_real);
            case "gmv": return Number(r.gmv_real);
          }
        })();
        const recordMeta = (() => {
          switch (indicator) {
            case "firmas": return Number(r.firmas_meta);
            case "originaciones": return Number(r.originaciones_meta);
            case "gmv": return Number(r.gmv_meta);
          }
        })();

        totalReal += real;
        if (recordMeta > maxMeta) maxMeta = recordMeta;

        // Determine if this record's period is past, current, or future
        const periodDate = new Date(r.period_date + "T00:00:00");
        const recordYear = periodDate.getFullYear();
        const recordMonth = periodDate.getMonth();

        if (recordYear < currentYear || (recordYear === currentYear && recordMonth < currentMonth)) {
          // Past month — should be 100% complete
          totalExpected += recordMeta;
        } else if (recordYear === currentYear && recordMonth === currentMonth) {
          // Current month — use week-based fraction
          const dayOfMonth = now.getDate();
          const currentWeek = Math.ceil(dayOfMonth / 7);
          const weeksInMonth = Number(r.weeks_in_month) || 4;
          const weekFraction = Math.min(currentWeek, weeksInMonth) / weeksInMonth;
          totalExpected += Math.round(recordMeta * weekFraction);
        }
        // Future months: expected = 0
      });

      const meta = maxMeta;
      const expected = totalExpected;

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
