import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, LogOut } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface InactivityWarningDialogProps {
  open: boolean;
  remainingSeconds: number;
  onContinue: () => void;
  onLogout: () => void;
}

export const InactivityWarningDialog: React.FC<InactivityWarningDialogProps> = ({
  open,
  remainingSeconds,
  onContinue,
  onLogout,
}) => {
  const progressValue = (remainingSeconds / 60) * 100;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <Clock className="h-5 w-5" />
            Sesión por Expirar
          </DialogTitle>
          <DialogDescription>
            Tu sesión se cerrará automáticamente por inactividad.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-foreground mb-2">
              {remainingSeconds}
            </div>
            <p className="text-sm text-muted-foreground">
              segundos restantes
            </p>
          </div>

          <Progress value={progressValue} className="h-2" />

          <p className="text-center text-sm text-muted-foreground">
            ¿Deseas continuar con tu sesión activa?
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
          <Button onClick={onContinue} className="flex items-center gap-2">
            Continuar Sesión
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
