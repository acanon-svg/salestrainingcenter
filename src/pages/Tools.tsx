import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  CreditCard,
  Power,
  DollarSign,
  Download,
} from "lucide-react";
import { useTools, Tool } from "@/hooks/useTools";
import { useAuth } from "@/contexts/AuthContext";
import { TeamSelector } from "@/components/tools/TeamSelector";
import { SalesCommissionCalculator } from "@/components/tools/SalesCommissionCalculator";
import { CommissionConfigManager } from "@/components/tools/CommissionConfigManager";
import { useMyCommissionConfig } from "@/hooks/useCommissionCalculatorConfig";
import { FieldSalesCommissions } from "@/components/tools/FieldSalesCommissions";
import { CommissionReportSection } from "@/components/tools/CommissionReportSection";
import { AddiPlansCalculator } from "@/components/tools/AddiPlansCalculator";
import { useToast } from "@/hooks/use-toast";

// Pre-built tools that can be enabled
const PREBUILT_TOOLS = [
  {
    id: "addi-plans-calculator",
    name: "Calculadora de Planes Addi",
    description: "Calcula las comisiones y pagos según el plan del aliado (7, 30 o 60 días)",
    type: "addi_plans_calculator",
    icon: CreditCard,
  },
];

const ToolCard: React.FC<{
  tool: Tool;
  onConfigure: () => void;
  onUse: () => void;
  onEditTeams: () => void;
  isCreator: boolean;
}> = ({ tool, onConfigure, onUse, onEditTeams, isCreator }) => {
  const hasTeamRestriction = tool.target_teams && tool.target_teams.length > 0;
  const isAddiPlans = tool.type === "addi_plans_calculator";
  
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              {isAddiPlans ? (
                <CreditCard className="h-6 w-6 text-primary" />
              ) : (
                <Calculator className="h-6 w-6 text-primary" />
              )}
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
          {isCreator && !isAddiPlans && (
            <>
              <Button variant="outline" onClick={onEditTeams} title="Equipos">
                <Users className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={onConfigure} title="Configurar">
                <Settings className="h-4 w-4" />
              </Button>
            </>
          )}
          {isCreator && isAddiPlans && (
            <Button variant="outline" onClick={onEditTeams} title="Equipos">
              <Users className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const PrebuiltToolCard: React.FC<{
  prebuilt: typeof PREBUILT_TOOLS[0];
  existingTool: Tool | undefined;
  onEnable: () => void;
  onDisable: () => void;
  isPending: boolean;
}> = ({ prebuilt, existingTool, onEnable, onDisable, isPending }) => {
  const IconComponent = prebuilt.icon;
  const isEnabled = !!existingTool?.is_active;

  return (
    <Card className={`border-dashed ${isEnabled ? 'border-green-500/50 bg-green-500/5' : 'border-muted-foreground/30'}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isEnabled ? 'bg-green-500/10' : 'bg-muted'}`}>
              <IconComponent className={`h-6 w-6 ${isEnabled ? 'text-green-600' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {prebuilt.name}
                <Badge variant="outline" className="text-xs">
                  Preconstruida
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">{prebuilt.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onEnable();
                  } else {
                    onDisable();
                  }
                }}
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {isEnabled 
            ? "✅ Habilitada - Los usuarios pueden usar esta herramienta"
            : "Activa el switch para habilitar esta herramienta"}
        </p>
      </CardContent>
    </Card>
  );
};

const ToolViewer: React.FC<{
  tool: Tool;
  userId: string | undefined;
  userTeam: string | null | undefined;
  userRole: "student" | "lider" | "admin" | "creator";
}> = ({ tool, userId, userTeam, userRole }) => {
  // For Addi Plans calculator, no config needed
  if (tool.type === "addi_plans_calculator") {
    return <AddiPlansCalculator />;
  }

  // For commission calculator, use config
  const { data: config, isLoading } = useMyCommissionConfig(tool.id, userId, userTeam);

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
  const { toast } = useToast();
  const isCreator = hasRole("creator") || hasRole("admin");

  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [mode, setMode] = useState<"list" | "configure" | "use" | "commissions" | "commission-report">("list");
  const isLeader = hasRole("lider");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [teamsDialogOpen, setTeamsDialogOpen] = useState(false);
  const [newToolName, setNewToolName] = useState("");
  const [newToolDescription, setNewToolDescription] = useState("");
  const [newToolTeams, setNewToolTeams] = useState<string[]>([]);
  const [editingToolTeams, setEditingToolTeams] = useState<string[]>([]);
  const [enablingPrebuilt, setEnablingPrebuilt] = useState<string | null>(null);

  // Find existing prebuilt tools
  const getExistingPrebuiltTool = (type: string) => {
    return tools?.find(t => t.type === type);
  };

  const handleEnablePrebuilt = async (prebuilt: typeof PREBUILT_TOOLS[0]) => {
    setEnablingPrebuilt(prebuilt.id);
    try {
      const existing = getExistingPrebuiltTool(prebuilt.type);
      if (existing) {
        await updateTool.mutateAsync({ id: existing.id, is_active: true });
      } else {
        await createTool.mutateAsync({
          name: prebuilt.name,
          description: prebuilt.description,
          type: prebuilt.type,
          is_active: true,
        });
      }
      toast({ title: `${prebuilt.name} habilitada` });
    } catch (error) {
      toast({ title: "Error al habilitar herramienta", variant: "destructive" });
    } finally {
      setEnablingPrebuilt(null);
    }
  };

  const handleDisablePrebuilt = async (prebuilt: typeof PREBUILT_TOOLS[0]) => {
    setEnablingPrebuilt(prebuilt.id);
    try {
      const existing = getExistingPrebuiltTool(prebuilt.type);
      if (existing) {
        await updateTool.mutateAsync({ id: existing.id, is_active: false });
        toast({ title: `${prebuilt.name} deshabilitada` });
      }
    } catch (error) {
      toast({ title: "Error al deshabilitar herramienta", variant: "destructive" });
    } finally {
      setEnablingPrebuilt(null);
    }
  };

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

  // Filter active tools for non-creators
  const visibleTools = isCreator 
    ? tools 
    : tools?.filter(t => t.is_active);

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
            tool={selectedTool}
            userId={user?.id} 
            userTeam={profile?.team}
            userRole={getUserRole()} 
          />
        </div>
      </DashboardLayout>
    );
  }

  if (mode === "commissions") {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setMode("list")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Comisiones Field Sales</h1>
              <p className="text-muted-foreground">Gestión y aprobación de comisiones del equipo</p>
            </div>
          </div>
          <FieldSalesCommissions />
        </div>
      </DashboardLayout>
    );
  }

  if (mode === "commission-report") {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setMode("list")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Reporte de Comisiones</h1>
              <p className="text-muted-foreground">Descarga los reportes de comisiones aprobadas</p>
            </div>
          </div>
          <CommissionReportSection />
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

        {/* Pre-built Tools Section (only for creators) */}
        {isCreator && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Power className="h-5 w-5" />
              Herramientas Preconstruidas
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {PREBUILT_TOOLS.map((prebuilt) => (
                <PrebuiltToolCard
                  key={prebuilt.id}
                  prebuilt={prebuilt}
                  existingTool={getExistingPrebuiltTool(prebuilt.type)}
                  onEnable={() => handleEnablePrebuilt(prebuilt)}
                  onDisable={() => handleDisablePrebuilt(prebuilt)}
                  isPending={enablingPrebuilt === prebuilt.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Field Sales Commission Section - Leaders */}
        {isLeader && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Comisiones
            </h2>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setMode("commissions")}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <DollarSign className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Comisiones Field Sales</CardTitle>
                    <CardDescription>Gestiona y aprueba las comisiones de tu equipo</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Commission Report Section - Creators */}
        {isCreator && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Download className="h-5 w-5" />
              Reportes de Comisiones
            </h2>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setMode("commission-report")}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Download className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Reporte de Comisiones</CardTitle>
                    <CardDescription>Descarga los reportes de comisiones aprobadas del equipo</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Tools Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : visibleTools && visibleTools.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">
              {isCreator ? "Todas las Herramientas" : "Herramientas Disponibles"}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visibleTools.map((tool) => (
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
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay herramientas</h3>
              <p className="text-muted-foreground mb-4">
                {isCreator
                  ? "Crea tu primera herramienta o habilita una preconstruida."
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
