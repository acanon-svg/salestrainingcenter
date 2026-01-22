import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, Lock, Trophy, Star, Target, Flame, Zap, BookOpen, Crown, Medal } from "lucide-react";

// Mock data - will be replaced with real data from database
const mockBadges = [
  {
    id: "1",
    name: "Primer Paso",
    description: "Completa tu primer curso",
    icon_emoji: "🎓",
    criteria_type: "courses_completed",
    criteria_value: 1,
    earned: true,
    earned_at: "2024-01-15",
  },
  {
    id: "2",
    name: "Racha de Fuego",
    description: "Completa 5 cursos seguidos con más de 80%",
    icon_emoji: "🔥",
    criteria_type: "streak",
    criteria_value: 5,
    earned: true,
    earned_at: "2024-02-01",
  },
  {
    id: "3",
    name: "Perfeccionista",
    description: "Obtén 100% en un quiz",
    icon_emoji: "⭐",
    criteria_type: "score_threshold",
    criteria_value: 100,
    earned: true,
    earned_at: "2024-02-10",
  },
  {
    id: "4",
    name: "Velocista",
    description: "Completa un curso en menos de 30 minutos",
    icon_emoji: "⚡",
    criteria_type: "custom",
    criteria_value: null,
    earned: true,
    earned_at: "2024-01-20",
  },
  {
    id: "5",
    name: "Experto",
    description: "Completa 10 cursos",
    icon_emoji: "🏆",
    criteria_type: "courses_completed",
    criteria_value: 10,
    earned: false,
    progress: 8,
  },
  {
    id: "6",
    name: "Maestro del Quiz",
    description: "Obtén 90% o más en 5 quizzes",
    icon_emoji: "🧠",
    criteria_type: "score_threshold",
    criteria_value: 5,
    earned: false,
    progress: 3,
  },
  {
    id: "7",
    name: "Colaborador",
    description: "Envía 5 feedbacks útiles",
    icon_emoji: "💬",
    criteria_type: "custom",
    criteria_value: 5,
    earned: false,
    progress: 2,
  },
  {
    id: "8",
    name: "Veterano",
    description: "Completa 25 cursos",
    icon_emoji: "🎖️",
    criteria_type: "courses_completed",
    criteria_value: 25,
    earned: false,
    progress: 8,
  },
  {
    id: "9",
    name: "Top 10",
    description: "Alcanza el Top 10 del ranking",
    icon_emoji: "👑",
    criteria_type: "custom",
    criteria_value: null,
    earned: false,
    progress: 0,
  },
  {
    id: "10",
    name: "Explorador",
    description: "Completa cursos de todas las dimensiones",
    icon_emoji: "🧭",
    criteria_type: "custom",
    criteria_value: 4,
    earned: false,
    progress: 2,
  },
];

const Badges: React.FC = () => {
  const { profile } = useAuth();

  const earnedBadges = mockBadges.filter((b) => b.earned);
  const pendingBadges = mockBadges.filter((b) => !b.earned);

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Award className="w-8 h-8 text-primary" />
            Insignias
          </h1>
          <p className="text-muted-foreground">
            Logros y reconocimientos por tu desempeño
          </p>
        </div>

        {/* Stats Card */}
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-around gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-addi-yellow/20 mx-auto mb-2">
                  <Trophy className="w-8 h-8 text-addi-yellow" />
                </div>
                <p className="text-3xl font-bold">{earnedBadges.length}</p>
                <p className="text-sm text-muted-foreground">Obtenidas</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mx-auto mb-2">
                  <Lock className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold">{pendingBadges.length}</p>
                <p className="text-sm text-muted-foreground">Por desbloquear</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mx-auto mb-2">
                  <Star className="w-8 h-8 text-primary" />
                </div>
                <p className="text-3xl font-bold">{profile?.points?.toLocaleString() || 0}</p>
                <p className="text-sm text-muted-foreground">Puntos totales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Earned Badges */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="w-5 h-5 text-addi-yellow" />
              Insignias Obtenidas
            </CardTitle>
            <CardDescription>
              ¡Felicidades! Has conseguido estas insignias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {earnedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="relative p-4 rounded-xl border border-primary/20 bg-primary/5 text-center transition-transform hover:scale-105"
                >
                  <span className="text-4xl mb-3 block">{badge.icon_emoji}</span>
                  <h3 className="font-semibold mb-1">{badge.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{badge.description}</p>
                  <Badge variant="secondary" className="text-xs">
                    Obtenida
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Badges */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Por Desbloquear
            </CardTitle>
            <CardDescription>
              Sigue avanzando para obtener estas insignias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pendingBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="relative p-4 rounded-xl border border-border bg-muted/30"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <span className="text-4xl opacity-40 grayscale">{badge.icon_emoji}</span>
                      <Lock className="absolute -bottom-1 -right-1 w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{badge.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3">{badge.description}</p>
                      {badge.criteria_value && badge.progress !== undefined && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Progreso</span>
                            <span>
                              {badge.progress}/{badge.criteria_value}
                            </span>
                          </div>
                          <Progress
                            value={(badge.progress / badge.criteria_value) * 100}
                            className="h-2"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Badges;
