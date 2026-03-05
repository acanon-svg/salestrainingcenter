import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Zap, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import {
  useCommissionAccelerators,
  useCreateAccelerator,
  useUpdateAccelerator,
  useDeleteAccelerator,
  CommissionAccelerator,
} from "@/hooks/useCommissionAccelerators";

interface AcceleratorManagerProps {
  configId: string;
  configName: string;
  metaFirmas?: number;
}

export const AcceleratorManager: React.FC<AcceleratorManagerProps> = ({
  configId,
  configName,
  metaFirmas = 0,
}) => {
  const { data: accelerators, isLoading } = useCommissionAccelerators(configId);
  const createAccelerator = useCreateAccelerator();
  const updateAccelerator = useUpdateAccelerator();
  const deleteAccelerator = useDeleteAccelerator();

  const [editing, setEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ min_firmas: 0, bonus_percentage: 0, description: "" });

  const handleAdd = async () => {
    try {
      await createAccelerator.mutateAsync({
        config_id: configId,
        min_firmas: form.min_firmas,
        bonus_percentage: form.bonus_percentage,
        description: form.description || null,
        order_index: (accelerators?.length || 0),
      });
      toast.success("Acelerador agregado");
      setIsAdding(false);
      setForm({ min_firmas: 0, bonus_percentage: 0, description: "" });
    } catch {
      toast.error("Error al agregar acelerador");
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateAccelerator.mutateAsync({
        id,
        min_firmas: form.min_firmas,
        bonus_percentage: form.bonus_percentage,
        description: form.description || null,
      });
      toast.success("Acelerador actualizado");
      setEditing(null);
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAccelerator.mutateAsync(deleteId);
      toast.success("Acelerador eliminado");
      setDeleteId(null);
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const startEdit = (acc: CommissionAccelerator) => {
    setForm({
      min_firmas: acc.min_firmas,
      bonus_percentage: acc.bonus_percentage,
      description: acc.description || "",
    });
    setEditing(acc.id);
  };

  if (isLoading) return <div className="p-4 text-muted-foreground">Cargando aceleradores...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Aceleradores de Firmas
          </h4>
          <p className="text-xs text-muted-foreground">
            Bonos adicionales cuando cumple 100% de originaciones y GMV
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => {
          setForm({ min_firmas: 0, bonus_percentage: 0, description: "" });
          setIsAdding(true);
        }}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </div>

      {/* Add form */}
      {isAdding && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">% Cumplimiento Firmas</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.min_firmas}
                  onChange={(e) => setForm({ ...form, min_firmas: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">% Bono sobre total</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={form.bonus_percentage}
                  onChange={(e) => setForm({ ...form, bonus_percentage: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Descripción (opcional)</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ej: Bono top performer"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={createAccelerator.isPending}>
                <Save className="h-4 w-4 mr-1" />
                Guardar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accelerator list */}
      {(!accelerators || accelerators.length === 0) && !isAdding && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No hay aceleradores configurados para "{configName}".
        </p>
      )}

      {accelerators?.map((acc) => (
        <Card key={acc.id} className="border-muted">
          <CardContent className="pt-4">
            {editing === acc.id ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Firmas mínimas</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.min_firmas}
                      onChange={(e) => setForm({ ...form, min_firmas: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">% Bono sobre total</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.1}
                      value={form.bonus_percentage}
                      onChange={(e) => setForm({ ...form, bonus_percentage: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Descripción</Label>
                    <Input
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleUpdate(acc.id)} disabled={updateAccelerator.isPending}>
                    <Save className="h-4 w-4 mr-1" />
                    Guardar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="outline" className="font-mono">
                    ≥ {acc.min_firmas} firmas
                  </Badge>
                  <Badge className="bg-amber-500 text-white">
                    +{acc.bonus_percentage}%
                  </Badge>
                  {acc.description && (
                    <span className="text-sm text-muted-foreground">{acc.description}</span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => startEdit(acc)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleteId(acc.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este acelerador?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
