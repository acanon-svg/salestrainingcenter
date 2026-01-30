import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import { RefreshCcw, AlertTriangle, Loader2, Trash2, RotateCcw } from "lucide-react";

interface ResetOptions {
  resetEnrollments: boolean;
  resetUserBadges: boolean;
  resetPoints: boolean;
  deleteDemoBadges: boolean;
}

export const DataResetManager: React.FC = () => {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [options, setOptions] = useState<ResetOptions>({
    resetEnrollments: true,
    resetUserBadges: true,
    resetPoints: true,
    deleteDemoBadges: false,
  });
  const [isOpen, setIsOpen] = useState(false);

  const isCreator = hasRole("creator") || hasRole("admin");

  const resetMutation = useMutation({
    mutationFn: async (opts: ResetOptions) => {
      const results: string[] = [];

      if (opts.resetUserBadges) {
        const { error } = await supabase.from("user_badges").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (error) throw new Error(`Error al eliminar insignias ganadas: ${error.message}`);
        results.push("Insignias ganadas eliminadas");
      }

      if (opts.resetEnrollments) {
        const { error } = await supabase.from("course_enrollments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (error) throw new Error(`Error al eliminar inscripciones: ${error.message}`);
        results.push("Inscripciones y progreso eliminados");
      }

      if (opts.resetPoints) {
        const { error } = await supabase
          .from("profiles")
          .update({ points: 0, badges_count: 0 })
          .neq("user_id", "00000000-0000-0000-0000-000000000000");
        if (error) throw new Error(`Error al reiniciar puntos: ${error.message}`);
        results.push("Puntos y contadores reiniciados");
      }

      if (opts.deleteDemoBadges) {
        const { error } = await supabase.from("badges").delete().is("created_by", null);
        if (error) throw new Error(`Error al eliminar insignias demo: ${error.message}`);
        results.push("Insignias sin creador eliminadas");
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["badges"] });
      queryClient.invalidateQueries({ queryKey: ["my-badges"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-courses"] });
      queryClient.invalidateQueries({ queryKey: ["pending-courses"] });
      queryClient.invalidateQueries({ queryKey: ["user-badges-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });

      toast({
        title: "Datos reiniciados",
        description: results.join(". "),
      });
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error al reiniciar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!isCreator) return null;

  const anySelected = Object.values(options).some(Boolean);

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <RefreshCcw className="h-5 w-5" />
          Reiniciar Datos del Sistema
        </CardTitle>
        <CardDescription>
          Herramienta para reiniciar el progreso y datos de todos los usuarios.
          Esta acción es irreversible.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Checkbox
              id="resetEnrollments"
              checked={options.resetEnrollments}
              onCheckedChange={(checked) =>
                setOptions((prev) => ({ ...prev, resetEnrollments: checked as boolean }))
              }
            />
            <div>
              <Label htmlFor="resetEnrollments" className="font-medium cursor-pointer">
                Eliminar inscripciones y progreso
              </Label>
              <p className="text-xs text-muted-foreground">
                Borra todas las inscripciones a cursos y el progreso de todos los usuarios
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="resetUserBadges"
              checked={options.resetUserBadges}
              onCheckedChange={(checked) =>
                setOptions((prev) => ({ ...prev, resetUserBadges: checked as boolean }))
              }
            />
            <div>
              <Label htmlFor="resetUserBadges" className="font-medium cursor-pointer">
                Eliminar insignias ganadas
              </Label>
              <p className="text-xs text-muted-foreground">
                Quita todas las insignias que los usuarios han obtenido
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="resetPoints"
              checked={options.resetPoints}
              onCheckedChange={(checked) =>
                setOptions((prev) => ({ ...prev, resetPoints: checked as boolean }))
              }
            />
            <div>
              <Label htmlFor="resetPoints" className="font-medium cursor-pointer">
                Reiniciar puntos a cero
              </Label>
              <p className="text-xs text-muted-foreground">
                Pone en cero los puntos y el contador de insignias de todos los perfiles
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="deleteDemoBadges"
              checked={options.deleteDemoBadges}
              onCheckedChange={(checked) =>
                setOptions((prev) => ({ ...prev, deleteDemoBadges: checked as boolean }))
              }
            />
            <div>
              <Label htmlFor="deleteDemoBadges" className="font-medium cursor-pointer">
                Eliminar insignias demo
              </Label>
              <p className="text-xs text-muted-foreground">
                Elimina insignias que no tienen un creador asignado (datos de demostración)
              </p>
            </div>
          </div>
        </div>

        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={!anySelected} className="w-full">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reiniciar Datos Seleccionados
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                ¿Confirmar reinicio de datos?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>Esta acción eliminará permanentemente los siguientes datos para TODOS los usuarios:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {options.resetEnrollments && <li>Inscripciones y progreso en cursos</li>}
                  {options.resetUserBadges && <li>Insignias ganadas por usuarios</li>}
                  {options.resetPoints && <li>Puntos acumulados (se pondrán en 0)</li>}
                  {options.deleteDemoBadges && <li>Insignias sin creador (demo)</li>}
                </ul>
                <p className="font-semibold text-destructive">Esta acción NO se puede deshacer.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => resetMutation.mutate(options)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={resetMutation.isPending}
              >
                {resetMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reiniciando...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Sí, reiniciar datos
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
