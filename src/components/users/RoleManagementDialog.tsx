import React, { useState, useEffect, useMemo } from "react";
import { Switch } from "@/components/ui/switch";
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
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Shield, BookOpen, Crown, Users, Check, ChevronsUpDown, Plus, Building, MapPin, UsersRound, LineChart, ClipboardCheck, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRoles, useAddRole, useRemoveRole, AppRole } from "@/hooks/useUserRoles";
import { useLeaderRegion, useAssignLeaderRegion, useRemoveLeaderRegion } from "@/hooks/useLeaderRegion";
import { useRegionals } from "@/hooks/useRegionals";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import { useAuth } from "@/contexts/AuthContext";

interface RoleManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    user_id: string;
    full_name: string | null;
    email: string;
    company_role?: string | null;
    team?: string | null;
    regional?: string | null;
    is_guaranteed?: boolean;
  } | null;
  onProfileUpdated?: () => void;
}

// Base roles visible to all admins
const baseRoleConfig: { role: AppRole; label: string; description: string; icon: React.ElementType }[] = [
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
    role: "analista",
    label: "Reporting & Data",
    description: "Acceso de solo lectura a reportes de todos los equipos",
    icon: LineChart,
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

// QA role - only assignable by creators
const qaRoleConfig: { role: AppRole; label: string; description: string; icon: React.ElementType } = {
  role: "qa",
  label: "Líder de Calidad",
  description: "Acceso igual a estudiante para revisión de calidad",
  icon: ClipboardCheck,
};

export const RoleManagementDialog: React.FC<RoleManagementDialogProps> = ({
  open,
  onOpenChange,
  user,
  onProfileUpdated,
}) => {
  const { hasRole } = useAuth();
  const { data: userRoles, isLoading: rolesLoading } = useUserRoles(user?.user_id);
  const { data: leaderRegion, isLoading: regionLoading } = useLeaderRegion(user?.user_id);
  const { data: regionals, isLoading: regionalsLoading } = useRegionals();
  
  const addRole = useAddRole();
  const removeRole = useRemoveRole();
  const assignRegion = useAssignLeaderRegion();
  const removeRegion = useRemoveLeaderRegion();
  const updateProfile = useUpdateProfile();

  // Check if current user is a creator (can assign QA role)
  const isCreator = hasRole("creator");

  // Build role config based on current user's permissions
  const roleConfig = useMemo(() => {
    // Creators can see and assign the QA role
    if (isCreator) {
      return [...baseRoleConfig, qaRoleConfig];
    }
    return baseRoleConfig;
  }, [isCreator]);

  // Profile fields state
  const [companyRole, setCompanyRole] = useState<string>("");
  const [team, setTeam] = useState<string>("");
  const [profileRegional, setProfileRegional] = useState<string>("");
  const [isGuaranteed, setIsGuaranteed] = useState<boolean>(false);
  
  // Leader region state
  const [selectedRegional, setSelectedRegional] = useState<string>("");
  const [regionalOpen, setRegionalOpen] = useState(false);
  const [newRegionalInput, setNewRegionalInput] = useState("");
  
  // Profile region combobox state
  const [profileRegionalOpen, setProfileRegionalOpen] = useState(false);
  const [newProfileRegionalInput, setNewProfileRegionalInput] = useState("");

  // Initialize profile fields when user changes
  useEffect(() => {
    if (user) {
      setCompanyRole(user.company_role || "");
      setTeam(user.team || "");
      setProfileRegional(user.regional || "");
      setIsGuaranteed(user.is_guaranteed || false);
    }
  }, [user]);

  useEffect(() => {
    if (leaderRegion?.regional) {
      setSelectedRegional(leaderRegion.regional);
    } else {
      setSelectedRegional("");
    }
  }, [leaderRegion]);

  // Check if typed input matches any existing regional
  const matchingRegionals = regionals?.filter((r) =>
    r.toLowerCase().includes(newRegionalInput.toLowerCase())
  ) || [];
  
  const canCreateNew = newRegionalInput.trim() && 
    !regionals?.some((r) => r.toLowerCase() === newRegionalInput.toLowerCase().trim());

  // For profile regional field
  const matchingProfileRegionals = regionals?.filter((r) =>
    r.toLowerCase().includes(newProfileRegionalInput.toLowerCase())
  ) || [];
  
  const canCreateNewProfileRegional = newProfileRegionalInput.trim() && 
    !regionals?.some((r) => r.toLowerCase() === newProfileRegionalInput.toLowerCase().trim());

  if (!user) return null;

  const currentRoles = userRoles?.map((r) => r.role) || [];
  const isLeader = currentRoles.includes("lider");
  const isLoading = rolesLoading || regionLoading || regionalsLoading;
  const isSaving = addRole.isPending || removeRole.isPending || assignRegion.isPending || removeRegion.isPending || updateProfile.isPending;

  // Check if profile has changed
  const profileChanged = 
    companyRole !== (user.company_role || "") ||
    team !== (user.team || "") ||
    profileRegional !== (user.regional || "") ||
    isGuaranteed !== (user.is_guaranteed || false);

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

  const handleProfileRegionalChange = (value: string) => {
    setProfileRegional(value);
  };

  const handleSaveProfile = async () => {
    await updateProfile.mutateAsync({
      userId: user.user_id,
      company_role: companyRole || null,
      team: team || null,
      regional: profileRegional || null,
      is_guaranteed: isGuaranteed,
    });
    onProfileUpdated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar Usuario</DialogTitle>
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
            {/* Profile Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">Información del Perfil</Label>
              </div>
              
              {/* Cargo Field */}
              <div className="space-y-2">
                <Label htmlFor="company_role" className="text-sm text-muted-foreground">
                  Cargo
                </Label>
                <Input
                  id="company_role"
                  placeholder="Ej: Ejecutivo Comercial, Gerente..."
                  value={companyRole}
                  onChange={(e) => setCompanyRole(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              {/* Equipo Field */}
              <div className="space-y-2">
                <Label htmlFor="team" className="text-sm text-muted-foreground flex items-center gap-1">
                  <UsersRound className="h-3 w-3" />
                  Equipo
                </Label>
                <Input
                  id="team"
                  placeholder="Ej: Ventas B2B, Marketing..."
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              {/* Regional Field (Profile) */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Regional
                </Label>
                <Popover open={profileRegionalOpen} onOpenChange={setProfileRegionalOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={profileRegionalOpen}
                      className="w-full justify-between font-normal"
                      disabled={isSaving}
                    >
                      {profileRegional || "Seleccionar o crear regional..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Buscar o crear regional..."
                        value={newProfileRegionalInput}
                        onValueChange={setNewProfileRegionalInput}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {newProfileRegionalInput.trim() ? (
                            <div className="p-2 text-sm text-muted-foreground">
                              No se encontró "{newProfileRegionalInput}"
                            </div>
                          ) : (
                            <div className="p-2 text-sm text-muted-foreground">
                              No hay regionales. Escribe para crear una.
                            </div>
                          )}
                        </CommandEmpty>
                        
                        {/* Create new option */}
                        {canCreateNewProfileRegional && (
                          <CommandGroup heading="Crear nueva">
                            <CommandItem
                              value={`create-profile-${newProfileRegionalInput.trim()}`}
                              onSelect={() => {
                                const newRegion = newProfileRegionalInput.trim();
                                handleProfileRegionalChange(newRegion);
                                setNewProfileRegionalInput("");
                                setProfileRegionalOpen(false);
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Crear "{newProfileRegionalInput.trim()}"
                            </CommandItem>
                          </CommandGroup>
                        )}
                        
                        {/* Existing regionals */}
                        {matchingProfileRegionals.length > 0 && (
                          <CommandGroup heading="Regionales existentes">
                            {matchingProfileRegionals.map((regional) => (
                              <CommandItem
                                key={regional}
                                value={regional}
                                onSelect={() => {
                                  handleProfileRegionalChange(regional);
                                  setNewProfileRegionalInput("");
                                  setProfileRegionalOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    profileRegional === regional ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {regional}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Garantizado Toggle */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-500" />
                  <div>
                    <Label className="text-sm font-medium">Garantizado</Label>
                    <p className="text-xs text-muted-foreground">
                      Comisión al 100% independiente de resultados
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isGuaranteed}
                  onCheckedChange={setIsGuaranteed}
                  disabled={isSaving}
                />
              </div>

              {/* Save Profile Button */}
              {profileChanged && (
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={isSaving}
                  className="w-full"
                  variant="secondary"
                >
                  {updateProfile.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar cambios del perfil"
                  )}
                </Button>
              )}
            </div>

            <Separator />

            {/* Roles Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">Roles asignados</Label>
              </div>
              
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
                <Label className="text-sm font-medium">Región del Líder (supervisión)</Label>
                <p className="text-xs text-muted-foreground">
                  Define qué región puede supervisar este líder
                </p>
                <Popover open={regionalOpen} onOpenChange={setRegionalOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={regionalOpen}
                      className="w-full justify-between"
                      disabled={isSaving}
                    >
                      {selectedRegional || "Seleccionar o crear región..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Buscar o crear región..."
                        value={newRegionalInput}
                        onValueChange={setNewRegionalInput}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {newRegionalInput.trim() ? (
                            <div className="p-2 text-sm text-muted-foreground">
                              No se encontró "{newRegionalInput}"
                            </div>
                          ) : (
                            <div className="p-2 text-sm text-muted-foreground">
                              No hay regiones. Escribe para crear una.
                            </div>
                          )}
                        </CommandEmpty>
                        
                        {/* Create new option */}
                        {canCreateNew && (
                          <CommandGroup heading="Crear nueva">
                            <CommandItem
                              value={`create-${newRegionalInput.trim()}`}
                              onSelect={() => {
                                const newRegion = newRegionalInput.trim();
                                handleRegionalChange(newRegion);
                                setNewRegionalInput("");
                                setRegionalOpen(false);
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Crear "{newRegionalInput.trim()}"
                            </CommandItem>
                          </CommandGroup>
                        )}
                        
                        {/* Existing regionals */}
                        {matchingRegionals.length > 0 && (
                          <CommandGroup heading="Regiones existentes">
                            {matchingRegionals.map((regional) => (
                              <CommandItem
                                key={regional}
                                value={regional}
                                onSelect={() => {
                                  handleRegionalChange(regional);
                                  setNewRegionalInput("");
                                  setRegionalOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedRegional === regional ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {regional}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedRegional && (
                  <p className="text-xs text-green-600">
                    ✓ Región de supervisión: {selectedRegional}
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
