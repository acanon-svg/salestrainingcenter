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
} from "recharts";
import type { TeamResult } from "@/hooks/useTeamResults";

interface Props {
  data: TeamResult[];
  indicator: "firmas" | "originaciones" | "gmv";
  showOnlyUser?: string;
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

export const ResultsTimelineChart: React.FC<Props> = ({ data, indicator, showOnlyUser }) => {
  const chartData = useMemo(() => {
    let filtered = data;
    if (showOnlyUser) {
      filtered = data.filter((r) => r.user_email === showOnlyUser);
    }

    // Group by year-month, summing real, meta, and calculating expected
    const monthlyMap = new Map<string, { real: number; meta: number; expected: number }>();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    filtered.forEach((r) => {
      const d = new Date(r.period_date + "T00:00:00");
      const year = d.getFullYear();
      const month = d.getMonth();
      const key = `${year}-${String(month).padStart(2, "0")}`;

      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, { real: 0, meta: 0, expected: 0 });
      }
      const entry = monthlyMap.get(key)!;

      const real = (() => {
        switch (indicator) {
          case "firmas": return Number(r.firmas_real);
          case "originaciones": return Number(r.originaciones_real);
          case "gmv": return Number(r.gmv_real);
        }
      })();

      const metaVal = (() => {
        switch (indicator) {
          case "firmas": return Number(r.firmas_meta);
          case "originaciones": return Number(r.originaciones_meta);
          case "gmv": return Number(r.gmv_meta);
        }
      })();

      entry.real += real;
      entry.meta += metaVal;

      const viewYear = year;
      const viewMonth = month + 1;
      const isPast = viewYear < currentYear || (viewYear === currentYear && viewMonth < currentMonth);

      const diasTranscurridos = Number(r.dias_habiles_transcurridos) || 0;
      const diasMes = Number(r.dias_habiles_mes) || 0;

      if (diasMes > 0 && diasTranscurridos > 0) {
        const fraction = Math.min(diasTranscurridos / diasMes, 1);
        entry.expected += Math.round(metaVal * fraction);
      } else if (isPast) {
        entry.expected += metaVal;
      }
    });

    const sortedMonths = [...monthlyMap.keys()].sort();

    return sortedMonths.map((monthKey) => {
      const [yearStr, monthStr] = monthKey.split("-");
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);
      const label = `${MONTH_NAMES[month]} ${year}`;
      const entry = monthlyMap.get(monthKey)!;

      return {
        date: label,
        real: entry.real,
        expected: entry.expected,
        meta: entry.meta,
      };
    });
  }, [data, indicator, showOnlyUser]);

  const chartConfig = {
    real: { label: "Resultado Real", color: "hsl(var(--primary))" },
    expected: { label: "Debería llevar", color: "hsl(var(--muted-foreground))" },
    meta: { label: "Meta Total", color: "hsl(var(--destructive))" },
  };

  if (chartData.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="pt-6 text-center py-12">
          <p className="text-muted-foreground">No hay datos de línea temporal para mostrar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">
          {INDICATOR_LABELS[indicator]} — Comparativa en el Tiempo (Total)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
            <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
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
            <Bar dataKey="real" name="Resultado Real" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={24} label={{ position: "top", fontSize: 10, fill: "hsl(var(--foreground))", formatter: (v: number) => v.toLocaleString("es-CO") }} />
            <Bar dataKey="expected" name="Debería llevar" fill="hsl(var(--muted-foreground) / 0.4)" radius={[4, 4, 0, 0]} barSize={24} label={{ position: "top", fontSize: 10, fill: "hsl(var(--muted-foreground))", formatter: (v: number) => v.toLocaleString("es-CO") }} />
            <Line type="monotone" dataKey="meta" name="Meta Total" stroke="hsl(var(--destructive))" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} label={{ position: "top", fontSize: 10, fill: "hsl(var(--destructive))", formatter: (v: number) => v.toLocaleString("es-CO") }} />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
