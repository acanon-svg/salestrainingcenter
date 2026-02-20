import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Shield,
  Palette,
  Users,
  BarChart3,
  CheckCircle2,
  X,
  Eye,
} from "lucide-react";

type AppRole = "student" | "creator" | "admin" | "lider" | "analista" | "qa";

const roleConfig: { role: AppRole; label: string; icon: React.ElementType; color: string }[] = [
  { role: "student", label: "Estudiante", icon: GraduationCap, color: "bg-blue-500" },
  { role: "lider", label: "Líder", icon: Users, color: "bg-amber-500" },
  { role: "creator", label: "Creador", icon: Palette, color: "bg-purple-500" },
  { role: "admin", label: "Admin", icon: Shield, color: "bg-red-500" },
  { role: "analista", label: "Analista", icon: BarChart3, color: "bg-emerald-500" },
  { role: "qa", label: "QA", icon: CheckCircle2, color: "bg-cyan-500" },
];

export const DemoModeSelector: React.FC = () => {
  const { demoMode, demoActiveRole, setDemoActiveRole, toggleDemoMode } = useAuth();

  if (!demoMode) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Modo Demo</span>
            {demoActiveRole && (
              <Badge variant="secondary" className="text-xs">
                Viendo como: {roleConfig.find(r => r.role === demoActiveRole)?.label}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {roleConfig.map(({ role, label, icon: Icon, color }) => (
              <Button
                key={role}
                size="sm"
                variant={demoActiveRole === role ? "default" : "outline"}
                className={`gap-1.5 text-xs h-8 ${demoActiveRole === role ? "" : "hover:bg-accent"}`}
                onClick={() => setDemoActiveRole(demoActiveRole === role ? null : role)}
              >
                <span className={`w-2 h-2 rounded-full ${color}`} />
                {label}
              </Button>
            ))}
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={toggleDemoMode}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
