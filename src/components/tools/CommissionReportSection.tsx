import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Download, FileSpreadsheet, AlertCircle } from "lucide-react";
import { MonthSelector } from "./MonthSelector";
import { useApprovedCommissions, CommissionReview } from "@/hooks/useCommissionReviews";
import * as XLSX from "xlsx";

const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export const CommissionReportSection: React.FC = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const { data: commissions, isLoading } = useApprovedCommissions(
    selectedMonth,
    selectedYear
  );

  const handleDownloadExcel = () => {
    if (!commissions || commissions.length === 0) return;

    const rows = commissions.map((c) => ({
      Nombre: c.user_name || c.user_email,
      Correo: c.user_email,
      Regional: c.regional || "",
      "Firmas Real": c.firmas_real,
      "Firmas Meta": c.firmas_meta,
      "% Firmas": `${c.firmas_compliance.toFixed(1)}%`,
      Candado: c.candado_met ? "Cumplido" : "No cumplido",
      "Originaciones Real": c.originaciones_real,
      "Originaciones Meta": c.originaciones_meta,
      "Ponderación Orig (50%)": `${c.originaciones_weighted.toFixed(2)}%`,
      "GMV Real": c.gmv_real,
      "GMV Meta": c.gmv_meta,
      "Ponderación GMV (50%)": `${c.gmv_weighted.toFixed(2)}%`,
      "Base Comisional (COP)": c.base_commission,
      "Comisión Calculada (COP)": c.calculated_commission,
      "MB Income (+20%)": c.has_mb_income ? "Sí" : "No",
      "Bonus Indicador (COP)": c.indicator_bonus,
      "Total Comisión (COP)": c.total_commission,
      Observaciones: c.observations || "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Comisiones Aprobadas");
    XLSX.writeFile(
      wb,
      `reporte_comisiones_${selectedMonth}_${selectedYear}.xlsx`
    );
  };

  const totalCommission = (commissions || []).reduce(
    (s, c) => s + c.total_commission,
    0
  );

  return (
    <div className="space-y-6">
      <MonthSelector
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
      />

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Comisiones Aprobadas</p>
            <p className="text-2xl font-bold text-emerald-600">
              {commissions?.length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">Total a Pagar</p>
            <p className="text-2xl font-bold text-primary">
              {formatCOP(totalCommission)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center justify-center">
            <Button
              onClick={handleDownloadExcel}
              disabled={!commissions || commissions.length === 0}
              className="gap-2"
            >
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
            <p className="text-muted-foreground">
              No hay comisiones aprobadas para este período.
            </p>
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
                    <TableHead>Ejecutivo</TableHead>
                    <TableHead>Regional</TableHead>
                    <TableHead className="text-right">% Firmas</TableHead>
                    <TableHead className="text-right">Candado</TableHead>
                    <TableHead className="text-right">% Orig</TableHead>
                    <TableHead className="text-right">% GMV</TableHead>
                    <TableHead className="text-right">MBs</TableHead>
                    <TableHead className="text-right">Bonus</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {c.user_name || c.user_email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {c.user_email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{c.regional}</TableCell>
                      <TableCell className="text-right">
                        {c.firmas_compliance.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={c.candado_met ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {c.candado_met ? "✅" : "❌"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {c.originaciones_weighted.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {c.gmv_weighted.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {c.has_mb_income ? "+20%" : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {c.indicator_bonus > 0
                          ? formatCOP(c.indicator_bonus)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCOP(c.total_commission)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
