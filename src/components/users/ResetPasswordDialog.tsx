import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, KeyRound, Eye, EyeOff, AlertCircle, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
  userName: string;
  userId: string;
}

export const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({
  open,
  onOpenChange,
  userEmail,
  userName,
  userId,
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const validatePassword = (password: string): string | null => {
    if (password.length === 0) {
      return "La contraseña es requerida";
    }
    if (password.length > 8) {
      return "La contraseña debe tener máximo 8 caracteres";
    }
    if (password.length < 6) {
      return "La contraseña debe tener mínimo 6 caracteres";
    }
    if (!/^[a-zA-Z0-9]+$/.test(password)) {
      return "La contraseña solo puede contener letras y números";
    }
    return null;
  };

  const handleReset = async () => {
    setError(null);

    const validationError = validatePassword(newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // Call edge function to reset password (requires service role)
      const { data, error: resetError } = await supabase.functions.invoke("reset-user-password", {
        body: { userId, newPassword },
      });

      if (resetError) throw resetError;

      if (data?.error) throw new Error(data.error);

      // Mark that the user needs to change password again on next login
      await supabase
        .from("profiles")
        .update({ password_changed: false })
        .eq("user_id", userId);

      toast({
        title: "Contraseña restablecida",
        description: `La contraseña de ${userName || userEmail} ha sido restablecida. El usuario deberá cambiarla al iniciar sesión.`,
      });

      setNewPassword("");
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error resetting password:", err);
      setError(err.message || "Error al restablecer la contraseña");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNewPassword("");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Restablecer Contraseña
          </DialogTitle>
          <DialogDescription>
            Establece una nueva contraseña temporal para este usuario.
            El usuario deberá cambiarla obligatoriamente en su próximo inicio de sesión.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{userName || "Sin nombre"}</p>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="tempPassword">Nueva Contraseña Temporal</Label>
            <div className="relative">
              <Input
                id="tempPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Entre 6 y 8 caracteres alfanuméricos"
                maxLength={8}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {newPassword.length}/8 caracteres (solo letras y números)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleReset} disabled={isLoading || !newPassword}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Restableciendo...
              </>
            ) : (
              "Restablecer Contraseña"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
