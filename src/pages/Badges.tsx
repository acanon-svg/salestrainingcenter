import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useBadges, useMyBadges } from "@/hooks/useBadges";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Lock, Trophy, Star, Target, Medal } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const Badges: React.FC = () => {
  const { profile } = useAuth();
  const { data: allBadges, isLoading: loadingBadges } = useBadges();
  const { data: myBadges, isLoading: loadingMyBadges } = useMyBadges();

  const earnedBadgeIds = new Set(myBadges?.map((ub) => ub.badge_id) || []);
  
  const earnedBadges = allBadges?.filter((b) => earnedBadgeIds.has(b.id)) || [];
  const pendingBadges = allBadges?.filter((b) => !earnedBadgeIds.has(b.id)) || [];

  const isLoading = loadingBadges || loadingMyBadges;

  const getEarnedDate = (badgeId: string) => {
    const userBadge = myBadges?.find((ub) => ub.badge_id === badgeId);
    return userBadge?.earned_at;
  };

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
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-addi-orange/20 mx-auto mb-2">
                  <Trophy className="w-8 h-8 text-addi-orange" />
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
              <Medal className="w-5 h-5 text-addi-orange" />
              Insignias Obtenidas
            </CardTitle>
            <CardDescription>
              ¡Felicidades! Has conseguido estas insignias
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-40 w-full" />
                ))}
              </div>
            ) : earnedBadges.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {earnedBadges.map((badge) => {
                  const earnedDate = getEarnedDate(badge.id);
                  return (
                    <div
                      key={badge.id}
                      className="relative p-4 rounded-xl border border-primary/20 bg-primary/5 text-center transition-transform hover:scale-105"
                    >
                      <span className="text-4xl mb-3 block">{badge.icon_emoji || "🏆"}</span>
                      <h3 className="font-semibold mb-1">{badge.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{badge.description}</p>
                      <Badge variant="secondary" className="text-xs">
                        {earnedDate
                          ? format(new Date(earnedDate), "d MMM yyyy", { locale: es })
                          : "Obtenida"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">Aún no has obtenido insignias</p>
                <p className="text-sm text-muted-foreground">Completa cursos para desbloquear logros</p>
              </div>
            )}
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
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : pendingBadges.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pendingBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="relative p-4 rounded-xl border border-border bg-muted/30"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <span className="text-4xl opacity-40 grayscale">{badge.icon_emoji || "🏆"}</span>
                        <Lock className="absolute -bottom-1 -right-1 w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{badge.name}</h3>
                        <p className="text-xs text-muted-foreground mb-3">{badge.description}</p>
                        <Badge variant="outline" className="text-xs">
                          +{badge.points_reward} puntos
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">¡Has desbloqueado todas las insignias!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Badges;
