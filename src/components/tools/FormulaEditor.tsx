import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { CalculatorFormula, CalculatorVariable } from "@/hooks/useTools";

interface FormulaEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formula: Partial<CalculatorFormula> | null;
  variables: CalculatorVariable[];
  onSave: (formula: Partial<CalculatorFormula>) => void;
  isLoading?: boolean;
}

export const FormulaEditor: React.FC<FormulaEditorProps> = ({
  open,
  onOpenChange,
  formula,
  variables,
  onSave,
  isLoading,
}) => {
  const [formData, setFormData] = React.useState<Partial<CalculatorFormula>>({
    name: "",
    label: "",
    description: "",
    formula: "",
    result_type: "currency",
    visible_to_students: true,
    visible_to_leaders: true,
    order_index: 0,
  });

  React.useEffect(() => {
    if (formula) {
      setFormData(formula);
    } else {
      setFormData({
        name: "",
        label: "",
        description: "",
        formula: "",
        result_type: "currency",
        visible_to_students: true,
        visible_to_leaders: true,
        order_index: 0,
      });
    }
  }, [formula]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const insertVariable = (varName: string) => {
    const textarea = document.getElementById("formula-input") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentFormula = formData.formula || "";
      const newFormula =
        currentFormula.substring(0, start) + varName + currentFormula.substring(end);
      setFormData({ ...formData, formula: newFormula });
    } else {
      setFormData({ ...formData, formula: (formData.formula || "") + varName });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {formula?.id ? "Editar Fórmula" : "Nueva Fórmula"}
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
                placeholder="comision_total"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Etiqueta</Label>
              <Input
                id="label"
                value={formData.label || ""}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Comisión Total"
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
              placeholder="Describe qué calcula esta fórmula"
            />
          </div>

          <div className="space-y-2">
            <Label>Variables disponibles</Label>
            <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
              {variables.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay variables definidas. Crea variables primero.
                </p>
              ) : (
                variables.map((v) => (
                  <Badge
                    key={v.id}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => insertVariable(v.name)}
                  >
                    {v.name}
                    {v.weight !== 1 && (
                      <span className="ml-1 text-xs opacity-70">(peso: {v.weight})</span>
                    )}
                  </Badge>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Haz clic en una variable para insertarla en la fórmula
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="formula-input">Fórmula</Label>
            <Textarea
              id="formula-input"
              value={formData.formula || ""}
              onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
              placeholder="(ventas * comision_base) * peso_regional"
              className="font-mono"
              rows={3}
              required
            />
            <p className="text-xs text-muted-foreground">
              Usa operadores: + - * / ( ). Incluye "_peso" después de una variable para usar su peso.
              <br />
              Ejemplo: <code>ventas * comision * ventas_peso</code>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="result_type">Tipo de resultado</Label>
            <Select
              value={formData.result_type || "currency"}
              onValueChange={(value) => setFormData({ ...formData, result_type: value })}
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

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="visible_students">Visible para Estudiantes</Label>
                <p className="text-xs text-muted-foreground">
                  Los estudiantes podrán ver este resultado
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
                  Los líderes podrán ver este resultado
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
              {formula?.id ? "Guardar Cambios" : "Crear Fórmula"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
