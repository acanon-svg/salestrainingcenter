import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import {
  LineChart,
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
  showOnlyUser?: string; // email to filter for student view
}

const INDICATOR_LABELS: Record<string, string> = {
  firmas: "Firmas",
  originaciones: "Originaciones",
  gmv: "GMV (USD)",
};

const COLORS = [
  "hsl(var(--primary))",
  "hsl(217, 91%, 60%)",
  "hsl(142, 76%, 36%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 65%, 60%)",
  "hsl(0, 84%, 60%)",
  "hsl(180, 70%, 45%)",
  "hsl(330, 80%, 55%)",
  "hsl(60, 75%, 45%)",
  "hsl(200, 80%, 50%)",
];

export const ResultsTimelineChart: React.FC<Props> = ({ data, indicator, showOnlyUser }) => {
  const { chartData, users, meta } = useMemo(() => {
    let filtered = data;
    if (showOnlyUser) {
      filtered = data.filter((r) => r.user_email === showOnlyUser);
    }

    // Get unique users
    const uniqueUsers = [...new Set(filtered.map((r) => r.user_email))];

    // Get unique dates sorted
    const uniqueDates = [...new Set(filtered.map((r) => r.period_date))].sort();

    // Calculate meta (average across all records for the indicator)
    let avgMeta = 0;
    if (filtered.length > 0) {
      const metas = filtered.map((r) => {
        switch (indicator) {
          case "firmas": return Number(r.firmas_meta);
          case "originaciones": return Number(r.originaciones_meta);
          case "gmv": return Number(r.gmv_meta);
        }
      });
      avgMeta = Math.max(...metas);
    }

    // Build chart data: each date as a point, with cumulative values per user
    const userCumulatives = new Map<string, number>();
    uniqueUsers.forEach((u) => userCumulatives.set(u, 0));

    const points = uniqueDates.map((date) => {
      const point: Record<string, any> = {
        date: new Date(date).toLocaleDateString("es-CO", { day: "2-digit", month: "short" }),
        rawDate: date,
        meta: avgMeta,
      };

      // Accumulate values for each user on this date
      uniqueUsers.forEach((email) => {
        const record = filtered.find((r) => r.user_email === email && r.period_date === date);
        if (record) {
          const val = (() => {
            switch (indicator) {
              case "firmas": return Number(record.firmas_real);
              case "originaciones": return Number(record.originaciones_real);
              case "gmv": return Number(record.gmv_real);
            }
          })();
          userCumulatives.set(email, (userCumulatives.get(email) || 0) + val);
        }
        const name = email.split("@")[0].replace(/\./g, " ");
        point[name] = userCumulatives.get(email) || 0;
      });

      return point;
    });

    return {
      chartData: points,
      users: uniqueUsers.map((u) => u.split("@")[0].replace(/\./g, " ")),
      meta: avgMeta,
    };
  }, [data, indicator, showOnlyUser]);

  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {
      meta: { label: "Meta del Equipo", color: "hsl(var(--destructive))" },
    };
    users.forEach((u, i) => {
      config[u] = { label: u, color: COLORS[i % COLORS.length] };
    });
    return config;
  }, [users]);

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
          {INDICATOR_LABELS[indicator]} — Evolución en el Tiempo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            <Legend wrapperStyle={{ fontSize: "12px" }} />

            {/* Meta line - dashed */}
            <Line
              type="monotone"
              dataKey="meta"
              name="Meta del Equipo"
              stroke="hsl(var(--destructive))"
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={false}
            />

            {/* User lines */}
            {users.map((user, i) => (
              <Line
                key={user}
                type="monotone"
                dataKey={user}
                name={user}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
