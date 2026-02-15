import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSettings } from "@/hooks/useAppSettings";
import { ChatbotSettings } from "@/components/chatbot/ChatbotSettings";
import { RoleManagementDialog } from "@/components/users/RoleManagementDialog";
import { AssignPointsDialog } from "@/components/users/AssignPointsDialog";
import { UserEditDialog } from "@/components/users/UserEditDialog";
import { DeleteUserDialog } from "@/components/users/DeleteUserDialog";
import { ResetPasswordDialog } from "@/components/users/ResetPasswordDialog";
import { PortalSectionManager } from "@/components/admin/PortalSectionManager";
import { DataResetManager } from "@/components/admin/DataResetManager";
import { ImpersonateUserDialog } from "@/components/admin/ImpersonateUserDialog";
import { UserCourseResetManager } from "@/components/admin/UserCourseResetManager";
import { FollowupSyncCard } from "@/components/admin/FollowupSyncCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, Eye, Shield, Loader2, Mail, Building, MapPin, UserCheck, Calendar, Trophy, Settings, UserPlus, Bot, UserCog, Star, Crown, Pencil, LayoutDashboard, Trash2, Database, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useUserRoles } from "@/hooks/useUserRoles";
import { LeaderHierarchyManager } from "@/components/users/LeaderHierarchyManager";

// Helper to get untyped supabase client
const getSupabaseClient = () => supabase as unknown as SupabaseClient;

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  company_role: string | null;
  team: string | null;
  regional: string | null;
  points: number;
  badges_count: number;
  last_login: string | null;
  created_at: string;
  is_guaranteed?: boolean;
}

interface UserRole {
  role: "student" | "creator" | "admin" | "lider";
}

const UserManagement: React.FC = () => {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const { getSetting, updateSetting, isLoading: settingsLoading } = useAppSettings();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedUserRoles, setSelectedUserRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTeam, setFilterTeam] = useState<string>("all");
  const [filterRegional, setFilterRegional] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isPointsDialogOpen, setIsPointsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  const ALL_ROLES = ["student", "lider", "creator", "admin"] as const;

  const isAdmin = hasRole("admin");
  const isCreator = hasRole("creator");
  const canAccessPage = isAdmin || isCreator;
  const registrationEnabled = getSetting("registration_enabled", false);

  const handleToggleRegistration = async () => {
    setIsUpdatingSettings(true);
    await updateSetting("registration_enabled", !registrationEnabled);
    setIsUpdatingSettings(false);
  };

  useEffect(() => {
    if (canAccessPage) {
      fetchUsers();
    }
  }, [canAccessPage]);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, filterTeam, filterRegional, users]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(query) ||
          user.full_name?.toLowerCase().includes(query) ||
          user.company_role?.toLowerCase().includes(query)
      );
    }

    if (filterTeam !== "all") {
      filtered = filtered.filter((user) => user.team === filterTeam);
    }

    if (filterRegional !== "all") {
      filtered = filtered.filter((user) => user.regional === filterRegional);
    }

    setFilteredUsers(filtered);
  };

  const fetchUserRoles = async (userId: string) => {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) throw error;
      return (data as UserRole[]).map((r) => r.role);
    } catch (error) {
      console.error("Error fetching user roles:", error);
      return [];
    }
  };

  const handleViewUser = async (user: UserProfile) => {
    setSelectedUser(user);
    const roles = await fetchUserRoles(user.user_id);
    setSelectedUserRoles(roles);
    setIsDialogOpen(true);
  };

  const handleManageRoles = (user: UserProfile) => {
    setSelectedUser(user);
    setIsRoleDialogOpen(true);
  };

  const handleAssignPoints = (user: UserProfile) => {
    setSelectedUser(user);
    setIsPointsDialogOpen(true);
  };

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDeleteUser = (user: UserProfile) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleResetPassword = (user: UserProfile) => {
    setSelectedUser(user);
    setIsResetPasswordDialogOpen(true);
  };


  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "creator":
        return "default";
      case "lider":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case "student":
        return "Estudiante";
      case "lider":
        return "Líder";
      case "creator":
        return "Creador";
      case "admin":
        return "Admin";
      default:
        return role;
    }
  };

  const uniqueTeams = [...new Set(users.map((u) => u.team).filter(Boolean))];
  const uniqueRegionals = [...new Set(users.map((u) => u.regional).filter(Boolean))];

  if (!canAccessPage) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
              <CardTitle>Acceso Restringido</CardTitle>
              <CardDescription>
                No tienes permisos para acceder a esta sección.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Settings className="h-8 w-8 text-primary" />
              Administración
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestiona usuarios, configuraciones y el chatbot de la plataforma
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {users.length} usuarios registrados
          </Badge>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-5 max-w-3xl">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="hierarchy" className="gap-2">
              <Crown className="h-4 w-4" />
              Jerarquía
            </TabsTrigger>
            <TabsTrigger value="sections" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Secciones
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Database className="h-4 w-4" />
              Datos
            </TabsTrigger>
            <TabsTrigger value="chatbot" className="gap-2">
              <Bot className="h-4 w-4" />
              Chatbot
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6 mt-6">

        {/* Platform Settings Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-primary" />
              Configuración de la Plataforma
            </CardTitle>
            <CardDescription>
              Ajustes globales que afectan a todos los usuarios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserPlus className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Permitir Registro de Usuarios</p>
                  <p className="text-sm text-muted-foreground">
                    {registrationEnabled 
                      ? "Los usuarios pueden crear cuentas nuevas desde la página de login" 
                      : "Solo los administradores pueden crear usuarios (registro deshabilitado)"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isUpdatingSettings && <Loader2 className="h-4 w-4 animate-spin" />}
                <Switch 
                  checked={registrationEnabled} 
                  onCheckedChange={handleToggleRegistration}
                  disabled={isUpdatingSettings || settingsLoading}
                />
              </div>
            </div>

            {/* Support Access - Only for creators/admins */}
            {(isCreator || isAdmin) && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-3">
                  <UserCog className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Acceso de Soporte</p>
                    <p className="text-sm text-muted-foreground">
                      Ingresa al perfil de un usuario para revisar su experiencia sin afectar sus datos
                    </p>
                  </div>
                </div>
                <ImpersonateUserDialog />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o cargo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterTeam} onValueChange={setFilterTeam}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Equipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los equipos</SelectItem>
                  {uniqueTeams.map((team) => (
                    <SelectItem key={team} value={team!}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterRegional} onValueChange={setFilterRegional}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Regional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las regionales</SelectItem>
                  {uniqueRegionals.map((regional) => (
                    <SelectItem key={regional} value={regional!}>
                      {regional}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Usuarios ({filteredUsers.length})</CardTitle>
            <CardDescription>
              Lista completa de usuarios con acceso a la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Equipo</TableHead>
                      <TableHead>Regional</TableHead>
                      <TableHead className="text-center">Puntos</TableHead>
                      <TableHead className="text-center">Último acceso</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {getInitials(user.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.full_name || "Sin nombre"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell>{user.company_role || "-"}</TableCell>
                        <TableCell>{user.team || "-"}</TableCell>
                        <TableCell>{user.regional || "-"}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-addi-orange/10 text-addi-orange border-addi-orange/20">
                            {user.points.toLocaleString()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground text-sm">
                          {user.last_login
                            ? format(new Date(user.last_login), "dd MMM yyyy", { locale: es })
                            : "Nunca"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              className="gap-1"
                              title="Editar datos"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResetPassword(user)}
                              className="gap-1"
                              title="Restablecer contraseña"
                            >
                              <KeyRound className="h-4 w-4 text-amber-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAssignPoints(user)}
                              className="gap-1"
                              title="Asignar puntos"
                            >
                              <Star className="h-4 w-4 text-addi-orange" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewUser(user)}
                              className="gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              Ver perfil
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user)}
                              className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No se encontraron usuarios con los filtros aplicados
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedUser?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {getInitials(selectedUser?.full_name || null)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span>{selectedUser?.full_name || "Sin nombre"}</span>
                  <div className="flex gap-2 mt-1">
                    {selectedUserRoles.map((role) => (
                      <Badge key={role} variant={getRoleBadgeVariant(role)}>
                        {getRoleName(role)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </DialogTitle>
              <DialogDescription>
                Información detallada del perfil de usuario
              </DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-6 mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-muted-foreground">
                      <Building className="h-4 w-4" />
                      Cargo
                    </Label>
                    <p className="font-medium">{selectedUser.company_role || "No especificado"}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-muted-foreground">
                      <UserCheck className="h-4 w-4" />
                      Equipo
                    </Label>
                    <p className="font-medium">{selectedUser.team || "No especificado"}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      Regional
                    </Label>
                    <p className="font-medium">{selectedUser.regional || "No especificado"}</p>
                  </div>
                </div>

                {/* Role and Points Management Buttons */}
                <div className="flex justify-center gap-3">
                  <Button
                    onClick={() => {
                      setIsDialogOpen(false);
                      setIsPointsDialogOpen(true);
                    }}
                    variant="outline"
                    className="gap-2"
                  >
                    <Star className="h-4 w-4 text-addi-orange" />
                    Asignar Puntos
                  </Button>
                  <Button
                    onClick={() => {
                      setIsDialogOpen(false);
                      setIsRoleDialogOpen(true);
                    }}
                    variant="outline"
                    className="gap-2"
                  >
                    <UserCog className="h-4 w-4" />
                    Gestionar Roles
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4 text-center">
                      <Trophy className="h-6 w-6 mx-auto text-addi-orange mb-2" />
                      <p className="text-2xl font-bold">{selectedUser.points.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Puntos</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4 text-center">
                      <Shield className="h-6 w-6 mx-auto text-primary mb-2" />
                      <p className="text-2xl font-bold">{selectedUser.badges_count}</p>
                      <p className="text-sm text-muted-foreground">Insignias</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4 text-center">
                      <Calendar className="h-6 w-6 mx-auto text-addi-cyan mb-2" />
                      <p className="text-sm font-medium">
                        {selectedUser.last_login
                          ? format(new Date(selectedUser.last_login), "dd MMM yyyy HH:mm", { locale: es })
                          : "Nunca"}
                      </p>
                      <p className="text-sm text-muted-foreground">Último acceso</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="text-sm text-muted-foreground text-center pt-4 border-t">
                  <p>
                    Usuario registrado el{" "}
                    {format(new Date(selectedUser.created_at), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                  </p>
                  <p className="mt-1 font-mono text-xs">ID: {selectedUser.user_id}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Role Management Dialog */}
        <RoleManagementDialog
          open={isRoleDialogOpen}
          onOpenChange={setIsRoleDialogOpen}
          user={selectedUser}
          onProfileUpdated={fetchUsers}
        />

        {/* Assign Points Dialog */}
        <AssignPointsDialog
          open={isPointsDialogOpen}
          onOpenChange={setIsPointsDialogOpen}
          user={selectedUser}
          onPointsUpdated={fetchUsers}
        />

        {/* Edit User Dialog */}
        <UserEditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          user={selectedUser}
          onUserUpdated={fetchUsers}
        />

        {/* Delete User Dialog */}
        <DeleteUserDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          user={selectedUser}
          onUserDeleted={fetchUsers}
        />

        {/* Reset Password Dialog */}
        <ResetPasswordDialog
          open={isResetPasswordDialogOpen}
          onOpenChange={setIsResetPasswordDialogOpen}
          userEmail={selectedUser?.email || ""}
          userName={selectedUser?.full_name || ""}
          userId={selectedUser?.user_id || ""}
        />
          </TabsContent>

          <TabsContent value="hierarchy" className="mt-6">
            <LeaderHierarchyManager />
          </TabsContent>

          <TabsContent value="sections" className="mt-6">
            <PortalSectionManager />
          </TabsContent>

          <TabsContent value="data" className="mt-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Gestión de Datos</h2>
                <p className="text-muted-foreground">
                  Herramientas para administrar y reiniciar datos del sistema
                </p>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <UserCourseResetManager />
                <DataResetManager />
              </div>
              <FollowupSyncCard />
            </div>
          </TabsContent>

          <TabsContent value="chatbot" className="mt-6">
            <ChatbotSettings />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;
