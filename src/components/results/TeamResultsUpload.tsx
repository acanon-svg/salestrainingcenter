import React, { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Upload, Link2, FileSpreadsheet, Trash2, Loader2, AlertCircle, CheckCircle, Info, ChevronDown, Download } from "lucide-react";
import { useUploadTeamResults, useTeamResultsBatches, useDeleteTeamResultsBatch, type TeamResultInsert } from "@/hooks/useTeamResults";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { ResultsSyncManager } from "./ResultsSyncManager";

const REQUIRED_COLUMNS = [
  { name: "correo", description: "Correo electrónico del ejecutivo", example: "ejecutivo@addi.com" },
  { name: "mes", description: "Número de mes (1-12)", example: "2" },
  { name: "año", description: "Año (4 dígitos)", example: "2026" },
  { name: "semanas", description: "Número de semanas del mes (para dividir metas semanales)", example: "4" },
  { name: "regional", description: "Regional del ejecutivo", example: "Bogotá" },
  { name: "equipo", description: "Equipo al que pertenece", example: "Field Sales" },
  { name: "firmas_real", description: "Firmas reales del período", example: "45" },
  { name: "firmas_meta", description: "Meta mensual de firmas", example: "50" },
  { name: "originaciones_real", description: "Originaciones reales (COP)", example: "150000000" },
  { name: "originaciones_meta", description: "Meta mensual de originaciones (COP)", example: "200000000" },
  { name: "gmv_real", description: "GMV real (USD)", example: "85000" },
  { name: "gmv_meta", description: "Meta mensual GMV (USD)", example: "100000" },
];

const normalizeHeader = (h: string): string => {
  return h
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
};

const parseRows = (rows: Record<string, any>[]): { data: TeamResultInsert[]; errors: string[] } => {
  const data: TeamResultInsert[] = [];
  const errors: string[] = [];

  rows.forEach((row, idx) => {
    const normalized: Record<string, any> = {};
    for (const [key, val] of Object.entries(row)) {
      normalized[normalizeHeader(key)] = val;
    }

    const email = normalized.correo || normalized.email || normalized.user_email;
    if (!email) {
      errors.push(`Fila ${idx + 2}: Falta correo`);
      return;
    }

    // Determine period_date from mes+año or from fecha
    let periodDate: string;

    const mes = normalized.mes || normalized.month;
    const ano = normalized.ano || normalized.año || normalized.year;

    if (mes && ano) {
      const monthNum = Number(mes);
      const yearNum = Number(ano);
      if (monthNum < 1 || monthNum > 12 || isNaN(monthNum)) {
        errors.push(`Fila ${idx + 2}: Mes inválido "${mes}" (debe ser 1-12)`);
        return;
      }
      if (yearNum < 2020 || yearNum > 2100 || isNaN(yearNum)) {
        errors.push(`Fila ${idx + 2}: Año inválido "${ano}"`);
        return;
      }
      periodDate = `${yearNum}-${String(monthNum).padStart(2, "0")}-01`;
    } else {
      // Fallback: try fecha/date column
      const dateVal = normalized.fecha || normalized.date || normalized.period_date;
      if (dateVal instanceof Date) {
        periodDate = dateVal.toISOString().split("T")[0];
      } else if (typeof dateVal === "number") {
        const d = XLSX.SSF.parse_date_code(dateVal);
        periodDate = `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
      } else if (typeof dateVal === "string") {
        const parsed = new Date(dateVal);
        if (isNaN(parsed.getTime())) {
          errors.push(`Fila ${idx + 2}: Fecha inválida "${dateVal}"`);
          return;
        }
        periodDate = parsed.toISOString().split("T")[0];
      } else {
        errors.push(`Fila ${idx + 2}: Falta mes/año o fecha`);
        return;
      }
    }

    const weeksRaw = normalized.semanas || normalized.weeks || normalized.weeks_in_month;
    const weeksInMonth = weeksRaw ? Number(weeksRaw) : 4;
    if (weeksInMonth < 1 || weeksInMonth > 6 || isNaN(weeksInMonth)) {
      errors.push(`Fila ${idx + 2}: Semanas inválido "${weeksRaw}" (debe ser 1-6)`);
      return;
    }

    data.push({
      user_email: String(email).trim().toLowerCase(),
      regional: normalized.regional || undefined,
      team: normalized.equipo || normalized.team || undefined,
      firmas_real: Number(normalized.firmas_real) || 0,
      firmas_meta: Number(normalized.firmas_meta) || 0,
      originaciones_real: Number(normalized.originaciones_real) || 0,
      originaciones_meta: Number(normalized.originaciones_meta) || 0,
      gmv_real: Number(normalized.gmv_real) || 0,
      gmv_meta: Number(normalized.gmv_meta) || 0,
      period_date: periodDate,
      weeks_in_month: weeksInMonth,
    });
  });

  return { data, errors };
};

const handleDownloadTemplate = () => {
  const templateData = [
    {
      correo: "ejecutivo1@addi.com",
      mes: 1,
      año: 2026,
      semanas: 4,
      regional: "Bogotá",
      equipo: "Field Sales",
      firmas_real: 45,
      firmas_meta: 50,
      originaciones_real: 150000000,
      originaciones_meta: 200000000,
      gmv_real: 85000,
      gmv_meta: 100000,
    },
    {
      correo: "ejecutivo2@addi.com",
      mes: 1,
      año: 2026,
      semanas: 4,
      regional: "Medellín",
      equipo: "Field Sales",
      firmas_real: 38,
      firmas_meta: 50,
      originaciones_real: 120000000,
      originaciones_meta: 180000000,
      gmv_real: 72000,
      gmv_meta: 95000,
    },
    {
      correo: "ejecutivo1@addi.com",
      mes: 2,
      año: 2026,
      semanas: 4,
      regional: "Bogotá",
      equipo: "Field Sales",
      firmas_real: 52,
      firmas_meta: 50,
      originaciones_real: 210000000,
      originaciones_meta: 200000000,
      gmv_real: 105000,
      gmv_meta: 100000,
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Resultados");

  // Auto-width columns
  const colWidths = Object.keys(templateData[0]).map((key) => ({
    wch: Math.max(key.length + 2, 18),
  }));
  ws["!cols"] = colWidths;

  XLSX.writeFile(wb, "plantilla_resultados_equipo.xlsx");
};

export const TeamResultsUpload: React.FC = () => {
  const [preview, setPreview] = useState<TeamResultInsert[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [sheetUrl, setSheetUrl] = useState("");
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [showFormat, setShowFormat] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadTeamResults();
  const deleteBatchMutation = useDeleteTeamResultsBatch();
  const { data: batches, isLoading: loadingBatches } = useTeamResultsBatches();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, any>[];

        const result = parseRows(rows);
        setPreview(result.data);
        setParseErrors(result.errors);

        if (result.data.length === 0 && result.errors.length === 0) {
          toast.error("No se encontraron datos en el archivo");
        }
      } catch (err: any) {
        toast.error(`Error al leer archivo: ${err.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleGoogleSheetLoad = async () => {
    if (!sheetUrl.trim()) return;

    setIsLoadingSheet(true);
    try {
      const match = sheetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (!match) {
        toast.error("URL de Google Sheet inválida. Debe ser del formato: https://docs.google.com/spreadsheets/d/ID/...");
        return;
      }

      // Use edge function proxy to avoid CORS issues
      // Always target the "Resultados" sheet by name, and use gviz endpoint for formulated values
      const { data, error } = await supabase.functions.invoke("fetch-google-sheet", {
        body: { url: sheetUrl.trim(), sheetName: "Resultados" },
      });

      if (error) {
        toast.error(`No se pudo acceder al Sheet. Asegúrate de que sea público o esté compartido con "Cualquiera con el enlace".`);
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      const csvText = data.csv;
      const workbook = XLSX.read(csvText, { type: "string" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, any>[];

      const result = parseRows(rows);
      setPreview(result.data);
      setParseErrors(result.errors);

      if (result.data.length > 0) {
        toast.success(`${result.data.length} filas cargadas desde Google Sheet`);
      }
    } catch (err: any) {
      toast.error(`Error al cargar Sheet: ${err.message}`);
    } finally {
      setIsLoadingSheet(false);
    }
  };

  const handleUpload = () => {
    if (preview.length === 0) return;
    uploadMutation.mutate(preview, {
      onSuccess: () => {
        setPreview([]);
        setParseErrors([]);
        setSheetUrl("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Auto-Sync Manager */}
      <ResultsSyncManager />
      {/* Format Guide */}
      <Card className="border-primary/30 bg-primary/5">
        <Collapsible open={showFormat} onOpenChange={setShowFormat}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-primary/10 transition-colors rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Formato del archivo de resultados</CardTitle>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showFormat ? "rotate-180" : ""}`} />
              </div>
              <CardDescription>
                Click para ver las columnas requeridas y descargar la plantilla
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                El archivo debe contener las siguientes columnas. Puedes usar un mismo archivo con datos de varios meses — cada fila se asocia al mes y año indicados.
              </p>

              <div className="border rounded-lg overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-semibold">Columna</TableHead>
                      <TableHead className="text-xs font-semibold">Descripción</TableHead>
                      <TableHead className="text-xs font-semibold">Ejemplo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {REQUIRED_COLUMNS.map((col) => (
                      <TableRow key={col.name}>
                        <TableCell className="text-xs font-mono font-medium">{col.name}</TableCell>
                        <TableCell className="text-xs">{col.description}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{col.example}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
                <AlertCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Histórico:</strong> Puedes tener múltiples meses en el mismo archivo. Cada fila debe indicar a qué mes y año corresponde.</p>
                  <p><strong>Semanas:</strong> La columna <code className="px-1 py-0.5 bg-muted rounded text-foreground">semanas</code> permite dividir la meta mensual por semanas. Ejemplo: si la meta de firmas es 50 y el mes tiene 4 semanas, la meta semanal es 12.5. Si se omite, se asume 4 semanas.</p>
                  <p><strong>Alternativa fecha:</strong> En lugar de <code className="px-1 py-0.5 bg-muted rounded text-foreground">mes</code> y <code className="px-1 py-0.5 bg-muted rounded text-foreground">año</code>, puedes usar una columna <code className="px-1 py-0.5 bg-muted rounded text-foreground">fecha</code> con formato YYYY-MM-DD (ej: 2026-02-01).</p>
                  <p><strong>Google Sheets:</strong> El Sheet debe ser público o estar compartido con "Cualquiera con el enlace".</p>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-2">
                <Download className="h-4 w-4" />
                Descargar plantilla Excel
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Upload Card */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Cargar Resultados del Equipo
          </CardTitle>
          <CardDescription>
            Sube un archivo CSV/Excel o conecta un Google Sheet con las columnas indicadas arriba
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="file">
            <TabsList>
              <TabsTrigger value="file" className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Archivo CSV/Excel
              </TabsTrigger>
              <TabsTrigger value="sheet" className="gap-2">
                <Link2 className="h-4 w-4" />
                Google Sheet
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="mt-4">
              <div className="space-y-3">
                <Label>Seleccionar archivo</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                />
              </div>
            </TabsContent>

            <TabsContent value="sheet" className="mt-4">
              <div className="space-y-3">
                <Label>URL del Google Sheet (compartido con "Cualquiera con el enlace")</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                  />
                  <Button onClick={handleGoogleSheetLoad} disabled={isLoadingSheet || !sheetUrl.trim()}>
                    {isLoadingSheet ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cargar"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Parse Errors */}
          {parseErrors.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <div className="flex items-center gap-2 text-destructive text-sm font-medium mb-2">
                <AlertCircle className="h-4 w-4" />
                {parseErrors.length} advertencia(s)
              </div>
              <div className="max-h-32 overflow-auto text-xs text-destructive/80 space-y-1">
                {parseErrors.map((e, i) => (
                  <p key={i}>{e}</p>
                ))}
              </div>
            </div>
          )}

          {/* Data Preview */}
          {preview.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">{preview.length} registros listos para cargar</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setPreview([]); setParseErrors([]); }}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleUpload} disabled={uploadMutation.isPending}>
                    {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Subir {preview.length} registros
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg overflow-auto max-h-64">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Correo</TableHead>
                      <TableHead className="text-xs">Período</TableHead>
                      <TableHead className="text-xs text-center">Sem.</TableHead>
                      <TableHead className="text-xs">Regional</TableHead>
                      <TableHead className="text-xs">Equipo</TableHead>
                      <TableHead className="text-xs text-right">Firmas R</TableHead>
                      <TableHead className="text-xs text-right">Firmas M</TableHead>
                      <TableHead className="text-xs text-right">Orig R</TableHead>
                      <TableHead className="text-xs text-right">Orig M</TableHead>
                      <TableHead className="text-xs text-right">GMV R</TableHead>
                      <TableHead className="text-xs text-right">GMV M</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.slice(0, 20).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{row.user_email}</TableCell>
                        <TableCell className="text-xs">{row.period_date}</TableCell>
                        <TableCell className="text-xs text-center">{row.weeks_in_month}</TableCell>
                        <TableCell className="text-xs">{row.regional || "—"}</TableCell>
                        <TableCell className="text-xs">{row.team || "—"}</TableCell>
                        <TableCell className="text-xs text-right">{row.firmas_real}</TableCell>
                        <TableCell className="text-xs text-right">{row.firmas_meta}</TableCell>
                        <TableCell className="text-xs text-right">{row.originaciones_real.toLocaleString("es-CO")}</TableCell>
                        <TableCell className="text-xs text-right">{row.originaciones_meta.toLocaleString("es-CO")}</TableCell>
                        <TableCell className="text-xs text-right">{row.gmv_real.toLocaleString("en-US")}</TableCell>
                        <TableCell className="text-xs text-right">{row.gmv_meta.toLocaleString("en-US")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {preview.length > 20 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    ...y {preview.length - 20} registros más
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Previous Uploads */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Cargas Anteriores</CardTitle>
          <CardDescription>Historial de lotes cargados</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingBatches ? (
            <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : batches && batches.length > 0 ? (
            <div className="space-y-3">
              {batches.map((batch) => (
                <div key={batch.batch_id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(batch.created_at).toLocaleDateString("es-CO", { dateStyle: "medium" })}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{batch.count} registros</Badge>
                      {batch.regionals.map((r: string) => (
                        <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
                      ))}
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                        disabled={deleteBatchMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Eliminar</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar este lote de resultados?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Se eliminarán <strong>{batch.count} registros</strong> cargados el{" "}
                          {new Date(batch.created_at).toLocaleDateString("es-CO", { dateStyle: "long" })}.
                          {batch.regionals.length > 0 && (
                            <> Regionales: {batch.regionals.join(", ")}.</>
                          )}
                          <br /><br />
                          Esta acción no se puede deshacer. Podrás volver a cargar los resultados corregidos después.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteBatchMutation.mutate(batch.batch_id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleteBatchMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Sí, eliminar lote
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6">No hay cargas anteriores</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
