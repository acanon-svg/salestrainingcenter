import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2 } from "lucide-react";
import { useSyncFollowups } from "@/hooks/useFollowups";

export const FollowupSyncCard: React.FC = () => {
  const sync = useSyncFollowups();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Sincronización de Seguimientos
        </CardTitle>
        <CardDescription>
          Fuerza la sincronización manual de los datos de acompañamientos, feedback universal y calidad desde las hojas de cálculo externas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => sync.mutate(undefined)}
            disabled={sync.isPending}
            className="gap-2"
          >
            {sync.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sincronizar todo
          </Button>
          <Button
            variant="outline"
            onClick={() => sync.mutate(["accompaniments"])}
            disabled={sync.isPending}
          >
            Acompañamientos
          </Button>
          <Button
            variant="outline"
            onClick={() => sync.mutate(["universal_feedback"])}
            disabled={sync.isPending}
          >
            Feedback Universal
          </Button>
          <Button
            variant="outline"
            onClick={() => sync.mutate(["quality"])}
            disabled={sync.isPending}
          >
            Calidad
          </Button>
        </div>
        {sync.isSuccess && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            Sincronización completada exitosamente.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
