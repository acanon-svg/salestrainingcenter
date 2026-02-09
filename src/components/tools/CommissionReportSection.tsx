import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, FileSpreadsheet, AlertCircle, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { MonthSelector } from "./MonthSelector";
import { PendingCommissionsSummary } from "./PendingCommissionsSummary";
import { useApprovedCommissions, CommissionReview } from "@/hooks/useCommissionReviews";
import * as XLSX from "xlsx";

const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const BASE_COMMISSION = 1500000;

type SortKey = "user" | "regional" | "firmas" | "candado" | "orig" | "gmv" | "total" | "mbs" | "bonus" | "totalComm" | "cumplimiento";
type SortDir = "asc" | "desc";

const SortableHead: React.FC<{
  label: string;
  sortKey: SortKey;
  currentKey: SortKey | null;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}> = ({ label, sortKey, currentKey, currentDir, onSort, className }) => (
  <TableHead
    className={`cursor-pointer select-none hover:bg-muted/50 ${className || ""}`}
    onClick={() => onSort(sortKey)}
  >
    <div className="flex items-center gap-1">
      {label}
      {currentKey === sortKey ? (
        currentDir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </div>
  </TableHead>
);

export const CommissionReportSection: React.FC = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const { data: commissions, isLoading } = useApprovedCommissions(selectedMonth, selectedYear);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortedCommissions = useMemo(() => {
    if (!commissions) return [];
    if (!sortKey) return commissions;

    const getValue = (c: CommissionReview): number | string => {
      const totalWeighted = c.originaciones_weighted + c.gmv_weighted;
      switch (sortKey) {
        case "user": return (c.user_name || c.user_email).toLowerCase();
        case "regional": return (c.regional || "").toLowerCase();
        case "firmas": return c.firmas_compliance;
        case "candado": return c.candado_met ? 1 : 0;
        case "orig": return c.originaciones_weighted;
        case "gmv": return c.gmv_weighted;
        case "total": return totalWeighted;
        case "mbs": return c.has_mb_income ? 1 : 0;
        case "bonus": return c.indicator_bonus;
        case "totalComm": return c.total_commission;
        case "cumplimiento": return c.total_commission / BASE_COMMISSION;
        default: return 0;
      }
    };

    return [...commissions].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [commissions, sortKey, sortDir]);

  const handleDownloadExcel = () => {
    if (!commissions || commissions.length === 0) return;

    const rows = commissions.map((c) => {
      const totalWeighted = c.originaciones_weighted + c.gmv_weighted;
      const cumplimiento = c.total_commission / BASE_COMMISSION;
      return {
        Nombre: c.user_name || c.user_email,
        Correo: c.user_email,
        Regional: c.regional || "",
        "Firmas Real": c.firmas_real,
        "Firmas Meta": c.firmas_meta,
        "% Firmas": c.firmas_compliance / 100,
        Candado: c.candado_met ? "Cumplido" : "No cumplido",
        "Originaciones Real": c.originaciones_real,
        "Originaciones Meta": c.originaciones_meta,
        "Ponderación Orig (50%)": c.originaciones_weighted / 100,
        "GMV Real": c.gmv_real,
        "GMV Meta": c.gmv_meta,
        "Ponderación GMV (50%)": c.gmv_weighted / 100,
        "Total (Orig + GMV)": totalWeighted / 100,
        "Base Comisional (COP)": c.base_commission,
        "Comisión Calculada (COP)": c.calculated_commission,
        "MB Income (+20%)": c.has_mb_income ? "Sí" : "No",
        "Bonus Indicador (COP)": c.indicator_bonus,
        "Total Comisión (COP)": c.total_commission,
        "Cumplimiento (%)": cumplimiento,
        Observaciones: c.observations || "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);

    // Apply Excel percentage format to percentage columns
    const pctCols = ["% Firmas", "Ponderación Orig (50%)", "Ponderación GMV (50%)", "Total (Orig + GMV)", "Cumplimiento (%)"];
    const headers = Object.keys(rows[0]);
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    for (const colName of pctCols) {
      const colIdx = headers.indexOf(colName);
      if (colIdx === -1) continue;
      for (let r = range.s.r + 1; r <= range.e.r; r++) {
        const cellRef = XLSX.utils.encode_cell({ r, c: colIdx });
        if (ws[cellRef]) {
          ws[cellRef].z = "0.0%";
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Comisiones Aprobadas");
    XLSX.writeFile(wb, `reporte_comisiones_${selectedMonth}_${selectedYear}.xlsx`);
  };

  const totalCommission = (commissions || []).reduce((s, c) => s + c.total_commission, 0);

  const sharedHeadProps = { currentKey: sortKey, currentDir: sortDir, onSort: handleSort };

  return (
    <div className="space-y-6">
      <MonthSelector
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
      />

      <PendingCommissionsSummary month={selectedMonth} year={selectedYear} />

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Comisiones Aprobadas</p>
            <p className="text-2xl font-bold text-emerald-600">{commissions?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Total a Pagar</p>
            <p className="text-2xl font-bold text-primary">{formatCOP(totalCommission)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center justify-center">
            <Button onClick={handleDownloadExcel} disabled={!commissions || commissions.length === 0} className="gap-2">
              <Download className="h-4 w-4" />
              Descargar Excel
            </Button>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Skeleton className="h-[300px] w-full" />
      ) : !commissions || commissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay comisiones aprobadas para este período.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Detalle de Comisiones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHead label="Ejecutivo" sortKey="user" {...sharedHeadProps} />
                    <SortableHead label="Regional" sortKey="regional" {...sharedHeadProps} />
                    <SortableHead label="% Firmas" sortKey="firmas" className="text-right" {...sharedHeadProps} />
                    <SortableHead label="Candado" sortKey="candado" className="text-right" {...sharedHeadProps} />
                    <SortableHead label="% Orig" sortKey="orig" className="text-right" {...sharedHeadProps} />
                    <SortableHead label="% GMV" sortKey="gmv" className="text-right" {...sharedHeadProps} />
                    <SortableHead label="Total" sortKey="total" className="text-right" {...sharedHeadProps} />
                    <SortableHead label="MBs" sortKey="mbs" className="text-right" {...sharedHeadProps} />
                    <SortableHead label="Bonus" sortKey="bonus" className="text-right" {...sharedHeadProps} />
                    <SortableHead label="Total $" sortKey="totalComm" className="text-right" {...sharedHeadProps} />
                    <SortableHead label="Cumplimiento" sortKey="cumplimiento" className="text-right" {...sharedHeadProps} />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCommissions.map((c) => {
                    const totalWeighted = c.originaciones_weighted + c.gmv_weighted;
                    const cumplimiento = c.total_commission / BASE_COMMISSION;
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{c.user_name || c.user_email}</p>
                            <p className="text-xs text-muted-foreground">{c.user_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{c.regional}</TableCell>
                        <TableCell className="text-right">{c.firmas_compliance.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={c.candado_met ? "default" : "destructive"} className="text-xs">
                            {c.candado_met ? "✅" : "❌"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{c.originaciones_weighted.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">{c.gmv_weighted.toFixed(1)}%</TableCell>
                        <TableCell className="text-right font-semibold">{totalWeighted.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">{c.has_mb_income ? "+20%" : "—"}</TableCell>
                        <TableCell className="text-right">
                          {c.indicator_bonus > 0 ? formatCOP(c.indicator_bonus) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-bold">{formatCOP(c.total_commission)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {(cumplimiento * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
