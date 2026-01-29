import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Pencil, User, Mail, Building, Users, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

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
}

interface UserEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  onUserUpdated: () => void;
}

export const UserEditDialog: React.FC<UserEditDialogProps> = ({
  open,
  onOpenChange,
  user,
  onUserUpdated,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    company_role: "",
    team: "",
    regional: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        company_role: user.company_role || "",
        team: user.team || "",
        regional: user.regional || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const client = getSupabaseClient();
      const { error } = await client
        .from("profiles")
        .update({
          full_name: formData.full_name || null,
          company_role: formData.company_role || null,
          team: formData.team || null,
          regional: formData.regional || null,
        })
        .eq("user_id", user.user_id);

      if (error) throw error;

      toast({
        title: "Usuario actualizado",
        description: "Los datos del usuario han sido corregidos correctamente.",
      });

      onUserUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Editar Datos de Usuario
          </DialogTitle>
          <DialogDescription>
            Corrige errores de tipeo en los datos de registro del usuario.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="full_name" className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Nombre Completo
            </Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Nombre del usuario"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email (Solo lectura)
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              El email de acceso no puede ser modificado desde aquí. El usuario debe iniciar sesión con su email original registrado.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_role" className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              Cargo
            </Label>
            <Input
              id="company_role"
              value={formData.company_role}
              onChange={(e) => setFormData({ ...formData, company_role: e.target.value })}
              placeholder="Cargo en la empresa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team" className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Equipo
            </Label>
            <Input
              id="team"
              value={formData.team}
              onChange={(e) => setFormData({ ...formData, team: e.target.value })}
              placeholder="Equipo del usuario"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="regional" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Regional
            </Label>
            <Input
              id="regional"
              value={formData.regional}
              onChange={(e) => setFormData({ ...formData, regional: e.target.value })}
              placeholder="Regional del usuario"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
