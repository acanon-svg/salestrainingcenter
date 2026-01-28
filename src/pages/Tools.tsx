import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Wrench,
  Calculator,
  Plus,
  Settings,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useTools, Tool } from "@/hooks/useTools";
import { useAuth } from "@/contexts/AuthContext";
import { CalculatorConfigurator } from "@/components/tools/CalculatorConfigurator";
import { CommissionCalculator } from "@/components/tools/CommissionCalculator";
import { useCalculatorVariables, useCalculatorFormulas } from "@/hooks/useTools";

const ToolCard: React.FC<{
  tool: Tool;
  onConfigure: () => void;
  onUse: () => void;
  isCreator: boolean;
}> = ({ tool, onConfigure, onUse, isCreator }) => {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calculator className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{tool.name}</CardTitle>
              {tool.description && (
                <CardDescription className="mt-1">{tool.description}</CardDescription>
              )}
            </div>
          </div>
          <Badge variant={tool.is_active ? "default" : "secondary"}>
            {tool.is_active ? "Activa" : "Inactiva"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button onClick={onUse} className="flex-1">
            <Calculator className="h-4 w-4 mr-2" />
            Usar Herramienta
          </Button>
          {isCreator && (
            <Button variant="outline" onClick={onConfigure}>
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const ToolViewer: React.FC<{
  toolId: string;
  userRole: "student" | "lider" | "admin" | "creator";
}> = ({ toolId, userRole }) => {
  const { variables } = useCalculatorVariables(toolId);
  const { formulas } = useCalculatorFormulas(toolId);

  return (
    <CommissionCalculator
      variables={variables || []}
      formulas={formulas || []}
      userRole={userRole}
    />
  );
};

const Tools: React.FC = () => {
  const { hasRole } = useAuth();
  const { tools, isLoading, createTool } = useTools();
  const isCreator = hasRole("creator") || hasRole("admin");

  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [mode, setMode] = useState<"list" | "configure" | "use">("list");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newToolName, setNewToolName] = useState("");
  const [newToolDescription, setNewToolDescription] = useState("");

  const handleCreateTool = async () => {
    if (!newToolName.trim()) return;
    await createTool.mutateAsync({
      name: newToolName,
      description: newToolDescription || null,
      type: "calculator",
      is_active: true,
    });
    setCreateDialogOpen(false);
    setNewToolName("");
    setNewToolDescription("");
  };

  const getUserRole = (): "student" | "lider" | "admin" | "creator" => {
    if (hasRole("admin")) return "admin";
    if (hasRole("creator")) return "creator";
    if (hasRole("lider")) return "lider";
    return "student";
  };

  if (mode === "configure" && selectedTool) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setMode("list")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{selectedTool.name}</h1>
              <p className="text-muted-foreground">Configuración de la herramienta</p>
            </div>
          </div>
          <CalculatorConfigurator toolId={selectedTool.id} />
        </div>
      </DashboardLayout>
    );
  }

  if (mode === "use" && selectedTool) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setMode("list")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{selectedTool.name}</h1>
              {selectedTool.description && (
                <p className="text-muted-foreground">{selectedTool.description}</p>
              )}
            </div>
          </div>
          <ToolViewer toolId={selectedTool.id} userRole={getUserRole()} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Wrench className="h-8 w-8 text-primary" />
              Herramientas
            </h1>
            <p className="text-muted-foreground mt-1">
              Herramientas de apoyo para el equipo comercial
            </p>
          </div>
          {isCreator && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Herramienta
            </Button>
          )}
        </div>

        {/* Tools Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tools && tools.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onConfigure={() => {
                  setSelectedTool(tool);
                  setMode("configure");
                }}
                onUse={() => {
                  setSelectedTool(tool);
                  setMode("use");
                }}
                isCreator={isCreator}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay herramientas</h3>
              <p className="text-muted-foreground mb-4">
                {isCreator
                  ? "Crea tu primera herramienta para el equipo comercial."
                  : "No hay herramientas disponibles en este momento."}
              </p>
              {isCreator && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Herramienta
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create Tool Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Herramienta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tool-name">Nombre</Label>
                <Input
                  id="tool-name"
                  value={newToolName}
                  onChange={(e) => setNewToolName(e.target.value)}
                  placeholder="Calculadora de Comisiones"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tool-description">Descripción (opcional)</Label>
                <Textarea
                  id="tool-description"
                  value={newToolDescription}
                  onChange={(e) => setNewToolDescription(e.target.value)}
                  placeholder="Calcula las comisiones basándose en las ventas..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateTool} disabled={!newToolName.trim()}>
                Crear Herramienta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Tools;
