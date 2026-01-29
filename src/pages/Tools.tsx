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
  Users,
} from "lucide-react";
import { useTools, Tool } from "@/hooks/useTools";
import { useAuth } from "@/contexts/AuthContext";
import { TeamSelector } from "@/components/tools/TeamSelector";
import { SalesCommissionCalculator } from "@/components/tools/SalesCommissionCalculator";
import { CommissionConfigManager } from "@/components/tools/CommissionConfigManager";
import { useMyCommissionConfig } from "@/hooks/useCommissionCalculatorConfig";

const ToolCard: React.FC<{
  tool: Tool;
  onConfigure: () => void;
  onUse: () => void;
  onEditTeams: () => void;
  isCreator: boolean;
}> = ({ tool, onConfigure, onUse, onEditTeams, isCreator }) => {
  const hasTeamRestriction = tool.target_teams && tool.target_teams.length > 0;
  
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
          <div className="flex flex-col items-end gap-1">
            <Badge variant={tool.is_active ? "default" : "secondary"}>
              {tool.is_active ? "Activa" : "Inactiva"}
            </Badge>
            {isCreator && hasTeamRestriction && (
              <Badge variant="outline" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {tool.target_teams!.length} equipos
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button onClick={onUse} className="flex-1">
            <Calculator className="h-4 w-4 mr-2" />
            Usar Herramienta
          </Button>
          {isCreator && (
            <>
              <Button variant="outline" onClick={onEditTeams} title="Equipos">
                <Users className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={onConfigure} title="Configurar">
                <Settings className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const ToolViewer: React.FC<{
  toolId: string;
  userId: string | undefined;
  userTeam: string | null | undefined;
  userRole: "student" | "lider" | "admin" | "creator";
}> = ({ toolId, userId, userTeam, userRole }) => {
  const { data: config, isLoading } = useMyCommissionConfig(toolId, userId, userTeam);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No hay configuración disponible para tu perfil. Contacta al administrador.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <SalesCommissionCalculator config={config} userRole={userRole} />;
};

const Tools: React.FC = () => {
  const { hasRole, profile, user } = useAuth();
  const { tools, isLoading, createTool, updateTool } = useTools();
  const isCreator = hasRole("creator") || hasRole("admin");

  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [mode, setMode] = useState<"list" | "configure" | "use">("list");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [teamsDialogOpen, setTeamsDialogOpen] = useState(false);
  const [newToolName, setNewToolName] = useState("");
  const [newToolDescription, setNewToolDescription] = useState("");
  const [newToolTeams, setNewToolTeams] = useState<string[]>([]);
  const [editingToolTeams, setEditingToolTeams] = useState<string[]>([]);

  const handleCreateTool = async () => {
    if (!newToolName.trim()) return;
    await createTool.mutateAsync({
      name: newToolName,
      description: newToolDescription || null,
      type: "calculator",
      is_active: true,
      target_teams: newToolTeams.length > 0 ? newToolTeams : null,
    });
    setCreateDialogOpen(false);
    setNewToolName("");
    setNewToolDescription("");
    setNewToolTeams([]);
  };

  const handleSaveTeams = async () => {
    if (!selectedTool) return;
    await updateTool.mutateAsync({
      id: selectedTool.id,
      target_teams: editingToolTeams.length > 0 ? editingToolTeams : null,
    });
    setTeamsDialogOpen(false);
    setSelectedTool(null);
    setEditingToolTeams([]);
  };

  const openTeamsDialog = (tool: Tool) => {
    setSelectedTool(tool);
    setEditingToolTeams(tool.target_teams || []);
    setTeamsDialogOpen(true);
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
              <p className="text-muted-foreground">Configuración de metas por perfil</p>
            </div>
          </div>
          <CommissionConfigManager toolId={selectedTool.id} />
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
          <ToolViewer 
            toolId={selectedTool.id} 
            userId={user?.id} 
            userTeam={profile?.team}
            userRole={getUserRole()} 
          />
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
                onEditTeams={() => openTeamsDialog(tool)}
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
          <DialogContent className="max-w-md">
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
              <TeamSelector
                selectedTeams={newToolTeams}
                onTeamsChange={setNewToolTeams}
              />
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

        {/* Edit Teams Dialog */}
        <Dialog open={teamsDialogOpen} onOpenChange={setTeamsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Equipos con acceso
              </DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <TeamSelector
                selectedTeams={editingToolTeams}
                onTeamsChange={setEditingToolTeams}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTeamsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveTeams} disabled={updateTool.isPending}>
                {updateTool.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Tools;
