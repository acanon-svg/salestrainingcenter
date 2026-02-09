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

const MONTH_NAMES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

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
  const { chartData, users } = useMemo(() => {
    let filtered = data;
    if (showOnlyUser) {
      filtered = data.filter((r) => r.user_email === showOnlyUser);
    }

    // Get unique users
    const uniqueUsers = [...new Set(filtered.map((r) => r.user_email))];

    // Group data by year-month and user, summing real values AND metas
    const monthlyMap = new Map<string, Map<string, number>>();
    const monthlyMetaMap = new Map<string, number>();

    filtered.forEach((r) => {
      const d = new Date(r.period_date + "T00:00:00");
      const year = d.getFullYear();
      const month = d.getMonth(); // 0-indexed
      const key = `${year}-${String(month).padStart(2, "0")}`;

      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, new Map());
      }
      const userMap = monthlyMap.get(key)!;

      const val = (() => {
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

      const userName = r.user_email.split("@")[0].replace(/\./g, " ");
      userMap.set(userName, (userMap.get(userName) || 0) + val);
      monthlyMetaMap.set(key, (monthlyMetaMap.get(key) || 0) + metaVal);
    });

    // Sort months chronologically
    const sortedMonths = [...monthlyMap.keys()].sort();

    // Build chart data points
    const points = sortedMonths.map((monthKey) => {
      const [yearStr, monthStr] = monthKey.split("-");
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);
      const label = `${MONTH_NAMES[month]} ${year}`;

      const point: Record<string, any> = {
        date: label,
        sortKey: monthKey,
        "Meta Total": monthlyMetaMap.get(monthKey) || 0,
      };

      const userMap = monthlyMap.get(monthKey)!;
      const userNames = uniqueUsers.map((u) => u.split("@")[0].replace(/\./g, " "));

      userNames.forEach((name) => {
        point[name] = userMap.get(name) || 0;
      });

      return point;
    });

    return {
      chartData: points,
      users: uniqueUsers.map((u) => u.split("@")[0].replace(/\./g, " ")),
    };
  }, [data, indicator, showOnlyUser]);

  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {
      "Meta Total": { label: "Meta Total", color: "hsl(var(--destructive))" },
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
          {INDICATOR_LABELS[indicator]} — Comparativa en el Tiempo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
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

            {/* Meta Total line */}
            <Line
              type="monotone"
              dataKey="Meta Total"
              name="Meta Total"
              stroke="hsl(var(--destructive))"
              strokeWidth={2.5}
              strokeDasharray="6 3"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
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
