import React, { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
}

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  onUserDeleted: () => void;
}

export const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({
  open,
  onOpenChange,
  user,
  onUserDeleted,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");

  const handleDelete = async () => {
    if (!user) return;

    if (confirmEmail !== user.email) {
      toast({
        title: "Error",
        description: "El email ingresado no coincide",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No hay sesión activa");
      }

      const response = await supabase.functions.invoke("delete-user", {
        body: { userId: user.user_id },
      });

      if (response.error) {
        throw new Error(response.error.message || "Error al eliminar usuario");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: "Usuario eliminado",
        description: `${user.full_name || user.email} ha sido eliminado de la plataforma.`,
      });

      setConfirmEmail("");
      onUserDeleted();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmEmail("");
    }
    onOpenChange(newOpen);
  };

  const isConfirmValid = confirmEmail === user?.email;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Eliminar Usuario
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Estás a punto de eliminar permanentemente a{" "}
              <strong>{user?.full_name || "este usuario"}</strong>.
            </p>
            <p className="text-destructive font-medium">
              Esta acción no se puede deshacer. Se eliminarán:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li>La cuenta de acceso del usuario</li>
              <li>El perfil y datos personales</li>
              <li>Roles y permisos asignados</li>
              <li>Relaciones de jerarquía de liderazgo</li>
              <li>Progreso en cursos y materiales</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-4">
          <Label htmlFor="confirm-email" className="text-sm font-medium">
            Para confirmar, escribe el email del usuario:
          </Label>
          <p className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
            {user?.email}
          </p>
          <Input
            id="confirm-email"
            type="email"
            placeholder="Escribe el email para confirmar"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            className={isConfirmValid ? "border-destructive" : ""}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading || !isConfirmValid}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Eliminar Usuario
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
