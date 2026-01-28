import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Variable, Calculator, Eye, EyeOff } from "lucide-react";
import { useCalculatorVariables, useCalculatorFormulas, CalculatorVariable, CalculatorFormula } from "@/hooks/useTools";
import { VariableEditor } from "./VariableEditor";
import { FormulaEditor } from "./FormulaEditor";
import { CommissionCalculator } from "./CommissionCalculator";

interface CalculatorConfiguratorProps {
  toolId: string;
}

export const CalculatorConfigurator: React.FC<CalculatorConfiguratorProps> = ({ toolId }) => {
  const { variables, createVariable, updateVariable, deleteVariable } = useCalculatorVariables(toolId);
  const { formulas, createFormula, updateFormula, deleteFormula } = useCalculatorFormulas(toolId);

  const [variableEditorOpen, setVariableEditorOpen] = useState(false);
  const [formulaEditorOpen, setFormulaEditorOpen] = useState(false);
  const [selectedVariable, setSelectedVariable] = useState<Partial<CalculatorVariable> | null>(null);
  const [selectedFormula, setSelectedFormula] = useState<Partial<CalculatorFormula> | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "variable" | "formula"; id: string } | null>(null);

  const handleEditVariable = (variable: CalculatorVariable) => {
    setSelectedVariable(variable);
    setVariableEditorOpen(true);
  };

  const handleEditFormula = (formula: CalculatorFormula) => {
    setSelectedFormula(formula);
    setFormulaEditorOpen(true);
  };

  const handleSaveVariable = async (data: Partial<CalculatorVariable>) => {
    if (selectedVariable?.id) {
      await updateVariable.mutateAsync({ id: selectedVariable.id, ...data });
    } else {
      if (!data.name || !data.label) return;
      await createVariable.mutateAsync({
        tool_id: toolId,
        name: data.name,
        label: data.label,
        description: data.description,
        variable_type: data.variable_type,
        default_value: data.default_value,
        min_value: data.min_value,
        max_value: data.max_value,
        weight: data.weight,
        visible_to_students: data.visible_to_students,
        visible_to_leaders: data.visible_to_leaders,
        order_index: data.order_index,
      });
    }
    setVariableEditorOpen(false);
    setSelectedVariable(null);
  };

  const handleSaveFormula = async (data: Partial<CalculatorFormula>) => {
    if (selectedFormula?.id) {
      await updateFormula.mutateAsync({ id: selectedFormula.id, ...data });
    } else {
      if (!data.name || !data.label || !data.formula) return;
      await createFormula.mutateAsync({
        tool_id: toolId,
        name: data.name,
        label: data.label,
        formula: data.formula,
        description: data.description,
        result_type: data.result_type,
        visible_to_students: data.visible_to_students,
        visible_to_leaders: data.visible_to_leaders,
        order_index: data.order_index,
      });
    }
    setFormulaEditorOpen(false);
    setSelectedFormula(null);
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      if (itemToDelete.type === "variable") {
        deleteVariable.mutate(itemToDelete.id);
      } else {
        deleteFormula.mutate(itemToDelete.id);
      }
    }
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="config">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="config">Configuración</TabsTrigger>
          <TabsTrigger value="preview">Vista Previa</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6 mt-6">
          {/* Variables Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Variable className="h-5 w-5" />
                    Variables
                  </CardTitle>
                  <CardDescription>
                    Define las variables que se usarán en los cálculos
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setSelectedVariable(null);
                    setVariableEditorOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Variable
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {variables && variables.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Etiqueta</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Peso</TableHead>
                      <TableHead>Visibilidad</TableHead>
                      <TableHead className="w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variables.map((variable) => (
                      <TableRow key={variable.id}>
                        <TableCell className="font-mono text-sm">{variable.name}</TableCell>
                        <TableCell>{variable.label}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{variable.variable_type}</Badge>
                        </TableCell>
                        <TableCell>{variable.weight}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {variable.visible_to_students ? (
                              <Badge variant="secondary" className="text-xs">
                                <Eye className="h-3 w-3 mr-1" />
                                Est
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs opacity-50">
                                <EyeOff className="h-3 w-3 mr-1" />
                                Est
                              </Badge>
                            )}
                            {variable.visible_to_leaders ? (
                              <Badge variant="secondary" className="text-xs">
                                <Eye className="h-3 w-3 mr-1" />
                                Líd
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs opacity-50">
                                <EyeOff className="h-3 w-3 mr-1" />
                                Líd
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditVariable(variable)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setItemToDelete({ type: "variable", id: variable.id });
                                setDeleteConfirmOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay variables definidas. Crea una para comenzar.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Formulas Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Fórmulas
                  </CardTitle>
                  <CardDescription>
                    Define las fórmulas que calculan los resultados
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setSelectedFormula(null);
                    setFormulaEditorOpen(true);
                  }}
                  disabled={!variables || variables.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Fórmula
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formulas && formulas.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Etiqueta</TableHead>
                      <TableHead>Fórmula</TableHead>
                      <TableHead>Tipo Resultado</TableHead>
                      <TableHead>Visibilidad</TableHead>
                      <TableHead className="w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formulas.map((formula) => (
                      <TableRow key={formula.id}>
                        <TableCell className="font-mono text-sm">{formula.name}</TableCell>
                        <TableCell>{formula.label}</TableCell>
                        <TableCell className="font-mono text-xs max-w-[200px] truncate">
                          {formula.formula}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{formula.result_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {formula.visible_to_students ? (
                              <Badge variant="secondary" className="text-xs">
                                <Eye className="h-3 w-3 mr-1" />
                                Est
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs opacity-50">
                                <EyeOff className="h-3 w-3 mr-1" />
                                Est
                              </Badge>
                            )}
                            {formula.visible_to_leaders ? (
                              <Badge variant="secondary" className="text-xs">
                                <Eye className="h-3 w-3 mr-1" />
                                Líd
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs opacity-50">
                                <EyeOff className="h-3 w-3 mr-1" />
                                Líd
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditFormula(formula)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setItemToDelete({ type: "formula", id: formula.id });
                                setDeleteConfirmOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay fórmulas definidas. Crea variables primero, luego agrega fórmulas.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <CommissionCalculator
            variables={variables || []}
            formulas={formulas || []}
            userRole="admin"
          />
        </TabsContent>
      </Tabs>

      {/* Editors */}
      <VariableEditor
        open={variableEditorOpen}
        onOpenChange={setVariableEditorOpen}
        variable={selectedVariable}
        onSave={handleSaveVariable}
        isLoading={createVariable.isPending || updateVariable.isPending}
      />

      <FormulaEditor
        open={formulaEditorOpen}
        onOpenChange={setFormulaEditorOpen}
        formula={selectedFormula}
        variables={variables || []}
        onSave={handleSaveFormula}
        isLoading={createFormula.isPending || updateFormula.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente{" "}
              {itemToDelete?.type === "variable" ? "la variable" : "la fórmula"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
