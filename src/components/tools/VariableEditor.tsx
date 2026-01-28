import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CalculatorVariable } from "@/hooks/useTools";

interface VariableEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variable: Partial<CalculatorVariable> | null;
  onSave: (variable: Partial<CalculatorVariable>) => void;
  isLoading?: boolean;
}

export const VariableEditor: React.FC<VariableEditorProps> = ({
  open,
  onOpenChange,
  variable,
  onSave,
  isLoading,
}) => {
  const [formData, setFormData] = React.useState<Partial<CalculatorVariable>>({
    name: "",
    label: "",
    description: "",
    variable_type: "number",
    default_value: 0,
    min_value: null,
    max_value: null,
    weight: 1,
    visible_to_students: true,
    visible_to_leaders: true,
    order_index: 0,
  });

  React.useEffect(() => {
    if (variable) {
      setFormData(variable);
    } else {
      setFormData({
        name: "",
        label: "",
        description: "",
        variable_type: "number",
        default_value: 0,
        min_value: null,
        max_value: null,
        weight: 1,
        visible_to_students: true,
        visible_to_leaders: true,
        order_index: 0,
      });
    }
  }, [variable]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {variable?.id ? "Editar Variable" : "Nueva Variable"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre (código)</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s/g, "_") })
                }
                placeholder="ventas_mes"
                required
              />
              <p className="text-xs text-muted-foreground">
                Usado en las fórmulas (ej: ventas_mes)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Etiqueta</Label>
              <Input
                id="label"
                value={formData.label || ""}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Ventas del Mes"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe qué representa esta variable"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="variable_type">Tipo</Label>
              <Select
                value={formData.variable_type || "number"}
                onValueChange={(value) => setFormData({ ...formData, variable_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">Número</SelectItem>
                  <SelectItem value="percentage">Porcentaje</SelectItem>
                  <SelectItem value="currency">Moneda (COP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Peso</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                value={formData.weight ?? 1}
                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 1 })}
              />
              <p className="text-xs text-muted-foreground">
                Factor multiplicador para cálculos
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="default_value">Valor por defecto</Label>
              <Input
                id="default_value"
                type="number"
                value={formData.default_value ?? 0}
                onChange={(e) =>
                  setFormData({ ...formData, default_value: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_value">Mínimo</Label>
              <Input
                id="min_value"
                type="number"
                value={formData.min_value ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    min_value: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                placeholder="Sin límite"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_value">Máximo</Label>
              <Input
                id="max_value"
                type="number"
                value={formData.max_value ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_value: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                placeholder="Sin límite"
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="visible_students">Visible para Estudiantes</Label>
                <p className="text-xs text-muted-foreground">
                  Los estudiantes podrán ver y usar esta variable
                </p>
              </div>
              <Switch
                id="visible_students"
                checked={formData.visible_to_students ?? true}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, visible_to_students: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="visible_leaders">Visible para Líderes</Label>
                <p className="text-xs text-muted-foreground">
                  Los líderes podrán ver y usar esta variable
                </p>
              </div>
              <Switch
                id="visible_leaders"
                checked={formData.visible_to_leaders ?? true}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, visible_to_leaders: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {variable?.id ? "Guardar Cambios" : "Crear Variable"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
