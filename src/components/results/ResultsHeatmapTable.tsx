import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

const getHeatmapColor = (ratio: number): string => {
  if (ratio >= 1.0) return "bg-green-500/20 text-green-700 dark:text-green-300";
  if (ratio >= 0.85) return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300";
  if (ratio >= 0.7) return "bg-orange-500/20 text-orange-700 dark:text-orange-300";
  return "bg-red-500/20 text-red-700 dark:text-red-300";
};

export const ResultsHeatmapTable: React.FC<Props> = ({ data, indicator, selectedMonth, selectedYear }) => {
  const tableData = useMemo(() => {
    const userMap = new Map<string, { real: number; meta: number; expected: number; email: string }>();

    const grouped = new Map<string, TeamResult[]>();
    data.filter((r) => !r.user_email.toLowerCase().includes("total")).forEach((r) => {
      const list = grouped.get(r.user_email) || [];
      list.push(r);
      grouped.set(r.user_email, list);
    });

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-indexed

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

        const diasTranscurridos = Number(r.dias_habiles_transcurridos) || 0;
        const diasMes = Number(r.dias_habiles_mes) || 0;

        if (diasMes > 0 && diasTranscurridos > 0) {
          const fraction = Math.min(diasTranscurridos / diasMes, 1);
          totalExpected += Math.round(recordMeta * fraction);
        } else if (isPast) {
          totalExpected += recordMeta;
        }
      });

      const name = email.split("@")[0].replace(/\./g, " ");
      userMap.set(email, { real: totalReal, meta: totalMeta, expected: totalExpected, email: name });
    });

    return Array.from(userMap.values()).sort((a, b) => b.real - a.real);
  }, [data, indicator]);

  if (tableData.length === 0) {
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
          {INDICATOR_LABELS[indicator]} — Tabla de Cumplimiento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ejecutivo</TableHead>
                <TableHead className="text-right">Real</TableHead>
                <TableHead className="text-right">Meta MtD</TableHead>
                <TableHead className="text-right">Meta Mes</TableHead>
                <TableHead className="text-right">Cumpl. MtD</TableHead>
                <TableHead className="text-right">Cierre Proyectado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row) => {
                const cumplMtd = row.expected > 0 ? (row.real / row.expected) * 100 : 0;
                const cumplReal = row.meta > 0 ? (row.real / row.meta) * 100 : 0;
                // Projected close: extrapolate real performance to full month
                const fraction = row.meta > 0 && row.expected > 0 ? row.expected / row.meta : 0;
                const projected = fraction > 0 ? (row.real / fraction) : 0;
                const proyectadoPct = row.meta > 0 ? (projected / row.meta) * 100 : 0;

                return (
                  <TableRow key={row.email}>
                    <TableCell className="font-medium capitalize">{row.email}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.real.toLocaleString("es-CO")}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.expected.toLocaleString("es-CO")}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.meta.toLocaleString("es-CO")}</TableCell>
                    <TableCell className="text-right">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getHeatmapColor(cumplMtd / 100)}`}>
                        {cumplMtd.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getHeatmapColor(proyectadoPct / 100)}`}>
                        {proyectadoPct.toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/40" />
            ≥100%
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-500/20 border border-yellow-500/40" />
            85–99%
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-500/20 border border-orange-500/40" />
            70–84%
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/40" />
            {"<70%"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
