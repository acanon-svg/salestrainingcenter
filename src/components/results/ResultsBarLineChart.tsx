import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  selectedMonth?: number;
  selectedYear?: number;
}

const INDICATOR_LABELS: Record<string, string> = {
  firmas: "Firmas",
  originaciones: "Originaciones",
  gmv: "GMV (USD)",
};

export const ResultsBarLineChart: React.FC<Props> = ({ data, indicator, selectedMonth, selectedYear }) => {
  const { data: profilesList } = useQuery({
    queryKey: ["profiles-names"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("email, full_name");
      return data || [];
    },
  });

  const { profileNameMap, nameToEmailMap } = useMemo(() => {
    const nameMap = new Map<string, string>();
    const reverseMap = new Map<string, string>();
    (profilesList || []).forEach((p: any) => {
      if (p.email && p.full_name) {
        nameMap.set(p.email.toLowerCase(), p.full_name);
        reverseMap.set(p.full_name.toLowerCase(), p.full_name);
      }
    });
    return { profileNameMap: nameMap, nameToEmailMap: reverseMap };
  }, [profilesList]);

  const chartData = useMemo(() => {
    const userMap = new Map<string, { real: number; meta: number; expected: number; email: string }>();

    const EXCLUDED = ["total", "hunter", "no info"];
    const grouped = new Map<string, TeamResult[]>();
    data.filter((r) => {
      if (EXCLUDED.includes(r.user_email.toLowerCase().trim())) return false;
      // Skip rows with no data at all
      if (Number(r.firmas_real) === 0 && Number(r.firmas_meta) === 0 && Number(r.originaciones_real) === 0 && Number(r.originaciones_meta) === 0 && Number(r.gmv_real) === 0 && Number(r.gmv_meta) === 0) return false;
      return true;
    }).forEach((r) => {
      const list = grouped.get(r.user_email) || [];
      list.push(r);
      grouped.set(r.user_email, list);
    });

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-indexed

    // Determine if the viewed period is past, current, or future
    const viewYear = selectedYear ?? currentYear;
    const viewMonth = selectedMonth ?? currentMonth;
    const isPast = viewYear < currentYear || (viewYear === currentYear && viewMonth < currentMonth);
    const isCurrent = viewYear === currentYear && viewMonth === currentMonth;

    grouped.forEach((records, email) => {
      let totalReal = 0;
      let totalExpected = 0;
      let totalMeta = 0;

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
        totalMeta += recordMeta;

        // Use business days from the data to calculate expected
        const diasTranscurridos = Number(r.dias_habiles_transcurridos) || 0;
        const diasMes = Number(r.dias_habiles_mes) || 0;

        if (diasMes > 0 && diasTranscurridos > 0) {
          const fraction = Math.min(diasTranscurridos / diasMes, 1);
          totalExpected += Math.round(recordMeta * fraction);
        } else if (isPast) {
          totalExpected += recordMeta;
        }
      });

      const name = profileNameMap.get(email.toLowerCase()) || nameToEmailMap.get(email.toLowerCase()) || email.split("@")[0].replace(/\./g, " ");
      userMap.set(email, { real: totalReal, meta: totalMeta, expected: totalExpected, email: name });
    });

    return Array.from(userMap.values())
      .sort((a, b) => b.real - a.real)
      .map((u) => ({
        name: u.email,
        real: u.real,
        expected: u.expected,
        meta: u.meta,
      }));
  }, [data, indicator, profileNameMap]);

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
            <YAxis className="fill-muted-foreground" tick={{ fontSize: 11 }} />
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
            <Bar dataKey="real" name="Resultado Real" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={20} label={{ position: "top", fontSize: 10, fill: "hsl(var(--foreground))", formatter: (v: number) => v.toLocaleString("es-CO") }} />
            <Bar dataKey="expected" name="Debería llevar" fill="hsl(var(--muted-foreground) / 0.4)" radius={[4, 4, 0, 0]} barSize={20} label={{ position: "top", fontSize: 10, fill: "hsl(var(--muted-foreground))", formatter: (v: number) => v.toLocaleString("es-CO") }} />
            <Line type="monotone" dataKey="meta" name="Meta Total" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 4 }} label={{ position: "top", fontSize: 10, fill: "hsl(var(--destructive))", formatter: (v: number) => v.toLocaleString("es-CO") }} />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
