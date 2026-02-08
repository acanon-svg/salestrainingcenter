import React, { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Link2, FileSpreadsheet, Trash2, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useUploadTeamResults, useTeamResultsBatches, useDeleteTeamResultsBatch, type TeamResultInsert } from "@/hooks/useTeamResults";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const EXPECTED_COLUMNS = [
  "correo",
  "firmas_real",
  "firmas_meta",
  "originaciones_real",
  "originaciones_meta",
  "gmv_real",
  "gmv_meta",
  "fecha",
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

    const dateVal = normalized.fecha || normalized.date || normalized.period_date;
    let periodDate: string;
    if (dateVal instanceof Date) {
      periodDate = dateVal.toISOString().split("T")[0];
    } else if (typeof dateVal === "number") {
      // Excel serial date
      const d = XLSX.SSF.parse_date_code(dateVal);
      periodDate = `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
    } else if (typeof dateVal === "string") {
      // Try various formats
      const parsed = new Date(dateVal);
      if (isNaN(parsed.getTime())) {
        errors.push(`Fila ${idx + 2}: Fecha inválida "${dateVal}"`);
        return;
      }
      periodDate = parsed.toISOString().split("T")[0];
    } else {
      errors.push(`Fila ${idx + 2}: Falta fecha`);
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
    });
  });

  return { data, errors };
};

export const TeamResultsUpload: React.FC = () => {
  const [preview, setPreview] = useState<TeamResultInsert[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [sheetUrl, setSheetUrl] = useState("");
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
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
      // Convert Google Sheet URL to CSV export URL
      const match = sheetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (!match) {
        toast.error("URL de Google Sheet inválida. Debe ser del formato: https://docs.google.com/spreadsheets/d/ID/...");
        return;
      }

      const sheetId = match[1];
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

      const response = await fetch(csvUrl);
      if (!response.ok) {
        toast.error("No se pudo acceder al Sheet. Asegúrate de que sea público o esté compartido con 'Cualquiera con el enlace'.");
        return;
      }

      const csvText = await response.text();
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
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Cargar Resultados del Equipo
          </CardTitle>
          <CardDescription>
            Sube un archivo CSV/Excel o conecta un Google Sheet con las columnas: Correo, Firmas Real, Firmas Meta, Originaciones Real, Originaciones Meta, GMV Real, GMV Meta, Fecha
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
                <Label>URL del Google Sheet (debe ser público)</Label>
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
                      <TableHead className="text-xs">Fecha</TableHead>
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
                        <TableCell className="text-xs text-right">{row.firmas_real}</TableCell>
                        <TableCell className="text-xs text-right">{row.firmas_meta}</TableCell>
                        <TableCell className="text-xs text-right">{row.originaciones_real}</TableCell>
                        <TableCell className="text-xs text-right">{row.originaciones_meta}</TableCell>
                        <TableCell className="text-xs text-right">{row.gmv_real}</TableCell>
                        <TableCell className="text-xs text-right">{row.gmv_meta}</TableCell>
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteBatchMutation.mutate(batch.batch_id)}
                    disabled={deleteBatchMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
