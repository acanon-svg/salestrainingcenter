import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, BookOpen, Crown, Users } from "lucide-react";
import { useUserRoles, useAddRole, useRemoveRole, AppRole } from "@/hooks/useUserRoles";
import { useLeaderRegion, useAssignLeaderRegion, useRemoveLeaderRegion } from "@/hooks/useLeaderRegion";
import { useRegionals } from "@/hooks/useRegionals";

interface RoleManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    user_id: string;
    full_name: string | null;
    email: string;
  } | null;
}

const roleConfig: { role: AppRole; label: string; description: string; icon: React.ElementType }[] = [
  {
    role: "student",
    label: "Estudiante",
    description: "Acceso a cursos y materiales de formación",
    icon: BookOpen,
  },
  {
    role: "lider",
    label: "Líder",
    description: "Supervisión de equipo y métricas regionales",
    icon: Users,
  },
  {
    role: "creator",
    label: "Creador",
    description: "Crear y gestionar cursos y materiales",
    icon: Crown,
  },
  {
    role: "admin",
    label: "Administrador",
    description: "Acceso completo al sistema",
    icon: Shield,
  },
];

export const RoleManagementDialog: React.FC<RoleManagementDialogProps> = ({
  open,
  onOpenChange,
  user,
}) => {
  const { data: userRoles, isLoading: rolesLoading } = useUserRoles(user?.user_id);
  const { data: leaderRegion, isLoading: regionLoading } = useLeaderRegion(user?.user_id);
  const { data: regionals, isLoading: regionalsLoading } = useRegionals();
  
  const addRole = useAddRole();
  const removeRole = useRemoveRole();
  const assignRegion = useAssignLeaderRegion();
  const removeRegion = useRemoveLeaderRegion();

  const [selectedRegional, setSelectedRegional] = useState<string>("");

  useEffect(() => {
    if (leaderRegion?.regional) {
      setSelectedRegional(leaderRegion.regional);
    } else {
      setSelectedRegional("");
    }
  }, [leaderRegion]);

  if (!user) return null;

  const currentRoles = userRoles?.map((r) => r.role) || [];
  const isLeader = currentRoles.includes("lider");
  const isLoading = rolesLoading || regionLoading || regionalsLoading;
  const isSaving = addRole.isPending || removeRole.isPending || assignRegion.isPending || removeRegion.isPending;

  const handleRoleToggle = async (role: AppRole, checked: boolean) => {
    if (checked) {
      await addRole.mutateAsync({ userId: user.user_id, role });
    } else {
      await removeRole.mutateAsync({ userId: user.user_id, role });
      
      // If removing leader role, also remove region assignment
      if (role === "lider") {
        await removeRegion.mutateAsync(user.user_id);
        setSelectedRegional("");
      }
    }
  };

  const handleRegionalChange = async (value: string) => {
    setSelectedRegional(value);
    if (value) {
      await assignRegion.mutateAsync({ userId: user.user_id, regional: value });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gestionar Roles</DialogTitle>
          <DialogDescription>
            {user.full_name || user.email}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Roles */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Roles asignados</Label>
              
              {roleConfig.map(({ role, label, description, icon: Icon }) => (
                <div
                  key={role}
                  className="flex items-start space-x-3 rounded-lg border p-3"
                >
                  <Checkbox
                    id={`role-${role}`}
                    checked={currentRoles.includes(role)}
                    onCheckedChange={(checked) => handleRoleToggle(role, checked as boolean)}
                    disabled={isSaving}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <Label
                        htmlFor={`role-${role}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {label}
                      </Label>
                      {currentRoles.includes(role) && (
                        <Badge variant="secondary" className="text-xs">
                          Activo
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Regional assignment for leaders */}
            {isLeader && (
              <div className="space-y-3 pt-4 border-t">
                <Label className="text-sm font-medium">Región del Líder</Label>
                <p className="text-xs text-muted-foreground">
                  Selecciona la región que supervisará este líder
                </p>
                <Select
                  value={selectedRegional}
                  onValueChange={handleRegionalChange}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar región..." />
                  </SelectTrigger>
                  <SelectContent>
                    {regionals?.map((regional) => (
                      <SelectItem key={regional} value={regional}>
                        {regional}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRegional && (
                  <p className="text-xs text-green-600">
                    ✓ Región asignada: {selectedRegional}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button onClick={() => onOpenChange(false)} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Cerrar"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
