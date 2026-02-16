import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Trophy,
  Award,
  Wrench,
  ClipboardList,
  Megaphone,
  Settings,
  Loader2,
  Users,
  User,
  Pencil,
} from "lucide-react";
import { usePortalSectionConfigs, PortalSectionConfig } from "@/hooks/usePortalSectionConfigs";
import { TeamSelector } from "@/components/tools/TeamSelector";
import { UserSelector } from "@/components/tools/UserSelector";

const sectionIcons: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard className="h-4 w-4" />,
  courses: <BookOpen className="h-4 w-4" />,
  training_materials: <FileText className="h-4 w-4" />,
  ranking: <Trophy className="h-4 w-4" />,
  badges: <Award className="h-4 w-4" />,
  tools: <Wrench className="h-4 w-4" />,
  team_feedback: <ClipboardList className="h-4 w-4" />,
  announcements: <Megaphone className="h-4 w-4" />,
  results: <LayoutDashboard className="h-4 w-4" />,
  followups: <ClipboardList className="h-4 w-4" />,
  notifications: <Megaphone className="h-4 w-4" />,
  feedback: <ClipboardList className="h-4 w-4" />,
  reports_field_sales: <LayoutDashboard className="h-4 w-4" />,
  team: <Users className="h-4 w-4" />,
  my_courses: <BookOpen className="h-4 w-4" />,
  create_course: <LayoutDashboard className="h-4 w-4" />,
  users: <Users className="h-4 w-4" />,
  reports: <LayoutDashboard className="h-4 w-4" />,
  rejected_commissions: <Wrench className="h-4 w-4" />,
};

export const PortalSectionManager: React.FC = () => {
  const { configs, isLoading, updateConfig } = usePortalSectionConfigs();
  const [editingConfig, setEditingConfig] = useState<PortalSectionConfig | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Local state for editing
  const [sectionName, setSectionName] = useState("");
  const [sectionDescription, setSectionDescription] = useState("");
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const openEditDialog = (config: PortalSectionConfig) => {
    setEditingConfig(config);
    setSectionName(config.section_name);
    setSectionDescription(config.description || "");
    setSelectedTeams(config.target_teams || []);
    setSelectedUsers(config.target_users || []);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingConfig) return;

    // Explicitly preserve is_enabled and only update the fields shown in the dialog
    await updateConfig.mutateAsync({
      id: editingConfig.id,
      section_name: sectionName.trim() || editingConfig.section_name,
      description: sectionDescription.trim() || null,
      target_teams: selectedTeams.length > 0 ? selectedTeams : null,
      target_users: selectedUsers.length > 0 ? selectedUsers : null,
      // Explicitly preserve is_enabled to prevent accidental disabling
      is_enabled: editingConfig.is_enabled,
    });

    setDialogOpen(false);
    setEditingConfig(null);
  };

  const handleToggleEnabled = async (config: PortalSectionConfig) => {
    await updateConfig.mutateAsync({
      id: config.id,
      is_enabled: !config.is_enabled,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Visibilidad de Secciones del Portal
          </CardTitle>
          <CardDescription>
            Controla qué secciones del menú son visibles para equipos o usuarios específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sección</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Visibilidad</TableHead>
                <TableHead>Habilitado</TableHead>
                <TableHead className="w-[100px]">Configurar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs?.map((config) => (
                <TableRow key={config.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      {sectionIcons[config.section_key] || <LayoutDashboard className="h-4 w-4" />}
                      {config.section_name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {config.description || "-"}
                  </TableCell>
                  <TableCell>
                    {(!config.target_teams || config.target_teams.length === 0) &&
                    (!config.target_users || config.target_users.length === 0) ? (
                      <Badge variant="secondary">Todos</Badge>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {config.target_teams && config.target_teams.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {config.target_teams.length} equipos
                          </Badge>
                        )}
                        {config.target_users && config.target_users.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <User className="h-3 w-3 mr-1" />
                            {config.target_users.length} usuarios
                          </Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={config.is_enabled}
                      onCheckedChange={() => handleToggleEnabled(config)}
                      disabled={updateConfig.isPending}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(config)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingConfig && sectionIcons[editingConfig.section_key]}
              Editar Sección
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-muted-foreground" />
                Nombre de la Sección
              </Label>
              <Input
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                placeholder="Nombre visible en el menú"
              />
              <p className="text-xs text-muted-foreground">
                Este nombre se mostrará en el menú para todos los usuarios que tengan acceso
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Descripción (opcional)
              </Label>
              <Textarea
                value={sectionDescription}
                onChange={(e) => setSectionDescription(e.target.value)}
                placeholder="Descripción breve de la sección"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Equipos con acceso
              </Label>
              <TeamSelector
                selectedTeams={selectedTeams}
                onTeamsChange={setSelectedTeams}
              />
              <p className="text-xs text-muted-foreground">
                Deja vacío para mostrar a todos los equipos
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Usuarios específicos
              </Label>
              <UserSelector
                selectedUsers={selectedUsers}
                onUsersChange={setSelectedUsers}
              />
              <p className="text-xs text-muted-foreground">
                Selecciona usuarios específicos que verán esta sección
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updateConfig.isPending}>
              {updateConfig.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
