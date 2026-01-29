import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { 
  Plus, 
  Settings, 
  Copy, 
  Trash2, 
  Users, 
  Target,
  DollarSign,
  Save
} from "lucide-react";
import { toast } from "sonner";
import { TeamSelector } from "./TeamSelector";
import { UserSelector } from "./UserSelector";
import {
  CommissionCalculatorConfig,
  useCommissionCalculatorConfigs,
  useCreateCommissionConfig,
  useUpdateCommissionConfig,
  useDeleteCommissionConfig,
  useDuplicateCommissionConfig,
} from "@/hooks/useCommissionCalculatorConfig";

interface CommissionConfigManagerProps {
  toolId: string;
}

export const CommissionConfigManager: React.FC<CommissionConfigManagerProps> = ({
  toolId,
}) => {
  const { data: configs, isLoading } = useCommissionCalculatorConfigs(toolId);
  const createConfig = useCreateCommissionConfig();
  const updateConfig = useUpdateCommissionConfig();
  const deleteConfig = useDeleteCommissionConfig();
  const duplicateConfig = useDuplicateCommissionConfig();

  const [editingConfig, setEditingConfig] = useState<CommissionCalculatorConfig | null>(null);
  const [isNewConfigOpen, setIsNewConfigOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    meta_firmas: 100,
    meta_originaciones: 0,
    meta_gmv_usd: 0,
    base_comisional: 1500000,
    target_teams: [] as string[],
    target_users: [] as string[],
    is_default: false,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      meta_firmas: 100,
      meta_originaciones: 0,
      meta_gmv_usd: 0,
      base_comisional: 1500000,
      target_teams: [],
      target_users: [],
      is_default: false,
    });
  };

  const handleOpenNew = () => {
    resetForm();
    setIsNewConfigOpen(true);
  };

  const handleOpenEdit = (config: CommissionCalculatorConfig) => {
    setFormData({
      name: config.name,
      description: config.description || "",
      meta_firmas: config.meta_firmas,
      meta_originaciones: config.meta_originaciones,
      meta_gmv_usd: config.meta_gmv_usd,
      base_comisional: config.base_comisional,
      target_teams: config.target_teams || [],
      target_users: config.target_users || [],
      is_default: config.is_default,
    });
    setEditingConfig(config);
  };

  const handleCreate = async () => {
    try {
      await createConfig.mutateAsync({
        tool_id: toolId,
        name: formData.name,
        description: formData.description || null,
        meta_firmas: formData.meta_firmas,
        meta_originaciones: formData.meta_originaciones,
        meta_gmv_usd: formData.meta_gmv_usd,
        base_comisional: formData.base_comisional,
        target_teams: formData.target_teams.length > 0 ? formData.target_teams : null,
        target_users: formData.target_users.length > 0 ? formData.target_users : null,
        is_default: formData.is_default,
        created_by: null,
      });
      toast.success("Configuración creada exitosamente");
      setIsNewConfigOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Error al crear la configuración");
    }
  };

  const handleUpdate = async () => {
    if (!editingConfig) return;
    try {
      await updateConfig.mutateAsync({
        id: editingConfig.id,
        name: formData.name,
        description: formData.description || null,
        meta_firmas: formData.meta_firmas,
        meta_originaciones: formData.meta_originaciones,
        meta_gmv_usd: formData.meta_gmv_usd,
        base_comisional: formData.base_comisional,
        target_teams: formData.target_teams.length > 0 ? formData.target_teams : null,
        target_users: formData.target_users.length > 0 ? formData.target_users : null,
        is_default: formData.is_default,
      });
      toast.success("Configuración actualizada");
      setEditingConfig(null);
      resetForm();
    } catch (error) {
      toast.error("Error al actualizar");
    }
  };

  const handleDuplicate = async (configId: string) => {
    try {
      await duplicateConfig.mutateAsync(configId);
      toast.success("Configuración duplicada. Puedes editarla y asignarla a otros usuarios.");
    } catch (error) {
      toast.error("Error al duplicar");
    }
  };

  const handleDelete = async () => {
    if (!configToDelete) return;
    try {
      await deleteConfig.mutateAsync(configToDelete);
      toast.success("Configuración eliminada");
      setConfigToDelete(null);
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const ConfigForm = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="config-name">Nombre de la Configuración</Label>
          <Input
            id="config-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Ejecutivos Nuevos"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="config-desc">Descripción (opcional)</Label>
          <Input
            id="config-desc"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descripción de esta configuración"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <Target className="h-4 w-4" />
          Metas del Mes
        </h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="meta-firmas">Meta de Firmas</Label>
            <Input
              id="meta-firmas"
              type="number"
              min={0}
              value={formData.meta_firmas}
              onChange={(e) => setFormData({ ...formData, meta_firmas: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta-originaciones">Meta Originaciones</Label>
            <Input
              id="meta-originaciones"
              type="number"
              min={0}
              value={formData.meta_originaciones}
              onChange={(e) => setFormData({ ...formData, meta_originaciones: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta-gmv">Meta GMV (USD)</Label>
            <Input
              id="meta-gmv"
              type="number"
              min={0}
              step={0.01}
              value={formData.meta_gmv_usd}
              onChange={(e) => setFormData({ ...formData, meta_gmv_usd: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="base-comisional">Base Comisional (COP)</Label>
            <Input
              id="base-comisional"
              type="number"
              min={0}
              value={formData.base_comisional}
              onChange={(e) => setFormData({ ...formData, base_comisional: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          Asignación
        </h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Configuración por Defecto</Label>
              <p className="text-xs text-muted-foreground">
                Se usará para usuarios sin configuración específica
              </p>
            </div>
            <Switch
              checked={formData.is_default}
              onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
            />
          </div>

          {!formData.is_default && (
            <>
              <div className="space-y-2">
                <Label>Asignar a Equipos</Label>
                <TeamSelector
                  selectedTeams={formData.target_teams}
                  onTeamsChange={(teams) => setFormData({ ...formData, target_teams: teams })}
                />
              </div>
              <div className="space-y-2">
                <Label>Asignar a Usuarios Específicos</Label>
                <UserSelector
                  selectedUsers={formData.target_users}
                  onUsersChange={(users) => setFormData({ ...formData, target_users: users })}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return <div className="p-4">Cargando configuraciones...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuraciones de Metas
        </h3>
        <Button onClick={handleOpenNew} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Configuración
        </Button>
      </div>

      {(!configs || configs.length === 0) && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No hay configuraciones de metas. Crea una configuración por defecto para comenzar.
            </p>
            <Button onClick={handleOpenNew}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Configuración
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {configs?.map((config) => (
          <Card key={config.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{config.name}</CardTitle>
                  {config.description && (
                    <CardDescription>{config.description}</CardDescription>
                  )}
                </div>
                <div className="flex gap-1">
                  {config.is_default && (
                    <Badge variant="default" className="text-xs">Por defecto</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Meta Firmas:</span>
                  <span className="ml-2 font-medium">{config.meta_firmas}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Originaciones:</span>
                  <span className="ml-2 font-medium">{config.meta_originaciones.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">GMV (USD):</span>
                  <span className="ml-2 font-medium">${config.meta_gmv_usd.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Base:</span>
                  <span className="ml-2 font-medium">{formatCurrency(config.base_comisional)}</span>
                </div>
              </div>

              {(config.target_teams?.length || config.target_users?.length) && (
                <div className="flex flex-wrap gap-1">
                  {config.target_teams?.map((team) => (
                    <Badge key={team} variant="outline" className="text-xs">
                      {team}
                    </Badge>
                  ))}
                  {config.target_users?.length ? (
                    <Badge variant="secondary" className="text-xs">
                      {config.target_users.length} usuario(s)
                    </Badge>
                  ) : null}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenEdit(config)}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDuplicate(config.id)}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Duplicar
                </Button>
                {!config.is_default && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => setConfigToDelete(config.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* New Config Dialog */}
      <Dialog open={isNewConfigOpen} onOpenChange={setIsNewConfigOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Configuración de Metas</DialogTitle>
            <DialogDescription>
              Crea una configuración de metas para un grupo específico de usuarios
            </DialogDescription>
          </DialogHeader>
          <ConfigForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewConfigOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name || createConfig.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Crear Configuración
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Config Dialog */}
      <Dialog open={!!editingConfig} onOpenChange={() => setEditingConfig(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Configuración</DialogTitle>
          </DialogHeader>
          <ConfigForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingConfig(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={updateConfig.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!configToDelete} onOpenChange={() => setConfigToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta configuración?</AlertDialogTitle>
            <AlertDialogDescription>
              Los usuarios asignados a esta configuración pasarán a usar la configuración por defecto.
            </AlertDialogDescription>
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
