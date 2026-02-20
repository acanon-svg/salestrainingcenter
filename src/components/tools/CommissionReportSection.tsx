import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileSpreadsheet, AlertCircle, ArrowUp, ArrowDown, ArrowUpDown, Clock, CheckCircle2, Send } from "lucide-react";
import { MonthSelector } from "./MonthSelector";
import { useApprovedCommissions, useNotApprovedCommissions, CommissionReview } from "@/hooks/useCommissionReviews";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const BASE_COMMISSION = 1500000;

type SortKey = "user" | "regional" | "firmas" | "candado" | "orig" | "gmv" | "total" | "mbs" | "bonus" | "totalComm" | "cumplimiento" | "status";
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

const sortCommissions = (items: CommissionReview[], sortKey: SortKey | null, sortDir: SortDir) => {
  if (!sortKey) return items;
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
      case "status": return c.status;
      default: return 0;
    }
  };
  return [...items].sort((a, b) => {
    const va = getValue(a);
    const vb = getValue(b);
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return sortDir === "desc" ? -cmp : cmp;
  });
};

const CommissionTable: React.FC<{
  items: CommissionReview[];
  sortKey: SortKey | null;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
  showStatus?: boolean;
}> = ({ items, sortKey, sortDir, onSort, showStatus }) => {
  const sharedHeadProps = { currentKey: sortKey, currentDir: sortDir, onSort };
  const sorted = useMemo(() => sortCommissions(items, sortKey, sortDir), [items, sortKey, sortDir]);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead label="Ejecutivo" sortKey="user" {...sharedHeadProps} />
            <SortableHead label="Regional" sortKey="regional" {...sharedHeadProps} />
            {showStatus && <SortableHead label="Estado" sortKey="status" {...sharedHeadProps} />}
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
          {sorted.map((c) => {
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
                {showStatus && (
                  <TableCell>
                    <Badge variant={c.status === "rejected" ? "destructive" : c.status === "not_sent" ? "outline" : "secondary"} className="text-xs">
                      {c.status === "pending" ? "⏳ Pendiente" : c.status === "not_sent" ? "📭 Sin enviar" : "🔄 Devuelta"}
                    </Badge>
                  </TableCell>
                )}
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
  );
};

export const CommissionReportSection: React.FC = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [sortKeyApproved, setSortKeyApproved] = useState<SortKey | null>(null);
  const [sortDirApproved, setSortDirApproved] = useState<SortDir>("desc");
  const [sortKeyNotApproved, setSortKeyNotApproved] = useState<SortKey | null>(null);
  const [sortDirNotApproved, setSortDirNotApproved] = useState<SortDir>("desc");

  const { data: approved, isLoading: loadingApproved } = useApprovedCommissions(selectedMonth, selectedYear);
  const { data: notApproved, isLoading: loadingNotApproved } = useNotApprovedCommissions(selectedMonth, selectedYear);

  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalMonth, setApprovalMonth] = useState(`${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`);
  const [isSendingApproval, setIsSendingApproval] = useState(false);

  const handleSortApproved = (key: SortKey) => {
    if (sortKeyApproved === key) setSortDirApproved(d => d === "desc" ? "asc" : "desc");
    else { setSortKeyApproved(key); setSortDirApproved("desc"); }
  };
  const handleSortNotApproved = (key: SortKey) => {
    if (sortKeyNotApproved === key) setSortDirNotApproved(d => d === "desc" ? "asc" : "desc");
    else { setSortKeyNotApproved(key); setSortDirNotApproved("desc"); }
  };

  const handleSendApproval = async () => {
    if (!approved || approved.length === 0) return;
    setIsSendingApproval(true);
    try {
      const BASE = 1500000;
      const rows = approved.map((c) => {
        const totalWeighted = c.originaciones_weighted + c.gmv_weighted;
        const cumplimiento = c.total_commission / BASE;
        return {
          allyCluster: "SMB",
          email: c.user_email,
          managerEmail: "staborda@addi.com",
          targetAccomplishmentPercentage: `${(cumplimiento * 100).toFixed(1)}%`,
          AccomplishmentPercentage: `${totalWeighted.toFixed(1)}%`,
          date: approvalMonth,
        };
      });

      const { data, error } = await supabase.functions.invoke("send-commission-approval", {
        body: { rows },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`${rows.length} comisiones enviadas al Sheet exitosamente`);
      setShowApprovalDialog(false);
    } catch (err: any) {
      console.error("Error sending approval:", err);
      toast.error(`Error al enviar: ${err.message || "Error desconocido"}`);
    } finally {
      setIsSendingApproval(false);
    }
  };

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, "0");
    const names = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return { value: m, label: names[i] };
  });

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = now.getFullYear() - 2 + i;
    return { value: String(y), label: String(y) };
  });

  const handleDownloadExcel = () => {
    if (!approved || approved.length === 0) return;
    const rows = approved.map((c) => {
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
    const pctCols = ["% Firmas", "Ponderación Orig (50%)", "Ponderación GMV (50%)", "Total (Orig + GMV)", "Cumplimiento (%)"];
    const headers = Object.keys(rows[0]);
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    for (const colName of pctCols) {
      const colIdx = headers.indexOf(colName);
      if (colIdx === -1) continue;
      for (let r = range.s.r + 1; r <= range.e.r; r++) {
        const cellRef = XLSX.utils.encode_cell({ r, c: colIdx });
        if (ws[cellRef]) ws[cellRef].z = "0.0%";
      }
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Comisiones Aprobadas");
    XLSX.writeFile(wb, `reporte_comisiones_${selectedMonth}_${selectedYear}.xlsx`);
  };

  const totalApprovedComm = (approved || []).reduce((s, c) => s + c.total_commission, 0);
  const isLoading = loadingApproved || loadingNotApproved;

  return (
    <div className="space-y-6">
      <MonthSelector
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
      />

      <Tabs defaultValue="not-approved">
        <TabsList>
          <TabsTrigger value="not-approved" className="gap-2">
            <Clock className="h-4 w-4" />
            No Aprobadas
            {(notApproved?.length || 0) > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{notApproved?.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Aprobadas
            {(approved?.length || 0) > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{approved?.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="not-approved" className="mt-6 space-y-4">
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : !notApproved || notApproved.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
                <p className="text-muted-foreground">Todas las comisiones de este período han sido aprobadas.</p>
              </CardContent>
            </Card>
          ) : (
            <CommissionTable
              items={notApproved}
              sortKey={sortKeyNotApproved}
              sortDir={sortDirNotApproved}
              onSort={handleSortNotApproved}
              showStatus
            />
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-xs text-muted-foreground">Comisiones Aprobadas</p>
                <p className="text-2xl font-bold text-primary">{approved?.length || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-xs text-muted-foreground">Total a Pagar</p>
                <p className="text-2xl font-bold text-primary">{formatCOP(totalApprovedComm)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 flex items-center justify-center gap-2 flex-wrap">
                <Button onClick={handleDownloadExcel} disabled={!approved || approved.length === 0} className="gap-2">
                  <Download className="h-4 w-4" />
                  Descargar Excel
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowApprovalDialog(true)}
                  disabled={!approved || approved.length === 0}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Aprobación
                </Button>
              </CardContent>
            </Card>
          </div>

          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : !approved || approved.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay comisiones aprobadas para este período.</p>
              </CardContent>
            </Card>
          ) : (
            <CommissionTable
              items={approved}
              sortKey={sortKeyApproved}
              sortDir={sortDirApproved}
              onSort={handleSortApproved}
            />
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirme el mes de comisión</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se enviarán <strong>{approved?.length || 0}</strong> comisiones aprobadas al Google Sheet.
          </p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Mes</label>
              <Select
                value={approvalMonth.split("-")[0]}
                onValueChange={(m) => setApprovalMonth(`${m}-${approvalMonth.split("-")[1]}`)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Año</label>
              <Select
                value={approvalMonth.split("-")[1]}
                onValueChange={(y) => setApprovalMonth(`${approvalMonth.split("-")[0]}-${y}`)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Fecha seleccionada: <strong>{approvalMonth}</strong>
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendApproval} disabled={isSendingApproval} className="gap-2">
              <Send className="h-4 w-4" />
              {isSendingApproval ? "Enviando..." : "Confirmar y enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
