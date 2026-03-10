import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useBulkClassifyCourses } from "@/hooks/useBulkCourseActions";

interface BulkClassifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseIds: string[];
  onComplete: () => void;
}

export const segmentLabels: Record<string, string> = {
  calle: "Ventas en calle",
  mediano: "Medianos negocios",
  grande: "Grandes negocios",
  lider: "Líderes",
  todos: "Todos",
};

export const categoryLabels: Record<string, string> = {
  tecnicas_venta: "Técnicas de venta",
  negociacion: "Negociación",
  producto: "Producto",
  liderazgo: "Liderazgo",
  herramientas: "Herramientas",
  otro: "Otro",
};

export const levelLabels: Record<string, string> = {
  basico: "Básico",
  medio: "Intermedio",
  avanzado: "Avanzado",
};

export const BulkClassifyDialog: React.FC<BulkClassifyDialogProps> = ({
  open,
  onOpenChange,
  courseIds,
  onComplete,
}) => {
  const [segment, setSegment] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const bulkClassify = useBulkClassifyCourses();

  const handleClassify = async () => {
    await bulkClassify.mutateAsync({
      courseIds,
      segment: segment || undefined,
      category: category || undefined,
      difficulty: difficulty || undefined,
    });
    setSegment("");
    setCategory("");
    setDifficulty("");
    onComplete();
    onOpenChange(false);
  };

  const hasChanges = segment || category || difficulty;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Clasificar {courseIds.length} curso(s)</DialogTitle>
          <DialogDescription>
            Solo se actualizarán los campos que selecciones.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Segmento</Label>
            <Select value={segment} onValueChange={setSegment}>
              <SelectTrigger>
                <SelectValue placeholder="Sin cambio" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(segmentLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Sin cambio" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nivel</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue placeholder="Sin cambio" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(levelLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleClassify}
            disabled={!hasChanges || bulkClassify.isPending}
          >
            {bulkClassify.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Aplicar clasificación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
