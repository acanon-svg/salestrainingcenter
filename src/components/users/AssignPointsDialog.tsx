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
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Loader2, Plus, Minus } from "lucide-react";
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
  points: number;
}

interface AssignPointsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  onPointsUpdated: () => void;
}

export const AssignPointsDialog: React.FC<AssignPointsDialogProps> = ({
  open,
  onOpenChange,
  user,
  onPointsUpdated,
}) => {
  const { toast } = useToast();
  const [points, setPoints] = useState<number>(10);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operation, setOperation] = useState<"add" | "subtract">("add");

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSubmit = async () => {
    if (!user || points <= 0) {
      toast({
        title: "Error",
        description: "Por favor ingresa una cantidad válida de puntos",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const client = getSupabaseClient();
      const pointsChange = operation === "add" ? points : -points;
      const newPoints = Math.max(0, user.points + pointsChange);

      const { error } = await client
        .from("profiles")
        .update({ points: newPoints })
        .eq("user_id", user.user_id);

      if (error) throw error;

      toast({
        title: operation === "add" ? "Puntos asignados" : "Puntos restados",
        description: `${operation === "add" ? "Se agregaron" : "Se restaron"} ${points} puntos a ${user.full_name || user.email}${reason ? `. Motivo: ${reason}` : ""}`,
      });

      onPointsUpdated();
      onOpenChange(false);
      setPoints(10);
      setReason("");
      setOperation("add");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron actualizar los puntos",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickPoints = [10, 25, 50, 100, 200];

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-addi-orange" />
            Asignar Puntos
          </DialogTitle>
          <DialogDescription>
            Asigna o resta puntos a un usuario por actividades fuera de la plataforma
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{user.full_name || "Sin nombre"}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Puntos actuales</p>
              <p className="text-lg font-bold text-addi-orange">{user.points.toLocaleString()}</p>
            </div>
          </div>

          {/* Operation Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={operation === "add" ? "default" : "outline"}
              onClick={() => setOperation("add")}
              className="flex-1 gap-2"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
            <Button
              type="button"
              variant={operation === "subtract" ? "destructive" : "outline"}
              onClick={() => setOperation("subtract")}
              className="flex-1 gap-2"
            >
              <Minus className="h-4 w-4" />
              Restar
            </Button>
          </div>

          {/* Points Input */}
          <div className="space-y-2">
            <Label htmlFor="points">Cantidad de puntos</Label>
            <Input
              id="points"
              type="number"
              min="1"
              value={points}
              onChange={(e) => setPoints(Math.max(1, parseInt(e.target.value) || 0))}
              className="text-lg font-semibold text-center"
            />
            <div className="flex gap-2 flex-wrap">
              {quickPoints.map((qp) => (
                <Button
                  key={qp}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPoints(qp)}
                  className={points === qp ? "border-primary bg-primary/10" : ""}
                >
                  {qp}
                </Button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Textarea
              id="reason"
              placeholder="Ej: Participación en sesión virtual, logro en actividad externa..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Preview */}
          <div className="p-3 bg-muted/50 rounded-lg border">
            <p className="text-sm text-muted-foreground text-center">
              Nuevo total de puntos:
            </p>
            <p className="text-2xl font-bold text-center text-primary">
              {Math.max(0, operation === "add" ? user.points + points : user.points - points).toLocaleString()}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || points <= 0}
            className="gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {operation === "add" ? "Agregar Puntos" : "Restar Puntos"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
