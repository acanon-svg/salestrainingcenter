import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  Users,
  ExternalLink,
  Loader2,
  Crown,
} from "lucide-react";
import { useTeamFeedbackForms, TeamFeedbackForm } from "@/hooks/useTeamFeedbackForms";
import { TeamSelector } from "@/components/tools/TeamSelector";
import { LeaderSelector } from "@/components/tools/LeaderSelector";

const TeamFeedbackForms: React.FC = () => {
  const { forms, isLoading, createForm, updateForm, deleteForm } =
    useTeamFeedbackForms();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<TeamFeedbackForm | null>(null);
  const [formToDelete, setFormToDelete] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [targetTeams, setTargetTeams] = useState<string[]>([]);
  const [targetLeaders, setTargetLeaders] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setName("");
    setDescription("");
    setEmbedUrl("");
    setTargetTeams([]);
    setTargetLeaders([]);
    setIsActive(true);
    setSelectedForm(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (form: TeamFeedbackForm) => {
    setSelectedForm(form);
    setName(form.name);
    setDescription(form.description || "");
    setEmbedUrl(form.embed_url);
    setTargetTeams(form.target_teams || []);
    setTargetLeaders((form as any).target_leaders || []);
    setIsActive(form.is_active);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !embedUrl.trim()) return;

    const formData = {
      name,
      description: description || null,
      embed_url: embedUrl,
      target_teams: targetTeams.length > 0 ? targetTeams : null,
      target_leaders: targetLeaders.length > 0 ? targetLeaders : null,
      is_active: isActive,
    };

    if (selectedForm) {
      await updateForm.mutateAsync({
        id: selectedForm.id,
        ...formData,
      } as any);
    } else {
      await createForm.mutateAsync(formData as any);
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (formToDelete) {
      await deleteForm.mutateAsync(formToDelete);
      setDeleteDialogOpen(false);
      setFormToDelete(null);
    }
  };

  const confirmDelete = (id: string) => {
    setFormToDelete(id);
    setDeleteDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ClipboardList className="h-8 w-8 text-primary" />
              Feedbacks al Equipo
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestiona formularios de feedback para los equipos
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Formulario
          </Button>
        </div>

        {/* Forms Table */}
        <Card>
          <CardHeader>
            <CardTitle>Formularios Configurados</CardTitle>
            <CardDescription>
              Formularios de Google embebidos para feedback del equipo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : forms && forms.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Equipos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[120px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forms.map((form) => (
                    <TableRow key={form.id}>
                      <TableCell className="font-medium">{form.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {form.description || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {form.target_teams && form.target_teams.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {form.target_teams.length} equipos
                            </Badge>
                          )}
                          {(form as any).target_leaders && (form as any).target_leaders.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Crown className="h-3 w-3 mr-1" />
                              {(form as any).target_leaders.length} líderes
                            </Badge>
                          )}
                          {(!form.target_teams || form.target_teams.length === 0) &&
                           (!(form as any).target_leaders || (form as any).target_leaders.length === 0) && (
                            <Badge variant="secondary" className="text-xs">
                              Todos
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={form.is_active ? "default" : "secondary"}
                        >
                          {form.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              window.open(form.embed_url, "_blank")
                            }
                            title="Ver formulario"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(form)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDelete(form.id)}
                            title="Eliminar"
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
              <div className="text-center py-12">
                <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No hay formularios
                </h3>
                <p className="text-muted-foreground mb-4">
                  Crea tu primer formulario de feedback para los equipos.
                </p>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Formulario
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {selectedForm ? "Editar Formulario" : "Nuevo Formulario"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="form-name">Nombre del Feedback *</Label>
                <Input
                  id="form-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Feedback de Acompañamiento"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="form-description">Descripción (opcional)</Label>
                <Textarea
                  id="form-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe el propósito de este formulario..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="form-embed-url">Link Embebido *</Label>
                <Input
                  id="form-embed-url"
                  value={embedUrl}
                  onChange={(e) => setEmbedUrl(e.target.value)}
                  placeholder="https://docs.google.com/forms/d/e/.../viewform?embedded=true"
                />
                <p className="text-xs text-muted-foreground">
                  Obtén el link desde Google Forms → Enviar → Insertar ({"<>"}
                  ) → Copia el src del iframe
                </p>
              </div>

              <div className="space-y-2">
                <Label>Equipos (opcional)</Label>
                <TeamSelector
                  selectedTeams={targetTeams}
                  onTeamsChange={setTargetTeams}
                />
                <p className="text-xs text-muted-foreground">
                  Selecciona equipos que verán este formulario
                </p>
              </div>

              <LeaderSelector
                selectedLeaders={targetLeaders}
                onLeadersChange={setTargetLeaders}
                label="Líderes específicos (opcional)"
              />

              <div className="flex items-center justify-between">
                <Label htmlFor="form-active">Formulario activo</Label>
                <Switch
                  id="form-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  !name.trim() ||
                  !embedUrl.trim() ||
                  createForm.isPending ||
                  updateForm.isPending
                }
              >
                {createForm.isPending || updateForm.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {selectedForm ? "Guardar Cambios" : "Crear Formulario"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar formulario?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El formulario será eliminado
                permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default TeamFeedbackForms;
