import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserCog, Loader2, Eye, EyeOff } from "lucide-react";

interface ImpersonateUserDialogProps {
  onSuccess?: () => void;
}

export const ImpersonateUserDialog: React.FC<ImpersonateUserDialogProps> = ({
  onSuccess,
}) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleImpersonate = async () => {
    if (!email || !password) {
      toast({
        title: "Campos requeridos",
        description: "Por favor ingresa el correo y la contraseña universal",
        variant: "destructive",
      });
      return;
    }

    if (!email.endsWith("@addi.com")) {
      toast({
        title: "Correo inválido",
        description: "Solo se permiten correos con dominio @addi.com",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        toast({
          title: "No autorizado",
          description: "Debes iniciar sesión primero",
          variant: "destructive",
        });
        return;
      }

      const response = await supabase.functions.invoke("creator-impersonate", {
        body: {
          targetEmail: email,
          password: password,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Error al acceder al perfil");
      }

      const data = response.data;

      if (!data.success) {
        throw new Error(data.error || "Error desconocido");
      }

      // Use verifyOtp with the token hash to sign in
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.tokenHash,
        type: "magiclink",
      });

      if (verifyError) {
        throw new Error(verifyError.message);
      }

      toast({
        title: "Acceso exitoso",
        description: `Ahora estás viendo el perfil de ${data.email}`,
      });

      setOpen(false);
      setEmail("");
      setPassword("");
      
      // Refresh the page to load the new session
      window.location.href = "/dashboard";
      
      onSuccess?.();
    } catch (error: any) {
      console.error("Error impersonating user:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo acceder al perfil",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserCog className="h-4 w-4" />
          Acceso de Soporte
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Acceso de Soporte</DialogTitle>
          <DialogDescription>
            Ingresa al perfil de un usuario para revisar su experiencia sin afectar
            sus datos, progreso o credenciales.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="target-email">Correo del usuario</Label>
            <Input
              id="target-email"
              type="email"
              placeholder="usuario@addi.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="universal-password">Contraseña Universal</Label>
            <div className="relative">
              <Input
                id="universal-password"
                type={showPassword ? "text" : "password"}
                placeholder="Ingresa la contraseña universal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
            <p>
              <strong>Nota:</strong> Esta función está disponible solo para
              creadores de cursos y administradores. El acceso no modifica
              ningún dato del usuario.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleImpersonate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accediendo...
              </>
            ) : (
              "Acceder al Perfil"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
