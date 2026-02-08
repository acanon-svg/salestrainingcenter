import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, AlertCircle, Clock, Loader2, Link2 } from "lucide-react";
import { useResultsSyncConfig, useSaveResultsSyncConfig, useTriggerSync, type ResultsSyncConfig } from "@/hooks/useResultsSyncConfig";

export const ResultsSyncManager: React.FC = () => {
  const { data: syncData, isLoading } = useResultsSyncConfig();
  const saveMutation = useSaveResultsSyncConfig();
  const triggerMutation = useTriggerSync();

  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetName, setSheetName] = useState("Resultados");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (syncData?.config) {
      setSheetUrl(syncData.config.sheet_url || "");
      setSheetName(syncData.config.sheet_name || "Resultados");
      setEnabled(syncData.config.enabled || false);
    }
  }, [syncData]);

  const handleSave = () => {
    const config: ResultsSyncConfig = {
      ...(syncData?.config || {
        last_sync_at: null,
        last_sync_status: null,
        last_sync_count: null,
        last_sync_error: null,
      }),
      enabled,
      sheet_url: sheetUrl.trim(),
      sheet_name: sheetName.trim() || "Resultados",
    };

    saveMutation.mutate({ id: syncData?.id || null, config });
  };

  const handleSync = () => {
    triggerMutation.mutate();
  };

  const config = syncData?.config;
  const hasChanges =
    config &&
    (sheetUrl.trim() !== (config.sheet_url || "") ||
      sheetName.trim() !== (config.sheet_name || "Resultados") ||
      enabled !== (config.enabled || false));

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <RefreshCw className="h-5 w-5 text-primary" />
              Sincronización Automática
            </CardTitle>
            <CardDescription>
              Conecta un Google Sheet para que los resultados se actualicen automáticamente cada hora
            </CardDescription>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sheet URL */}
        <div className="space-y-2">
          <Label className="text-sm">URL del Google Sheet</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            El Sheet debe estar compartido con "Cualquiera con el enlace" como Lector
          </p>
        </div>

        {/* Sheet Name */}
        <div className="space-y-2">
          <Label className="text-sm">Nombre de la pestaña</Label>
          <Input
            placeholder="Resultados"
            value={sheetName}
            onChange={(e) => setSheetName(e.target.value)}
            className="max-w-xs"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saveMutation.isPending || !sheetUrl.trim()}
            variant={hasChanges ? "default" : "outline"}
          >
            {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Guardar configuración
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={triggerMutation.isPending || !config?.sheet_url}
            className="gap-2"
          >
            {triggerMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sincronizar ahora
          </Button>
        </div>

        {/* Sync Status */}
        {config?.last_sync_at && (
          <div className="pt-3 border-t space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Última sincronización:</span>
              <span className="font-medium">
                {new Date(config.last_sync_at).toLocaleString("es-CO", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {config.last_sync_status === "success" ? (
                <>
                  <CheckCircle className="h-4 w-4 text-success" />
                  <Badge variant="secondary" className="text-xs">
                    {config.last_sync_count} registros sincronizados
                  </Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <Badge variant="destructive" className="text-xs">
                    Error
                  </Badge>
                  {config.last_sync_error && (
                    <span className="text-xs text-destructive">{config.last_sync_error}</span>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Info */}
        {enabled && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <RefreshCw className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              La sincronización automática se ejecuta <strong>cada hora</strong>. Los registros sincronizados
              reemplazan los datos anteriores del mismo lote automático. Las cargas manuales no se ven afectadas.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
